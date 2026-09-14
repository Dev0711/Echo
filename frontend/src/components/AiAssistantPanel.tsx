'use client';
import { useState, useCallback } from 'react';
import { Sparkles, X, Copy, Check, Loader2, ChevronRight, Tag, ArrowRight, Quote, Wand2, Plus } from 'lucide-react';

// Simple LCS-based word diff
type DiffToken = { text: string; type: 'same' | 'removed' | 'added' };

function wordDiff(original: string, revised: string): DiffToken[] {
  const origWords = original.split(/\s+/).filter(Boolean);
  const revWords = revised.split(/\s+/).filter(Boolean);
  // Build LCS table
  const m = origWords.length, n = revWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = origWords[i-1] === revWords[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  // Backtrack
  const tokens: DiffToken[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i-1] === revWords[j-1]) {
      tokens.unshift({ text: origWords[i-1], type: 'same' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      tokens.unshift({ text: revWords[j-1], type: 'added' });
      j--;
    } else {
      tokens.unshift({ text: origWords[i-1], type: 'removed' });
      i--;
    }
  }
  return tokens;
}

const ACTIONS = [
  { id: 'fix_grammar', label: 'Fix Grammar', icon: '🔤', description: 'Track & fix errors inline', color: 'from-rose-500 to-pink-600' },
  { id: 'improve_intro', label: 'Improve Intro', icon: '✨', description: 'Before & after comparison', color: 'from-violet-500 to-purple-600' },
  { id: 'suggest_tags', label: 'Suggest Tags', icon: '🏷️', description: 'Click to select & add tags', color: 'from-blue-500 to-cyan-600' },
  { id: 'summarize', label: 'Write TL;DR', icon: '📝', description: 'Insert a summary block', color: 'from-emerald-500 to-teal-600' },
];

interface AiAssistantPanelProps {
  postId: string;
  postContent: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  onAddTags?: (tags: string[]) => void;
}

export function AiAssistantPanel({ postId, postContent, isOpen, onClose, onApply, onAddTags }: AiAssistantPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const runAction = async (actionId: string) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setActiveAction(actionId);
    setSelectedTags(new Set());
    try {
      const token = localStorage.getItem('echo_token');
      const res = await fetch(`http://localhost:8080/api/posts/${postId}/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: actionId }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResult(data.result);
    } catch {
      setError('AI request failed. Check your API key in .env.properties.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) newSelected.delete(tag);
    else newSelected.add(tag);
    setSelectedTags(newSelected);
  };

  const reset = () => {
    setActiveAction(null);
    setResult(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-96 bg-[#0d0d0d] border-l border-white/8 h-full flex flex-col shadow-2xl transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">AI Assistant</span>
            <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full font-medium">Gemini</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {!activeAction ? (
            <div className="p-5">
              <p className="text-sm font-medium text-zinc-300 mb-4">Choose an action</p>
              <div className="grid grid-cols-2 gap-3">
                {ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => runAction(action.id)}
                    className="bg-[#111] hover:bg-[#161616] border border-white/8 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-start text-left group"
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                    <span className="text-sm font-medium text-zinc-200 mb-1">{action.label}</span>
                    <span className="text-xs text-zinc-500">{action.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <button onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="rotate-180" /> Back
                </button>
                <div className="w-px h-3 bg-white/10" />
                <span className="text-xs font-medium text-zinc-400">
                  {ACTIONS.find(a => a.id === activeAction)?.label}
                </span>
              </div>

              <div className="p-5 flex-1 overflow-y-auto flex flex-col">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-12">
                    <Loader2 size={24} className="animate-spin text-violet-500 mb-3" />
                    <span className="text-sm">Analyzing text...</span>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    {error}
                  </div>
                ) : result && activeAction === 'fix_grammar' ? (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#111] border border-white/5 rounded-xl p-4 text-sm leading-loose">
                      {wordDiff(postContent.substring(0, 500), result).map((token, i) => (
                        <span
                          key={i}
                          className={
                            token.type === 'removed' ? 'text-red-400 line-through bg-red-950/40 px-0.5 mx-0.5 rounded' :
                            token.type === 'added' ? 'text-emerald-400 bg-emerald-950/40 px-0.5 mx-0.5 rounded' :
                            'text-zinc-200'
                          }
                        >{token.text}{' '}</span>
                      ))}
                    </div>
                    <div className="text-xs text-zinc-500 text-center mb-2">Note: Corrected version will be appended to your post.</div>
                    <div className="flex gap-2">
                      <button onClick={() => { onApply(result); onClose(); }} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2">
                        <Check size={16} /> Apply corrections
                      </button>
                      <button onClick={reset} className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-white/10">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : result && activeAction === 'suggest_tags' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {result.split(',').map(t => t.trim()).filter(Boolean).map(tag => {
                        const isSelected = selectedTags.has(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${
                              isSelected ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                            }`}
                          >
                            <Tag size={12} /> {tag}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-auto pt-4">
                      <button 
                        onClick={() => { if (onAddTags) onAddTags(Array.from(selectedTags)); onClose(); }}
                        disabled={selectedTags.size === 0}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2"
                      >
                        <Plus size={16} /> Add {selectedTags.size} tags
                      </button>
                    </div>
                  </div>
                ) : result && activeAction === 'summarize' ? (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#111] border border-white/5 rounded-xl p-5 relative overflow-hidden">
                      <Quote size={48} className="absolute -top-2 -left-2 text-white/5" />
                      <p className="text-sm text-zinc-200 leading-relaxed relative z-10">{result}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { onApply(`> **TL;DR:** ${result}`); onClose(); }} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2">
                        <ArrowRight size={16} /> Insert as TL;DR
                      </button>
                      <button onClick={() => handleCopy(result)} className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-white/10">
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                ) : result && activeAction === 'improve_intro' ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-[#111] border border-white/5 rounded-xl p-4">
                        <p className="text-xs font-semibold text-zinc-500 mb-2">Original</p>
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">{postContent.substring(0, 200)}...</p>
                      </div>
                      <div className="bg-emerald-950/20 border border-emerald-500/20 border-l-4 border-l-emerald-500 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-400 mb-2">Improved</p>
                        <p className="text-sm text-zinc-200 leading-relaxed">{result}</p>
                      </div>
                    </div>
                    <button onClick={() => { onApply(result); onClose(); }} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2">
                      <Check size={16} /> Use improved version
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
