'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Calendar, Loader2, CheckCircle2, AlertTriangle, XCircle, RotateCw, ExternalLink, Plug } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { postsApi, errorMessage } from '@/lib/api';
import { PLATFORMS, wordCountOf } from '@/lib/platforms';
import { formatDateTime } from '@/lib/dates';
import { toast } from '@/lib/toast';
import type { Post, PlatformStatus } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  connected: Record<string, boolean>;
  onPostUpdated: (post: Post) => void;
}

type Check = { level: 'error' | 'warn' | 'ok'; text: string };

/** Local datetime-local value 5 minutes from now, as the input's min. */
const localMin = () => { const d = new Date(Date.now() + 5 * 60_000); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };

export function PublishDialog({ open, onOpenChange, post, connected, onPostUpdated }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [schedule, setSchedule] = useState(false);
  const [when, setWhen] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<'choose' | 'progress'>('choose');
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusOf = (id: string): PlatformStatus | undefined => post?.platforms?.[id];

  useEffect(() => {
    if (!open || !post) return;
    setPhase('choose'); setSchedule(false); setWhen(''); setScheduledFor(null);
    // Preselect connected platforms that haven't been published yet.
    setSelected(new Set(PLATFORMS.filter(p => connected[p.id] && post.platforms?.[p.id]?.status !== 'PUBLISHED').map(p => p.id)));
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id]);

  const checks = useMemo<Check[]>(() => {
    if (!post) return [];
    const out: Check[] = [];
    const words = wordCountOf(post.bodyMarkdown);
    out.push(post.title?.trim() ? { level: 'ok', text: 'Has a title' } : { level: 'error', text: 'Add a title before publishing' });
    out.push(words > 0 ? { level: 'ok', text: `${words} words` } : { level: 'error', text: 'The post is empty' });
    if (!post.coverImageUrl) out.push({ level: 'warn', text: 'No cover image — Dev.to and Hashnode posts look better with one' });
    if (!(post.tags || []).length) out.push({ level: 'warn', text: 'No tags — they help readers find your post' });
    if (selected.has('twitter') && words > 400) out.push({ level: 'warn', text: 'X: this will become a long thread. Consider a shorter version (AI assistant → Social posts)' });
    if (selected.has('devto') && (post.tags || []).length > 4) out.push({ level: 'warn', text: 'Dev.to allows at most 4 tags' });
    return out;
  }, [post, selected]);

  const blocked = checks.some(c => c.level === 'error');
  const whenValid = !schedule || (when && new Date(when).getTime() > Date.now() + 60_000);

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const poll = (attempt = 0) => {
    if (!post) return;
    pollRef.current = setTimeout(async () => {
      try {
        const { data } = await postsApi.getById(post.id);
        onPostUpdated(data);
        const pending = Object.values(data.platforms || {}).some(s => s?.status === 'PENDING');
        if (pending && attempt < 40) poll(attempt + 1);
      } catch { /* keep the last known state */ }
    }, 1800);
  };

  const submit = async (platforms: string[], isRetry = false) => {
    if (!post) return;
    setSubmitting(true);
    try {
      const scheduling = !isRetry && schedule && !!when;
      await postsApi.publish(post.id, {
        platforms,
        // Send UTC without a zone suffix: the server stores UTC wall-clock times.
        ...(scheduling ? { scheduledAt: new Date(when).toISOString().slice(0, 19) } : {}),
      });
      const { data } = await postsApi.getById(post.id);
      onPostUpdated(data);
      if (scheduling) { setScheduledFor(data.scheduledAt ?? null); toast.success('Scheduled'); }
      setPhase('progress');
      poll();
    } catch (e) {
      toast.error(errorMessage(e, 'Publishing failed. Please try again.'));
    } finally { setSubmitting(false); }
  };

  if (!post) return null;
  const targets = [...selected];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send size={15} className="text-indigo-400" /> {phase === 'choose' ? 'Publish' : scheduledFor ? 'Scheduled' : 'Publishing'}</DialogTitle>
          <DialogDescription>“{post.title || 'Untitled'}”</DialogDescription>
        </DialogHeader>

        {phase === 'choose' ? (
          <>
            <fieldset>
              <legend className="text-[11px] font-medium tracking-wider uppercase text-[#71717a] mb-2">Where to?</legend>
              <div className="space-y-1.5">
                {PLATFORMS.map(p => {
                  const I = p.icon;
                  const done = statusOf(p.id)?.status === 'PUBLISHED';
                  const isOn = selected.has(p.id);
                  if (!connected[p.id]) return (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-[#252525] text-[#71717a]">
                      <span className="flex items-center gap-2.5 text-[13px]"><I size={14} />{p.name}</span>
                      <a href="/settings" className="flex items-center gap-1 text-[12px] text-indigo-400 hover:text-indigo-300"><Plug size={12} /> Connect</a>
                    </div>);
                  return (
                    <button key={p.id} disabled={done} onClick={() => toggle(p.id)} aria-pressed={isOn}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${done ? 'border-[#1f1f1f] opacity-60' : isOn ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-[#252525] bg-[#141414] hover:border-[#3a3a3a]'}`}>
                      <span className="flex items-center gap-2.5 text-[13px] text-[#e4e4e7]"><I size={14} className={isOn ? 'text-indigo-400' : 'text-[#71717a]'} />{p.name}</span>
                      {done ? <span className="text-[11px] text-emerald-400">Already published</span>
                        : <span className={`w-4 h-4 rounded border flex items-center justify-center ${isOn ? 'bg-indigo-500 border-indigo-500' : 'border-[#3a3a3a]'}`}>{isOn && <CheckCircle2 size={10} className="text-white" />}</span>}
                    </button>);
                })}
              </div>
            </fieldset>

            <ul className="space-y-1 mt-1" aria-label="Pre-publish checks">
              {checks.map((c, i) => (
                <li key={i} className={`flex items-start gap-2 text-[12px] ${c.level === 'error' ? 'text-red-300' : c.level === 'warn' ? 'text-amber-300' : 'text-[#71717a]'}`}>
                  {c.level === 'ok' ? <CheckCircle2 size={13} className="mt-0.5 text-emerald-500 shrink-0" /> : c.level === 'warn' ? <AlertTriangle size={13} className="mt-0.5 shrink-0" /> : <XCircle size={13} className="mt-0.5 shrink-0" />}
                  {c.text}
                </li>))}
            </ul>

            <div className="flex rounded-lg border border-[#252525] p-0.5 bg-[#141414]" role="radiogroup" aria-label="When">
              {[{ v: false, label: 'Publish now', I: Send }, { v: true, label: 'Schedule for later', I: Calendar }].map(o => (
                <button key={String(o.v)} role="radio" aria-checked={schedule === o.v} onClick={() => setSchedule(o.v)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium ${schedule === o.v ? 'bg-white/10 text-white' : 'text-[#71717a] hover:text-[#d4d4d4]'}`}><o.I size={12} />{o.label}</button>))}
            </div>
            {schedule && (
              <div>
                <input type="datetime-local" value={when} min={localMin()} onChange={e => setWhen(e.target.value)} aria-label="Publish date and time"
                  className="w-full px-2.5 py-1.5 bg-[#1a1a1a] border border-[#252525] rounded-md text-[13px] text-[#d4d4d4] focus:outline-none focus:border-indigo-500" />
                <p className="text-[11px] text-[#52525b] mt-1.5">
                  {when ? `Goes out ${new Date(when).toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Pick a date and time'} · your time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
              </div>)}

            <DialogFooter className="mt-1">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button size="sm" disabled={blocked || targets.length === 0 || !whenValid || submitting} onClick={() => submit(targets)}>
                {submitting ? <Loader2 size={12} className="animate-spin" /> : schedule ? <Calendar size={12} /> : <Send size={12} />}
                {schedule ? 'Schedule' : `Publish to ${targets.length || ''} platform${targets.length === 1 ? '' : 's'}`.replace('  ', ' ')}
              </Button>
            </DialogFooter>
          </>
        ) : scheduledFor ? (
          <>
            <div className="flex flex-col items-center text-center py-4">
              <CheckCircle2 size={30} className="text-violet-300 mb-2" />
              <p className="text-[14px] text-white font-medium">All set</p>
              <p className="text-[12px] text-[#71717a] mt-1">Echo will publish this on {formatDateTime(scheduledFor)}. You can cancel from the Posts list or the Calendar.</p>
            </div>
            <DialogFooter><Button size="sm" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
          </>
        ) : (
          <>
            <ul className="space-y-1.5">
              {targets.map(id => {
                const p = PLATFORMS.find(x => x.id === id)!; const I = p.icon; const s = statusOf(id);
                return (
                  <li key={id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#252525] bg-[#141414]">
                    <span className="flex items-center gap-2.5 text-[13px] text-[#e4e4e7]"><I size={14} className="text-[#71717a]" />{p.name}</span>
                    {(!s || s.status === 'PENDING') ? <span className="flex items-center gap-1.5 text-[12px] text-amber-300"><Loader2 size={12} className="animate-spin" /> Publishing…</span>
                      : s.status === 'PUBLISHED' ? <span className="flex items-center gap-2 text-[12px] text-emerald-400"><CheckCircle2 size={13} /> Published{s.url && <a href={s.url} target="_blank" rel="noreferrer" aria-label={`Open on ${p.name}`}><ExternalLink size={12} /></a>}</span>
                      : <span className="flex items-center gap-2 text-[12px] text-red-300"><XCircle size={13} /> Failed
                          <button onClick={() => submit([id], true)} disabled={submitting} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200"><RotateCw size={11} /> Retry</button></span>}
                  </li>);
              })}
            </ul>
            {targets.map(id => statusOf(id)?.status === 'FAILED' && statusOf(id)?.error && (
              <p key={id} className="text-[11px] text-red-300/80 bg-red-500/5 rounded-md px-2.5 py-1.5">{PLATFORMS.find(p => p.id === id)?.name}: {statusOf(id)!.error}</p>))}
            <DialogFooter><Button size="sm" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
