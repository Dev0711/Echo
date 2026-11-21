'use client';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Loader2, Trash2, RotateCw, CheckCircle2, Circle, X, PenTool, ExternalLink, CalendarX, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { platformMeta, excerptOf, wordCountOf } from '@/lib/platforms';
import { timeAgo, formatDateTime } from '@/lib/dates';
import type { Post, PlatformStatus } from '@/types';

type Tab = 'all' | 'drafts' | 'scheduled' | 'published' | 'attention';

const hasFailedPlatform = (p: Post) => Object.values(p.platforms || {}).some(s => s?.status === 'FAILED');
const needsAttention = (p: Post) => p.status === 'FAILED' || (p.status === 'PUBLISHED' && hasFailedPlatform(p));

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  READY: { label: 'Ready', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  SCHEDULED: { label: 'Scheduled', cls: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
  PUBLISHED: { label: 'Published', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  FAILED: { label: 'Failed', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

interface Props {
  posts: Post[];
  isLoading: boolean;
  connected: Record<string, boolean>;
  onOpen: (post: Post) => void;
  onCreate: () => void;
  onDelete: (post: Post) => Promise<void>;
  onRetry: (post: Post, platform: string) => Promise<void>;
  onUnschedule: (post: Post) => Promise<void>;
}

export function PostsView({ posts, isLoading, connected, onOpen, onCreate, onDelete, onRetry, onUnschedule }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<Post | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: posts.length,
    drafts: posts.filter(p => p.status === 'DRAFT' || p.status === 'READY').length,
    scheduled: posts.filter(p => p.status === 'SCHEDULED').length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
    attention: posts.filter(needsAttention).length,
  }), [posts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      if (tab === 'drafts' && !(p.status === 'DRAFT' || p.status === 'READY')) return false;
      if (tab === 'scheduled' && p.status !== 'SCHEDULED') return false;
      if (tab === 'published' && p.status !== 'PUBLISHED') return false;
      if (tab === 'attention' && !needsAttention(p)) return false;
      if (!q) return true;
      return (p.title || '').toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)) || (p.bodyMarkdown || '').toLowerCase().includes(q);
    });
  }, [posts, tab, query]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'drafts', label: 'Drafts' }, { id: 'scheduled', label: 'Scheduled' },
    { id: 'published', label: 'Published' },
    ...(counts.attention > 0 ? [{ id: 'attention' as Tab, label: 'Needs attention' }] : []),
  ];

  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } finally { setBusy(null); } };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[18px] font-semibold text-[#f2f2f2]">Your posts</h1>
            <p className="text-[12px] text-[#71717a] mt-0.5">Write once, publish everywhere.</p>
          </div>
          <Button onClick={onCreate}><Plus size={14} /> New post</Button>
        </div>

        <Onboarding posts={posts} connected={connected} onCreate={onCreate} />

        {posts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div role="tablist" className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
              {tabs.map(t => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-white/10 text-white' : 'text-[#71717a] hover:text-[#d4d4d4]'} ${t.id === 'attention' ? '!text-red-400' : ''}`}>
                  {t.label} <span className="text-[#52525b] ml-0.5">{counts[t.id]}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto sm:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search posts or tags" aria-label="Search posts"
                className="w-full pl-8 pr-3 py-1.5 bg-[#141414] border border-[#252525] rounded-md text-[12px] text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        )}

        {isLoading && posts.length === 0 ? (
          <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-[92px] rounded-lg bg-[#141414] border border-[#1f1f1f] animate-pulse" />)}</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16">
            <PenTool size={26} className="text-[#3a3a3a] mb-3" />
            <h2 className="text-[15px] font-semibold text-[#f2f2f2] mb-1">Write your first post</h2>
            <p className="text-[12px] text-[#71717a] mb-5 max-w-xs">Start a draft — you can publish it to X, LinkedIn, Dev.to, Hashnode and Medium in one go.</p>
            <Button onClick={onCreate}><Plus size={14} /> New post</Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-[13px] text-[#71717a] py-16">Nothing matches{query ? ` “${query}”` : ' here yet'}.</p>
        ) : (
          <ul className="space-y-2">
            {visible.map(post => {
              const chip = STATUS_CHIP[post.status] ?? STATUS_CHIP.DRAFT;
              const platformEntries = Object.entries(post.platforms || {}).filter(([, s]) => s && s.status !== 'NOT_STARTED') as [string, PlatformStatus][];
              const scheduledOnly = post.status === 'SCHEDULED' ? (post.scheduledPlatforms || []) : [];
              return (
                <li key={post.id} className="group relative rounded-lg border border-[#1f1f1f] bg-[#121212] hover:border-[#2e2e2e] hover:bg-[#151515] transition-colors">
                  <button onClick={() => onOpen(post)} className="w-full text-left px-4 py-3.5 pr-12">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-medium text-[#f2f2f2] truncate">{post.title || 'Untitled'}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${chip.cls}`}>{chip.label}</span>
                    </div>
                    {excerptOf(post.bodyMarkdown) && <p className="text-[12px] text-[#71717a] line-clamp-2 mb-2">{excerptOf(post.bodyMarkdown)}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-[#52525b] flex-wrap">
                      <span>Edited {timeAgo(post.updatedAt)}</span>
                      <span>{wordCountOf(post.bodyMarkdown)} words</span>
                      {post.status === 'SCHEDULED' && post.scheduledAt && <span className="text-violet-300">Goes out {formatDateTime(post.scheduledAt)}</span>}
                      {(post.tags || []).slice(0, 3).map(t => <span key={t} className="text-[#71717a]">#{t}</span>)}
                    </div>
                  </button>

                  {(platformEntries.length > 0 || scheduledOnly.length > 0) && (
                    <div className="flex items-center gap-2 flex-wrap px-4 pb-3 -mt-1">
                      {scheduledOnly.map(id => { const m = platformMeta(id); const I = m.icon; return (
                        <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-violet-500/20 text-violet-300"><I size={11} />{m.name}</span>); })}
                      {post.status !== 'SCHEDULED' && platformEntries.map(([id, s]) => {
                        const m = platformMeta(id); const I = m.icon;
                        if (s.status === 'FAILED') return (
                          <span key={id} className="inline-flex items-center gap-1.5 text-[11px] pl-2 pr-1 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-300" title={s.error || 'Failed'}>
                            <I size={11} />{m.name} failed
                            <button disabled={busy === post.id + id} onClick={() => run(post.id + id, () => onRetry(post, id))}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-200">
                              {busy === post.id + id ? <Loader2 size={10} className="animate-spin" /> : <RotateCw size={10} />} Retry
                            </button>
                          </span>);
                        if (s.status === 'PENDING') return (
                          <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-300"><Loader2 size={10} className="animate-spin" /><I size={11} />{m.name}</span>);
                        return s.url ? (
                          <a key={id} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"><I size={11} />{m.name}<ExternalLink size={9} /></a>
                        ) : (
                          <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400"><I size={11} />{m.name}</span>);
                      })}
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {post.status === 'SCHEDULED' && (
                      <button title="Cancel schedule" aria-label="Cancel schedule" onClick={() => run(post.id, () => onUnschedule(post))} className="p-1.5 rounded-md text-[#71717a] hover:text-violet-300 hover:bg-white/5"><CalendarX size={14} /></button>
                    )}
                    <button title="Delete" aria-label={`Delete ${post.title || 'post'}`} onClick={() => setToDelete(post)} className="p-1.5 rounded-md text-[#71717a] hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>“{toDelete?.title || 'Untitled'}” and its version history will be permanently deleted. Posts already published on other platforms stay there.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setToDelete(null)}>Keep it</Button>
            <Button variant="destructive" size="sm" disabled={busy === 'delete'} onClick={() => run('delete', async () => { if (toDelete) await onDelete(toDelete); setToDelete(null); })}>
              {busy === 'delete' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A 3-step "getting started" strip; hides itself when finished or dismissed. */
function Onboarding({ posts, connected, onCreate }: { posts: Post[]; connected: Record<string, boolean>; onCreate: () => void }) {
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => { try { setDismissed(localStorage.getItem('echo_onboarding_dismissed') === '1'); } catch { setDismissed(false); } }, []);

  const anyConnected = Object.values(connected).some(Boolean);
  const steps = [
    { done: anyConnected, title: 'Connect a platform', body: 'Add a Dev.to, Hashnode, X or LinkedIn key so Echo can publish for you.', cta: 'Open settings', href: '/settings' },
    { done: posts.length > 0, title: 'Write a post', body: 'Start a draft. It saves as you type.', cta: 'New post', onClick: onCreate },
    { done: posts.some(p => p.status === 'PUBLISHED'), title: 'Publish it', body: 'Pick where it goes, or schedule it for later.' },
  ];
  if (dismissed || steps.every(s => s.done)) return null;
  const next = steps.findIndex(s => !s.done);

  return (
    <section className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.05] p-4" aria-label="Getting started">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold text-[#f2f2f2]">Getting started <span className="text-[#71717a] font-normal">· {steps.filter(s => s.done).length} of 3 done</span></h2>
        <button aria-label="Dismiss getting started" onClick={() => { setDismissed(true); try { localStorage.setItem('echo_onboarding_dismissed', '1'); } catch { /* ignore */ } }} className="text-[#52525b] hover:text-[#d4d4d4]"><X size={14} /></button>
      </div>
      <ol className="grid sm:grid-cols-3 gap-3">
        {steps.map((s, i) => (
          <li key={s.title} className={`rounded-lg p-3 border ${i === next ? 'border-indigo-500/40 bg-[#141414]' : 'border-transparent'}`}>
            <div className="flex items-center gap-2 mb-1">
              {s.done ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Circle size={15} className="text-[#3a3a3a]" />}
              <span className={`text-[13px] font-medium ${s.done ? 'text-[#71717a] line-through' : 'text-[#f2f2f2]'}`}>{s.title}</span>
            </div>
            <p className="text-[12px] text-[#71717a] mb-2">{s.body}</p>
            {i === next && s.cta && (s.href
              ? <a href={s.href} className="inline-flex items-center gap-1 text-[12px] font-medium text-indigo-400 hover:text-indigo-300">{s.cta} <ArrowRight size={12} /></a>
              : <button onClick={s.onClick} className="inline-flex items-center gap-1 text-[12px] font-medium text-indigo-400 hover:text-indigo-300">{s.cta} <ArrowRight size={12} /></button>)}
          </li>
        ))}
      </ol>
    </section>
  );
}
