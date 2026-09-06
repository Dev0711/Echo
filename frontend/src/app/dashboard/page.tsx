'use client';

import { useState, useEffect } from 'react';
import { usePostStore } from '@/lib/store';
import { postsApi } from '@/lib/api';
import { Editor } from '@/components/Editor';
import { PreviewPanel } from '@/components/PreviewPanel';
import {
  Plus, Eye, Send, Loader2, PenTool, LayoutDashboard,
  Settings, ArrowLeft, X, Twitter, Linkedin, Globe, FileText,
  CheckCircle, AlertCircle, Key, ChevronDown, ChevronUp,
  ExternalLink, Zap
} from 'lucide-react';
import type { PostCreateRequest, PublishRequest, PlatformCredentials, PreviewResponse } from '@/types';

// ─── Platform Config ────────────────────────────────────────────────────────
const PLATFORMS: {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  border: string;
  bg: string;
  credFields: { key: keyof PlatformCredentials; label: string; placeholder: string }[];
}[] = [
  {
    id: 'devto',
    name: 'Dev.to',
    icon: Globe as React.ComponentType<{ size?: number; className?: string }>,
    color: 'text-white',
    border: 'border-gray-600',
    bg: 'bg-black',
    credFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Your Dev.to API key' }],
  },
  {
    id: 'hashnode',
    name: 'Hashnode',
    icon: FileText as React.ComponentType<{ size?: number; className?: string }>,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'bg-blue-950/30',
    credFields: [{ key: 'accessToken', label: 'Access Token', placeholder: 'Your Hashnode token' }],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter as React.ComponentType<{ size?: number; className?: string }>,
    color: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'bg-sky-950/20',
    credFields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Twitter API key' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Twitter access token' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin as React.ComponentType<{ size?: number; className?: string }>,
    color: 'text-blue-500',
    border: 'border-blue-500/40',
    bg: 'bg-blue-950/20',
    credFields: [{ key: 'accessToken', label: 'Access Token', placeholder: 'LinkedIn access token' }],
  },
];

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishResult, setPublishResult] = useState<{success: boolean; message: string} | null>(null);
  const { posts, currentPost, setPosts, addPost, setCurrentPost, setLoading, setError, isLoading } = usePostStore();

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    try { const r = await postsApi.getAll(); setPosts(r.data); }
    catch { setError('Failed to load posts'); }
    finally { setLoading(false); }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim()) return;
    setLoading(true);
    try {
      const request: PostCreateRequest = { title: newPostTitle.trim(), bodyMarkdown: '', tags: [] };
      const response = await postsApi.create(request);
      addPost(response.data);
      setCurrentPost(response.data);
      setNewPostTitle('');
      setIsCreating(false);
    } catch { setError('Failed to create post'); }
    finally { setLoading(false); }
  };

  const handleTitleChange = (title: string) => {
    if (currentPost) setCurrentPost({ ...currentPost, title });
  };

  const handleStatusChange = (status: 'DRAFT' | 'READY' | 'PUBLISHED') => {
    if (currentPost) setCurrentPost({ ...currentPost, status });
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-72 flex flex-col border-r border-white/5 glass shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight leading-none">Echo</h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Creator Studio</p>
          </div>
        </div>

        {/* New post button */}
        <div className="p-4">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={16} /> New Draft
          </button>
        </div>

        {/* Post list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="flex items-center gap-1.5 px-2 mb-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <LayoutDashboard size={11} /> Recent
          </div>

          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-40">
              <PenTool size={36} className="mb-3 text-gray-400" />
              <p className="text-xs text-gray-500 text-center">Your drafts will appear here</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {posts.map(post => {
                const isActive = currentPost?.id === post.id;
                return (
                  <li key={post.id}>
                    <button
                      onClick={() => { setCurrentPost(post); setShowPreview(false); setPublishResult(null); }}
                      className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-indigo-500/10 border border-indigo-500/25'
                          : 'border border-transparent hover:bg-white/5 hover:border-white/8'
                      }`}
                    >
                      <div className={`font-medium text-sm truncate ${isActive ? 'text-indigo-300' : 'text-gray-300'}`}>
                        {post.title || 'Untitled Draft'}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          post.status === 'PUBLISHED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                          post.status === 'READY' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                          'bg-white/5 text-gray-500 border border-white/5'
                        }`}>{post.status}</span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(post.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate">Creator Mode</p>
            </div>
            <Settings size={14} className="text-gray-600" />
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 bg-black/10 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          {currentPost ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {showPreview && (
                  <button onClick={() => setShowPreview(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                    <ArrowLeft size={14} /> Editor
                  </button>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{showPreview ? 'Preview' : 'Editing'}</p>
                  <h2 className="text-sm font-semibold text-gray-300 truncate max-w-xs">{currentPost.title || 'Untitled Draft'}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Publish result toast */}
                {publishResult && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    publishResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                      : 'bg-red-500/20 text-red-300 border border-red-500/20'
                  }`}>
                    {publishResult.success ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {publishResult.message}
                  </div>
                )}

                {!showPreview && (
                  <button onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all active:scale-95">
                    <Eye size={15} /> Preview
                  </button>
                )}

                <button
                  onClick={() => setShowPublishModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <Send size={15} /> Publish
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                <Zap size={14} className="text-indigo-500" /> Ready to create
              </div>
            </div>
          )}
        </header>

        {/* Canvas */}
        <div className="flex-1 min-h-0 p-5">
          {currentPost ? (
            showPreview ? (
              <PreviewPanelWrapper postId={currentPost.id} />
            ) : (
              <Editor post={currentPost} onTitleChange={handleTitleChange} onStatusChange={handleStatusChange} />
            )
          ) : (
            <EmptyState onCreate={() => setIsCreating(true)} />
          )}
        </div>
      </main>

      {/* ── Create Draft Modal ────────────────────────────────────────────── */}
      {isCreating && (
        <Modal onClose={() => setIsCreating(false)}>
          <h2 className="text-xl font-bold text-white mb-1">Name your draft</h2>
          <p className="text-sm text-gray-500 mb-6">You can always rename it later.</p>
          <input
            type="text"
            value={newPostTitle}
            onChange={e => setNewPostTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreatePost()}
            placeholder="e.g. Why Next.js 16 changed everything..."
            className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl mb-6 focus:outline-none focus:border-indigo-500 text-white placeholder-gray-600 text-base"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsCreating(false)}
              className="px-5 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 text-gray-400 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreatePost}
              disabled={!newPostTitle.trim() || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Create Draft
            </button>
          </div>
        </Modal>
      )}

      {/* ── Publish Modal ─────────────────────────────────────────────────── */}
      {showPublishModal && currentPost && (
        <PublishModal
          postId={currentPost.id}
          onClose={() => setShowPublishModal(false)}
          onSuccess={(msg) => {
            setPublishResult({ success: true, message: msg });
            setShowPublishModal(false);
          }}
          onError={(msg) => {
            setPublishResult({ success: false, message: msg });
            setShowPublishModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Publish Modal Component ─────────────────────────────────────────────────
function PublishModal({
  postId,
  onClose,
  onSuccess,
  onError,
}: {
  postId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['devto']));
  const [creds, setCreds] = useState<Record<string, PlatformCredentials>>({});
  const [expanded, setExpanded] = useState<string | null>('devto');
  const [isPublishing, setIsPublishing] = useState(false);

  const togglePlatform = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (expanded === id) setExpanded(null); }
      else { next.add(id); setExpanded(id); }
      return next;
    });
  };

  const updateCred = (platformId: string, field: keyof PlatformCredentials, value: string) => {
    setCreds(prev => ({
      ...prev,
      [platformId]: { ...prev[platformId], [field]: value },
    }));
  };

  const handlePublish = async () => {
    if (selected.size === 0) return;
    setIsPublishing(true);
    try {
      const request: PublishRequest = {
        platforms: Array.from(selected),
        credentials: creds,
      };
      await postsApi.publish(postId, request);
      onSuccess(`Published to ${Array.from(selected).join(', ')}!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Publish failed. Check your API keys.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Publish to Platforms</h2>
          <p className="text-sm text-gray-500 mt-0.5">Select where you want to publish and enter your API credentials.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400">
          <X size={18} />
        </button>
      </div>

      {/* Platform cards */}
      <div className="space-y-3 mb-8">
        {PLATFORMS.map(platform => {
          const isOn = selected.has(platform.id);
          const isOpen = expanded === platform.id && isOn;
          const Icon = platform.icon;

          return (
            <div key={platform.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isOn ? `${platform.border} bg-white/3` : 'border-white/5 bg-white/2'
              }`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => isOn ? setExpanded(isOpen ? null : platform.id) : togglePlatform(platform.id)}>
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); togglePlatform(platform.id); }}
                    className={`w-10 h-6 rounded-full transition-all relative shrink-0 ${isOn ? 'bg-indigo-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isOn ? 'left-5' : 'left-1'}`} />
                  </button>
                  <Icon size={18} className={platform.color} />
                  <span className={`font-semibold text-sm ${isOn ? 'text-white' : 'text-gray-500'}`}>{platform.name}</span>
                  {isOn && <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/20 font-medium">Selected</span>}
                </div>
                {isOn && (
                  <button onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : platform.id); }}
                    className="text-gray-500 hover:text-white transition-colors">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>

              {/* Expandable credentials */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  {platform.credFields.map(field => (
                    <div key={field.key}>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
                        <Key size={11} /> {field.label}
                      </label>
                      <input
                        type="password"
                        value={creds[platform.id]?.[field.key] as string || ''}
                        onChange={e => updateCred(platform.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-600 flex items-center gap-1">
                    <ExternalLink size={10} /> Credentials are sent directly to your backend and never stored in the browser.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-xs text-gray-500">
          {selected.size === 0 ? 'No platforms selected' : `Publishing to ${selected.size} platform${selected.size > 1 ? 's' : ''}`}
        </span>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 text-gray-400 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={selected.size === 0 || isPublishing}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            {isPublishing ? <><Loader2 size={16} className="animate-spin" /> Publishing...</>
              : <><Send size={16} /> Publish Now</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Shared Modal Wrapper ─────────────────────────────────────────────────────
function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="glass-panel p-14 rounded-3xl text-center max-w-lg shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="w-16 h-16 mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
          <PenTool size={32} className="text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Welcome to Echo</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Write once, publish everywhere. Format your content perfectly for X threads, LinkedIn posts, Dev.to articles, and Hashnode blogs — all at once.
        </p>
        <button onClick={onCreate}
          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          <Plus size={18} /> Create your first draft
        </button>
      </div>
    </div>
  );
}

// ─── Preview Panel Wrapper ────────────────────────────────────────────────────
function PreviewPanelWrapper({ postId }: { postId: string }) {
  const [previews, setPreviews] = useState<PreviewResponse['previews']>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.preview(postId)
      .then(r => { setPreviews(r.data.previews); setLoading(false); })
      .catch(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full glass-panel rounded-2xl">
        <div className="flex flex-col items-center gap-4 text-indigo-400">
          <Loader2 size={40} className="animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Formatting for all platforms...</p>
        </div>
      </div>
    );
  }

  return <PreviewPanel previews={previews} />;
}