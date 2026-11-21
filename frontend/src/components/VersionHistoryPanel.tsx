'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Clock, RotateCcw, Loader2, Bookmark, Star, Sparkles, Send, Undo2, Pencil } from 'lucide-react';
import { postsApi, errorMessage } from '@/lib/api';
import { timeAgo, parseServerDate } from '@/lib/dates';
import { wordDiff, diffStats } from '@/lib/diff';
import { toast } from '@/lib/toast';
import type { Post, VersionSummary, VersionDetail, VersionReason } from '@/types';

interface Props {
  postId: string;
  /** The text currently in the editor, used to show what a version would change. */
  currentMarkdown: string;
  isOpen: boolean;
  onClose: () => void;
  onRestored: (post: Post) => void;
}

const REASON: Record<VersionReason, { label: string; icon: typeof Clock; tone: string }> = {
  AUTO: { label: 'Auto-saved', icon: Clock, tone: 'text-zinc-500' },
  MANUAL: { label: 'Saved by you', icon: Bookmark, tone: 'text-indigo-400' },
  PUBLISH: { label: 'Published', icon: Send, tone: 'text-emerald-400' },
  SCHEDULE: { label: 'Scheduled', icon: Send, tone: 'text-emerald-400' },
  PRE_AI: { label: 'Before AI edit', icon: Sparkles, tone: 'text-violet-400' },
  PRE_RESTORE: { label: 'Before restore', icon: Undo2, tone: 'text-amber-400' },
};

