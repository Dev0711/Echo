'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, X, Copy, Check, Loader2, ChevronLeft, Tag, Plus, SpellCheck, Wand2, Scissors, Expand,
  Heading, Hash, AlignLeft, Search, Share2, MessageSquareQuote,
} from 'lucide-react';
import { postsApi, errorMessage } from '@/lib/api';
import { wordDiff, findIntro } from '@/lib/diff';
import { toast } from '@/lib/toast';
import type { AiAction, AiAssistResponse } from '@/types';

type Scope = 'selection' | 'intro' | 'document';

interface ActionDef {
  id: AiAction;
  label: string;
  hint: string;
  icon: typeof Sparkles;
  /** text rewrites show a before/after and replace text in the post */
  rewrite?: boolean;
}

const IMPROVE: ActionDef[] = [
  { id: 'fix_grammar', label: 'Fix grammar', hint: 'Spelling & punctuation only', icon: SpellCheck, rewrite: true },
  { id: 'change_tone', label: 'Change tone', hint: 'Casual, professional…', icon: Wand2, rewrite: true },
  { id: 'shorten', label: 'Make shorter', hint: 'Trim about 40%', icon: Scissors, rewrite: true },
  { id: 'expand', label: 'Add detail', hint: 'Explain a bit more', icon: Expand, rewrite: true },
  { id: 'improve_intro', label: 'Better intro', hint: 'A stronger opening', icon: AlignLeft, rewrite: true },
];
const CREATE: ActionDef[] = [
  { id: 'suggest_titles', label: 'Title ideas', hint: '5 options to pick from', icon: Heading },
  { id: 'suggest_tags', label: 'Tags', hint: 'Pick the ones you like', icon: Hash },
  { id: 'summarize', label: 'TL;DR', hint: 'A 2-sentence summary', icon: MessageSquareQuote },
  { id: 'meta_description', label: 'SEO description', hint: 'For search results', icon: Search },
  { id: 'social_posts', label: 'Social posts', hint: 'For X and LinkedIn', icon: Share2 },
];
const ALL = [...IMPROVE, ...CREATE];
const TONES = ['professional', 'casual', 'friendly', 'confident', 'concise'];

interface Props {
  postId: string;
  postContent: string;
  selectedText?: string;
  isOpen: boolean;
  onClose: () => void;
  /** Replace text in the post. `intro` carries the character range of the intro paragraph. */
  onReplace: (target: { scope: Scope; range?: { start: number; end: number } }, text: string) => void;
  onPrependTldr: (text: string) => void;
  onAddTags: (tags: string[]) => void;
  onSetTitle: (title: string) => void;
  onSetMeta: (text: string) => void;
  onSetOverride: (platform: 'twitter' | 'linkedin', text: string) => void;
}

