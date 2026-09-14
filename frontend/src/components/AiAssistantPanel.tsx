'use client';
import { useState } from 'react';
import { Sparkles, X, Copy, Check, Loader2, ChevronRight } from 'lucide-react';

const ACTIONS = [
  { id: 'improve_intro', label: '✨ Improve introduction', description: 'Rewrite the opening to be more engaging' },
  { id: 'suggest_tags', label: '🏷️ Suggest tags', description: 'Get 5 SEO-friendly tag ideas' },
  { id: 'summarize', label: '📝 Write a TL;DR', description: 'Generate a 2-sentence summary' },
  { id: 'fix_grammar', label: '🔤 Fix grammar & spelling', description: 'Clean up the text automatically' },
];

interface AiAssistantPanelProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
}

export function AiAssistantPanel({ postId, isOpen, onClose, onApply }: AiAssistantPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (actionId: string) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setActiveAction(actionId);
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

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-80 bg-[#111111] border-l border-white/8 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">AI Assistant</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">Gemini</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-3 space-y-1.5">
          <p className="text-xs text-zinc-600 px-1 mb-2">What would you like help with?</p>
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => runAction(action.id)}
              disabled={isLoading}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all group ${
                activeAction === action.id && (isLoading || result)
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/5 hover:border-white/15 hover:bg-white/4'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">{action.label}</span>
                <ChevronRight size={12} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
              </div>
              <div className="text-xs text-zinc-600 mt-0.5">{action.description}</div>
            </button>
          ))}
        </div>

        {/* Result */}
        {(isLoading || result || error) && (
          <div className="flex-1 flex flex-col border-t border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium text-zinc-400">Result</span>
              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Loader2 size={14} className="animate-spin text-violet-400" />
                  <span className="text-xs">Thinking...</span>
                </div>
              ) : error ? (
                <p className="text-xs text-red-400">{error}</p>
              ) : result ? (
                <>
                  <div className="bg-black/30 rounded-lg p-3 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap border border-white/5">
                    {result}
                  </div>
                  <button
                    onClick={() => { onApply(result); onClose(); }}
                    className="mt-3 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Apply to post
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