function dayLabel(iso: string): string {
  const d = parseServerDate(iso) ?? new Date(iso);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function VersionHistoryPanel({ postId, currentMarkdown, isOpen, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [naming, setNaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setVersions((await postsApi.versions(postId)).data); }
    catch (e) { setError(errorMessage(e, 'Could not load version history.')); }
    finally { setIsLoading(false); }
  }, [postId]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(null); setDetail(null); setConfirming(false); setNaming(false);
    void load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;
    postsApi.version(postId, selectedId)
      .then(r => { if (!cancelled) setDetail(r.data); })
      .catch(e => toast.error(errorMessage(e, 'Could not open that version.')));
    return () => { cancelled = true; };
  }, [postId, selectedId]);

  const groups = useMemo(() => {
    const out: { day: string; items: VersionSummary[] }[] = [];
    for (const v of versions) {
      const day = dayLabel(v.savedAt);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(v); else out.push({ day, items: [v] });
    }
    return out;
  }, [versions]);

  const diff = useMemo(() => (detail ? wordDiff(detail.bodyMarkdown ?? '', currentMarkdown) : []), [detail, currentMarkdown]);
  const stats = diffStats(diff);

  const saveNamed = async () => {
    setIsSaving(true);
    try {
      await postsApi.saveVersion(postId, nameInput.trim() || undefined);
      toast.success('Version saved. It will be kept until you unpin it.');
      setNaming(false); setNameInput('');
      await load();
    } catch (e) { toast.error(errorMessage(e)); }
    finally { setIsSaving(false); }
  };

  const restore = async () => {
    if (!selectedId) return;
    setIsRestoring(true);
    try {
      const { data } = await postsApi.restoreVersion(postId, selectedId);
      onRestored(data);
      toast.success('Version restored. Your previous text was saved — find it under “Before restore”.');
      onClose();
    } catch (e) { toast.error(errorMessage(e, 'Could not restore this version.')); }
    finally { setIsRestoring(false); setConfirming(false); }
  };

  const togglePin = async (v: VersionSummary) => {
    try {
      const { data } = await postsApi.updateVersion(postId, v.id, { pinned: !v.pinned });
      setVersions(list => list.map(x => (x.id === v.id ? { ...x, ...data } : x)));
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const rename = async (v: VersionSummary, label: string) => {
    if ((v.label ?? '') === label.trim()) return;
    try {
      const { data } = await postsApi.updateVersion(postId, v.id, { label: label.trim() });
      setVersions(list => list.map(x => (x.id === v.id ? { ...x, ...data } : x)));
    } catch (e) { toast.error(errorMessage(e)); }
  };

  if (!isOpen) return null;
  const selected = versions.find(v => v.id === selectedId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto w-[440px] max-w-full bg-[#111111] border-l border-white/8 h-full flex flex-col shadow-2xl" aria-label="Version history">
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h2 className="text-sm font-semibold text-white">Version history</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Pick a version to see what changed, then restore it.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white"><X size={16} /></button>
        </header>

        <div className="px-5 py-3 border-b border-white/8">
          {naming ? (
            <div className="flex gap-2">
              <input autoFocus value={nameInput} maxLength={80} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void saveNamed(); if (e.key === 'Escape') setNaming(false); }}
                placeholder="Name it (optional), e.g. “First draft”"
                className="flex-1 px-3 py-1.5 bg-[#1a1a1a] border border-[#252525] rounded-md text-[12px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500" />
              <button onClick={saveNamed} disabled={isSaving} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-[12px] font-medium rounded-md">
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setNaming(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-[#2e2e2e] hover:border-indigo-500/50 hover:text-indigo-300 text-zinc-400 text-[12px] rounded-md transition-colors">
              <Bookmark size={13} /> Save a version of what you have now
            </button>
          )}
        </div>

        {selected && detail && (
          <section className="border-b border-white/8 p-4 bg-black/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-zinc-500">
                Compared with your current text:
                <span className="text-emerald-400"> +{stats.added}</span>
                <span className="text-red-400"> −{stats.removed}</span> words
              </p>
              <label className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Pencil size={10} />
                <input defaultValue={selected.label ?? ''} key={selected.id} maxLength={80} placeholder="Add a name"
                  onBlur={e => void rename(selected, e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none w-32 text-zinc-300 placeholder-zinc-600" />
              </label>
            </div>
            <div className="bg-black/30 rounded-lg p-3 max-h-48 overflow-y-auto text-[12px] leading-relaxed">
              {diff.length === 0 || (stats.added === 0 && stats.removed === 0) ? (
                <p className="text-zinc-500">Same as your current text.</p>
              ) : diff.map((t, i) => (
                <span key={i} className={
                  t.type === 'removed' ? 'text-red-400 line-through bg-red-950/40 rounded px-0.5' :
                  t.type === 'added' ? 'text-emerald-400 bg-emerald-950/40 rounded px-0.5' : 'text-zinc-400'}>{t.text} </span>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5">
              <span className="text-red-400">Red</span> = in this version but not in your text now · <span className="text-emerald-400">green</span> = in your text now only.
            </p>
            {confirming ? (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[12px] text-amber-200 mb-2">Replace your current text with this version? We save your current text first, so you can always undo.</p>
                <div className="flex gap-2">
                  <button onClick={restore} disabled={isRestoring} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-[12px] font-semibold rounded-md">
                    {isRestoring ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Yes, restore
                  </button>
                  <button onClick={() => setConfirming(false)} className="px-3 py-2 text-[12px] text-zinc-400 hover:text-white">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[12px] font-semibold rounded-md">
                <RotateCcw size={12} /> Restore this version
              </button>
            )}
          </section>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-zinc-600" /></div>
          ) : error ? (
            <div className="p-5 text-center">
              <p className="text-[12px] text-red-400 mb-2">{error}</p>
              <button onClick={load} className="text-[12px] text-indigo-400 hover:text-indigo-300">Try again</button>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-600 px-8 text-center">
              <Clock size={24} className="mb-2" />
              <p className="text-xs">No versions yet. We save one automatically every couple of minutes while you write.</p>
            </div>
          ) : groups.map(g => (
            <div key={g.day}>
              <p className="sticky top-0 bg-[#111111] px-5 py-2 text-[10px] font-medium tracking-wider uppercase text-zinc-600">{g.day}</p>
              {g.items.map(v => {
                const r = REASON[v.reason] ?? REASON.AUTO;
                const Icon = r.icon;
                const active = v.id === selectedId;
                return (
                  <div key={v.id} className={`group flex items-start gap-2 px-5 py-2.5 border-l-2 transition-colors ${active ? 'bg-indigo-500/10 border-indigo-500' : 'border-transparent hover:bg-white/[0.03]'}`}>
                    <button className="flex-1 min-w-0 text-left" onClick={() => { setSelectedId(active ? null : v.id); setConfirming(false); }}>
                      <div className="flex items-center gap-1.5">
                        <Icon size={11} className={r.tone} />
                        <span className="text-[12px] font-medium text-zinc-200 truncate">{v.label || r.label}</span>
                        <span className="text-[11px] text-zinc-600">· {timeAgo(v.savedAt)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{v.wordCount} words{v.preview ? ` · ${v.preview.replace(/\s+/g, ' ')}` : ''}</p>
                    </button>
                    <button onClick={() => void togglePin(v)} aria-label={v.pinned ? 'Unpin (allow automatic cleanup)' : 'Keep this version'}
                      title={v.pinned ? 'Kept — click to allow automatic cleanup' : 'Keep this version'}
                      className={`p-1 rounded ${v.pinned ? 'text-amber-400' : 'text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-zinc-400'}`}>
                      <Star size={13} fill={v.pinned ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <footer className="px-5 py-2.5 border-t border-white/8 text-[10px] text-zinc-600">
          Auto-saved versions are thinned out over time (kept hourly, then daily, for 30 days). Starred versions are kept forever.
        </footer>
      </aside>
    </div>
  );
}