export function AiAssistantPanel(props: Props) {
  const { postId, postContent, selectedText, isOpen, onClose } = props;
  const [action, setAction] = useState<ActionDef | null>(null);
  const [pickingTone, setPickingTone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiAssistResponse | null>(null);
  const [source, setSource] = useState('');
  const [scope, setScope] = useState<Scope>('document');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [lastTone, setLastTone] = useState<string | undefined>();

  const hasSelection = !!selectedText && selectedText.trim().length > 0;
  const intro = useMemo(() => findIntro(postContent), [postContent]);
  const hasText = postContent.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;
    setAction(null); setPickingTone(false); setData(null); setError(null); setPicked(new Set());
  }, [isOpen]);

  const run = async (def: ActionDef, option?: string) => {
    // Rewrites work on the selection when there is one, the intro for "Better intro", else the whole post.
    let sc: Scope = 'document', text = postContent;
    if (def.id === 'improve_intro') {
      if (!intro) { toast.error("Couldn't find an intro paragraph to improve."); return; }
      sc = 'intro'; text = intro.text;
    } else if (def.rewrite && hasSelection) { sc = 'selection'; text = selectedText!; }

    setAction(def); setPickingTone(false); setLoading(true); setError(null); setData(null);
    setScope(sc); setSource(text); setPicked(new Set()); setLastTone(option);
    try {
      const res = await postsApi.aiAssist(postId, {
        action: def.id, content: text, option,
        ...(def.id === 'improve_intro' ? { context: postContent } : {}),
      });
      setData(res.data);
    } catch (e) {
      setError(errorMessage(e, 'The AI assistant could not complete that. Please try again.'));
    } finally { setLoading(false); }
  };

  const back = () => { setAction(null); setData(null); setError(null); };
  const copy = async (text: string) => { await navigator.clipboard.writeText(text); toast.info('Copied'); };

  const applyRewrite = async () => {
    if (!data?.result) return;
    try { await postsApi.aiCheckpoint(postId); } catch { /* the restore point is best-effort */ }
    props.onReplace({ scope, range: scope === 'intro' && intro ? { start: intro.start, end: intro.end } : undefined }, data.result);
    toast.success('Applied. You can undo this from Version history (“Before AI edit”).');
    onClose();
  };

  if (!isOpen) return null;

  const diff = data?.result && action?.rewrite ? wordDiff(source, data.result) : [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto w-[420px] max-w-full bg-[#0d0d0d] border-l border-white/8 h-full flex flex-col shadow-2xl" aria-label="AI assistant">
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center"><Sparkles size={14} className="text-white" /></div>
            <h2 className="text-sm font-semibold text-white">AI assistant</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white"><X size={16} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {!action ? (
            <div className="space-y-6">
              {!hasText && <p className="text-[12px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">Write a few sentences first, then the assistant has something to work with.</p>}
              {hasSelection && <p className="text-[12px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">Rewrite actions will only change your selected text ({selectedText!.length} characters).</p>}
              {[{ title: 'Improve your writing', list: IMPROVE }, { title: 'Create from your post', list: CREATE }].map(group => (
                <section key={group.title}>
                  <h3 className="text-[11px] font-medium tracking-wider uppercase text-zinc-500 mb-2">{group.title}</h3>
                  <div className="grid grid-cols-1 gap-1.5">
                    {group.list.map(def => {
                      const Icon = def.icon;
                      return (
                        <div key={def.id}>
                          <button disabled={!hasText} onClick={() => def.id === 'change_tone' ? setPickingTone(p => !p) : run(def)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#131313] hover:bg-[#1a1a1a] border border-white/6 hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors">
                            <Icon size={15} className="text-violet-400 shrink-0" />
                            <span className="flex-1 min-w-0">
                              <span className="block text-[13px] text-zinc-200">{def.label}</span>
                              <span className="block text-[11px] text-zinc-500">{def.hint}</span>
                            </span>
                          </button>
                          {def.id === 'change_tone' && pickingTone && (
                            <div className="flex flex-wrap gap-1.5 px-1 pt-2 pb-1">
                              {TONES.map(t => (
                                <button key={t} onClick={() => run(def, t)} className="px-3 py-1 rounded-full text-[12px] capitalize bg-white/5 hover:bg-violet-500/20 border border-white/10 text-zinc-300">{t}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <button onClick={back} className="flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-300"><ChevronLeft size={14} /> All actions</button>
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-medium text-zinc-200">{action.label}{lastTone ? ` · ${lastTone}` : ''}</h3>
                {action.rewrite && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-400">{scope === 'selection' ? 'your selection' : scope === 'intro' ? 'intro paragraph' : 'whole post'}</span>}
              </div>

              {loading && <div className="flex flex-col items-center py-14 text-zinc-500"><Loader2 size={22} className="animate-spin text-violet-500 mb-3" /><span className="text-[13px]">Working on it…</span></div>}

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-[13px] text-red-300 mb-3">{error}</p>
                  <button onClick={() => run(action, lastTone)} className="text-[12px] text-red-200 underline underline-offset-2">Try again</button>
                </div>
              )}

              {/* Rewrites: before/after, then apply */}
              {data?.result && action.rewrite && (
                <>
                  <div className="bg-[#111] border border-white/5 rounded-lg p-4 text-[13px] leading-relaxed max-h-[46vh] overflow-y-auto">
                    {diff.length > 0 && !diff.some(t => t.type !== 'same')
                      ? <p className="text-zinc-400">No changes needed — this already looks good.</p>
                      : diff.map((t, i) => (
                        <span key={i} className={t.type === 'removed' ? 'text-red-400 line-through bg-red-950/40 rounded px-0.5' : t.type === 'added' ? 'text-emerald-400 bg-emerald-950/40 rounded px-0.5' : 'text-zinc-300'}>{t.text} </span>
                      ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">Red is removed, green is new. A restore point is saved before anything changes.</p>
                  <div className="flex gap-2">
                    <button onClick={applyRewrite} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-medium rounded-lg"><Check size={15} /> Apply changes</button>
                    <button onClick={back} className="px-4 py-2.5 text-[13px] text-zinc-300 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-lg">Discard</button>
                  </div>
                </>
              )}

              {/* Titles */}
              {data?.items && action.id === 'suggest_titles' && (
                <div className="space-y-1.5">
                  <p className="text-[12px] text-zinc-500">Click one to use it as your title.</p>
                  {data.items.map(t => (
                    <button key={t} onClick={() => { props.onSetTitle(t); toast.success('Title updated'); onClose(); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-[#131313] hover:bg-violet-500/10 border border-white/8 hover:border-violet-500/40 text-[13px] text-zinc-200">{t}</button>
                  ))}
                </div>
              )}

              {/* Tags */}
              {data?.items && action.id === 'suggest_tags' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {data.items.map(tag => {
                      const on = picked.has(tag);
                      return (
                        <button key={tag} onClick={() => setPicked(p => { const n = new Set(p); on ? n.delete(tag) : n.add(tag); return n; })}
                          className={`px-3 py-1.5 rounded-full text-[13px] border flex items-center gap-1.5 ${on ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}>
                          <Tag size={12} /> {tag}
                        </button>
                      );
                    })}
                  </div>
                  <button disabled={picked.size === 0} onClick={() => { props.onAddTags([...picked]); toast.success(`Added ${picked.size} tag${picked.size > 1 ? 's' : ''}`); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[13px] font-medium rounded-lg"><Plus size={15} /> Add {picked.size || ''} selected</button>
                </>
              )}

              {/* TL;DR */}
              {data?.result && action.id === 'summarize' && (
                <>
                  <blockquote className="bg-[#111] border border-white/5 rounded-lg p-4 text-[13px] text-zinc-200 leading-relaxed">{data.result}</blockquote>
                  <div className="flex gap-2">
                    <button onClick={() => { props.onPrependTldr(data.result!); toast.success('TL;DR added at the top'); onClose(); }} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg">Add to top of post</button>
                    <button onClick={() => copy(data.result!)} aria-label="Copy" className="px-3.5 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-lg text-zinc-300"><Copy size={15} /></button>
                  </div>
                </>
              )}

              {/* Meta description */}
              {data?.result && action.id === 'meta_description' && (
                <>
                  <div className="bg-[#111] border border-white/5 rounded-lg p-4">
                    <p className="text-[13px] text-zinc-200 leading-relaxed">{data.result}</p>
                    <p className={`text-[11px] mt-2 ${data.result.length <= 160 ? 'text-emerald-400' : 'text-amber-400'}`}>{data.result.length} characters (aim for under 160)</p>
                  </div>
                  <button onClick={() => { props.onSetMeta(data.result!); toast.success('SEO description updated'); onClose(); }} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg">Use as SEO description</button>
                </>
              )}

              {/* Social posts */}
              {data?.sections && action.id === 'social_posts' && (
                <div className="space-y-4">
                  {([['twitter', 'x', 'X (Twitter)'], ['linkedin', 'linkedin', 'LinkedIn']] as const).map(([platform, key, name]) => data.sections![key] && (
                    <div key={key} className="bg-[#111] border border-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-zinc-300">{name}</span>
                        {key === 'x' && <span className={`text-[11px] ${data.sections![key].length <= 280 ? 'text-zinc-500' : 'text-red-400'}`}>{data.sections![key].length}/280</span>}
                      </div>
                      <p className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{data.sections![key]}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { props.onSetOverride(platform, data.sections![key]); toast.success(`Will be used when you publish to ${name}`); }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-medium rounded-md">Use for {name}</button>
                        <button onClick={() => copy(data.sections![key])} aria-label={`Copy ${name} post`} className="px-3 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-md text-zinc-300"><Copy size={13} /></button>
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-zinc-500">“Use for” sets this text as the version sent to that platform instead of the full article.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
