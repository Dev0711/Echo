'use client';
import { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostVersion {
  id: string;
  postId: string;
  bodyMarkdown: string;
  savedAt: string;
}

interface VersionHistoryPanelProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (markdown: string) => void;
}

export function VersionHistoryPanel({ postId, isOpen, onClose, onRestore }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PostVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      setIsLoading(true);
      const token = localStorage.getItem('echo_token');
      fetch(`http://localhost:8080/api/posts/${postId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => { setVersions(data); setIsLoading(false); })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen, postId]);

  const handleRestore = (version: PostVersion) => {
    setIsRestoring(true);
    setTimeout(() => {
      onRestore(version.bodyMarkdown);
      setIsRestoring(false);
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-80 bg-[#111111] border-l border-white/8 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Version History</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        {selectedVersion && (
          <div className="border-b border-white/8 p-3">
            <div className="bg-black/30 rounded-lg p-3 max-h-36 overflow-y-auto">
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                {selectedVersion.bodyMarkdown.substring(0, 500)}
                {selectedVersion.bodyMarkdown.length > 500 ? '...' : ''}
              </pre>
            </div>
            <button
              onClick={() => handleRestore(selectedVersion)}
              disabled={isRestoring}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-colors"
            >
              {isRestoring ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              Restore this version
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-zinc-600" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
              <Clock size={24} className="mb-2" />
              <p className="text-xs">No versions saved yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {versions.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/4 transition-colors ${
                    selectedVersion?.id === v.id ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      {i === 0 ? '✦ Latest' : `Version ${versions.length - i}`}
                    </span>
                    {i === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">current</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-600 mt-0.5">
                    {formatDistanceToNow(new Date(v.savedAt), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-zinc-700 mt-1 truncate">
                    {v.bodyMarkdown.substring(0, 60)}...
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
