'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';
import { usePostStore } from '@/lib/store';
import { postsApi } from '@/lib/api';
import { Editor } from '@/components/Editor';
import { PreviewRenderer } from '@/components/PreviewRenderer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider
} from '@/components/ui/tooltip';
import {
  Plus, Eye, EyeOff, Send, Loader2, PenTool,
  Settings, Twitter, Linkedin, Globe, FileText,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  BookOpen, Clock, Bell, Maximize2, Minimize2, BarChart2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import type { PostCreateRequest, PublishRequest, PlatformCredentials, PreviewResponse } from '@/types';

// ─── Platform Config ─────────────────────────────────────────────────────────
const PLATFORMS: {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  credFields: { key: keyof PlatformCredentials; label: string; placeholder: string }[];
}[] = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter as React.ComponentType<{ size?: number; className?: string }>,
    credFields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Twitter API key' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Access token' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin as React.ComponentType<{ size?: number; className?: string }>,
    credFields: [{ key: 'accessToken', label: 'Access Token', placeholder: 'LinkedIn access token' }],
  },
  {
    id: 'devto',
    name: 'Dev.to',
    icon: Globe as React.ComponentType<{ size?: number; className?: string }>,
    credFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Dev.to API key' }],
  },
  {
    id: 'hashnode',
    name: 'Hashnode',
    icon: FileText as React.ComponentType<{ size?: number; className?: string }>,
    credFields: [{ key: 'accessToken', label: 'Access Token', placeholder: 'Hashnode token' }],
  },
  {
    id: 'medium',
    name: 'Medium',
    icon: BookOpen as React.ComponentType<{ size?: number; className?: string }>,
    credFields: [{ key: 'accessToken', label: 'Integration Token', placeholder: 'Medium token' }],
  },
];

// ─── Toggle Component (use shadcn Switch) ─────────────────────────────────── 
// (Keeping Toggle as a thin alias for Switch to avoid prop threading)
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <Switch checked={checked} onCheckedChange={onChange} />;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);

  // Publish pane state
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['twitter']));
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, any>>({});
  const [showSettingsDialog, setShowSettingsDialog] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  // View state
  const [currentView, setCurrentView] = useState<'DRAFT' | 'PUBLISHED' | 'ANALYTICS'>('DRAFT');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { posts, currentPost, setPosts, addPost, updatePost, setCurrentPost, setLoading, setError, isLoading } = usePostStore();
  const user = auth.getUser();

  useEffect(() => {
    if (!auth.isAuthenticated()) { window.location.href = '/login'; return; }
    loadPosts();
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const { credentialsApi } = await import('@/lib/api');
      const res = await credentialsApi.getAll();
      const map: Record<string, any> = {};
      res.data.forEach((s: any) => { map[s.platform] = s; });
      setPlatformStatuses(map);
    } catch { /* ignore */ }
  };

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
      const req: PostCreateRequest = { title: newPostTitle.trim(), bodyMarkdown: '', tags: [] };
      const res = await postsApi.create(req);
      addPost(res.data); setCurrentPost(res.data);
      setNewPostTitle(''); setIsCreating(false); setCurrentView('DRAFT');
    } catch { setError('Failed to create post'); }
    finally { setLoading(false); }
  };

  const handleTitleChange = (title: string) => {
    if (currentPost) {
      updatePost(currentPost.id, { title });
    }
  };
  const handleStatusChange = (status: 'DRAFT' | 'READY' | 'PUBLISHED') => {
    if (currentPost) setCurrentPost({ ...currentPost, status });
  };

  const togglePlatform = (id: string) => {
    if (!selectedPlatforms.has(id) && !platformStatuses[id]?.connected) {
      setShowSettingsDialog(id);
      return;
    }
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (!currentPost || selectedPlatforms.size === 0) return;
    setIsPublishing(true); setPublishResult(null);
    try {
      const req: PublishRequest = {
        platforms: Array.from(selectedPlatforms),
        credentials: {}, // Backend uses stored credentials
        ...(isScheduling && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {})
      };
      await postsApi.publish(currentPost.id, req);
      setPublishResult({ success: true, message: isScheduling && scheduledAt ? 'Scheduled' : 'Published' });
      loadPosts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPublishResult({ success: false, message: msg || 'Publish failed' });
    } finally { setIsPublishing(false); }
  };

  const recentDrafts = posts.filter(p => p.status !== 'PUBLISHED').slice(0, 6);

  return (
    <TooltipProvider delayDuration={400}>
    <div className="h-screen w-screen flex overflow-hidden bg-[#0f0f0f]">

      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      {!isFullScreen && (
        <aside className="w-[200px] flex flex-col shrink-0 surface-sidebar">
          {/* Wordmark */}
          <div className="px-4 pt-5 pb-4 flex items-center gap-2">
            <Logo className="w-5 h-5 text-[#f2f2f2]" />
            <span className="text-[14px] font-semibold text-[#f2f2f2] tracking-tight">Echo</span>
          </div>

          {/* Primary nav */}
          <nav className="px-2 space-y-0.5 mb-5">
            {[
              { id: 'DRAFT' as const, label: 'Drafts', icon: PenTool },
              { id: 'PUBLISHED' as const, label: 'Published', icon: Globe },
              { id: 'ANALYTICS' as const, label: 'Analytics', icon: BarChart2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`nav-item w-full rounded-sm ${currentView === id ? 'nav-active !text-[#f2f2f2]' : ''}`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="mx-4 divider mb-4" />

          {/* New draft */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="mx-2 mb-4 w-[calc(100%-16px)] justify-start"
          >
            <Plus size={12} /> New draft
          </Button>

          {/* Recent drafts */}
          <ScrollArea className="flex-1 px-2 pb-4">
            <p className="label-xs px-2 mb-2">Recent</p>
            {recentDrafts.length === 0 ? (
              <p className="text-[11px] text-[#52525b] px-2">No drafts yet</p>
            ) : (
              <ul className="space-y-0.5">
                {recentDrafts.map((post: any) => {
                  const isActive = currentPost?.id === post.id;
                  return (
                    <li key={post.id}>
                      <button
                        onClick={() => { setCurrentPost(post); setShowPreview(false); setPublishResult(null); setCurrentView('DRAFT'); }}
                        className={`w-full text-left px-2 py-1.5 rounded-sm text-[12px] truncate transition-colors ${
                          isActive ? 'text-[#f2f2f2] bg-white/[0.05]' : 'text-[#71717a] hover:text-[#d4d4d4]'
                        }`}
                      >
                        {post.title || 'Untitled'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>

          {/* User footer */}
          <div className="mx-4 divider mb-3" />
          <div className="px-3 pb-4 flex items-center gap-2">
            <div suppressHydrationWarning className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p suppressHydrationWarning className="text-[11px] text-[#d4d4d4] truncate font-medium">{user?.name ?? 'Account'}</p>
            </div>
            <a href="/settings" className="text-[#52525b] hover:text-[#d4d4d4] transition-colors">
              <Settings size={12} />
            </a>
          </div>
        </aside>
      )}

      {/* ── Middle Column ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 surface-main">
        {/* Top bar */}
        {showPreview ? (
          <header className="h-[60px] flex items-center justify-between px-8 shrink-0 bg-[#0f0f0f]" style={{ borderBottom: '1px solid #1f1f1f' }}>
            <h1 className="text-[20px] font-semibold text-[#f2f2f2]">Live Preview</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Exit Preview
              </Button>
              <Button 
                size="sm" 
                onClick={handlePublish} 
                disabled={selectedPlatforms.size === 0 || isPublishing}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
              >
                {isPublishing ? <Loader2 size={12} className="animate-spin mr-1.5" /> : null}
                Publish
              </Button>
            </div>
          </header>
        ) : (
          <header className="h-11 flex items-center justify-between px-5 shrink-0" style={{ borderBottom: '1px solid #1f1f1f' }}>
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              {isFullScreen && (
                <div className="flex items-center gap-2 mr-2">
                  <Logo className="w-5 h-5 text-[#f2f2f2]" />
                  <span className="text-[13px] font-semibold text-[#f2f2f2]">Echo</span>
                  <span className="text-[#3a3a3a]">/</span>
                </div>
              )}
              <span className="text-[12px] text-[#52525b]">
                {currentView === 'PUBLISHED' ? 'Published' : currentView === 'ANALYTICS' ? 'Analytics' : 'Drafts'}
              </span>
              {currentPost && currentView === 'DRAFT' && (
                <>
                  <span className="text-[#3a3a3a] text-[12px]">/</span>
                  <span className="text-[12px] text-[#a1a1aa] truncate max-w-[200px]">
                    {currentPost.title || 'Untitled'}
                  </span>
                </>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {publishResult && (
                <span className={`text-[11px] flex items-center gap-1 ${publishResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {publishResult.success ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                  {publishResult.message}
                </span>
              )}

              {currentPost && currentView === 'DRAFT' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setShowPreview(!showPreview)}
                        className={showPreview ? 'text-indigo-400' : ''}
                      >
                        {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showPreview ? 'Exit Preview' : 'Preview'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
                        {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isFullScreen ? 'Exit focus mode' : 'Focus mode'}</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="h-4" />
                  <Button
                    onClick={handlePublish}
                    disabled={selectedPlatforms.size === 0 || isPublishing}
                    size="sm"
                  >
                    {isPublishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    {isScheduling && scheduledAt ? 'Schedule' : 'Publish Now'}
                  </Button>
                </>
              )}

              <Separator orientation="vertical" className="h-4" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Bell size={13} /></Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </div>
          </header>
        )}

        {/* Content area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {currentView === 'PUBLISHED' ? (
            <PublishedView posts={posts} onSelect={(post) => { setCurrentPost(post); setCurrentView('DRAFT'); }} />
          ) : currentView === 'ANALYTICS' ? (
            <AnalyticsView />
          ) : currentPost ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Title bar - hidden during preview */}
              {!showPreview && (
                <div className="px-8 pt-5 pb-2 shrink-0">
                  <input
                    type="text"
                    value={currentPost.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled"
                    className="w-full bg-transparent text-[22px] font-semibold text-[#f2f2f2] placeholder:text-[#3a3a3a] border-none outline-none focus:ring-0 leading-tight"
                  />
                </div>
              )}
              {/* Editor fills remaining space */}
              <div className="flex-1 min-h-0 overflow-hidden relative">
                <div className={`absolute inset-0 bg-[#0f0f0f] z-10 ${showPreview ? 'block' : 'hidden'}`}>
                  <PreviewPanelWrapper post={currentPost} />
                </div>
                <div className={`absolute inset-0 ${!showPreview ? 'block' : 'hidden'}`}>
                  <Editor post={currentPost} onTitleChange={handleTitleChange} onStatusChange={handleStatusChange} />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState onCreate={() => setIsCreating(true)} />
          )}
        </div>
      </main>

      {/* ── Right Panel: Publish ──────────────────────────────────────────── */}
      {currentPost && !isFullScreen && !showPreview && currentView === 'DRAFT' && (
        <aside className="w-[240px] flex flex-col shrink-0 surface-right">
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
            <p className="label-xs">Publish to Platforms</p>
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            <div className="space-y-0.5">
            {PLATFORMS.map(platform => {
              const isOn = selectedPlatforms.has(platform.id);
              const Icon = platform.icon;

              return (
                <div key={platform.id} className={`platform-row ${isOn ? 'platform-row-active' : ''}`} onClick={() => togglePlatform(platform.id)}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-[22px] h-[22px] rounded bg-[#1f1f1f] flex items-center justify-center shrink-0">
                      <Icon size={12} className={isOn ? 'text-indigo-400' : 'text-[#71717a]'} />
                    </div>
                    <span className={`text-[13px] truncate ${isOn ? 'text-[#f2f2f2]' : 'text-[#71717a]'}`}>
                      {platform.name}
                    </span>
                  </div>
                  <Toggle checked={isOn} onChange={() => togglePlatform(platform.id)} />
                </div>
              );
            })}
            </div>
          </ScrollArea>

          {/* Scheduling */}
          <div className="px-3 pb-3" style={{ borderTop: '1px solid #1f1f1f' }}>
            <div className="platform-row mt-2" onClick={() => setIsScheduling(!isScheduling)}>
              <div className="flex items-center gap-2.5">
                <div className="w-[22px] h-[22px] rounded bg-[#1f1f1f] flex items-center justify-center shrink-0">
                  <Clock size={12} className={isScheduling ? 'text-indigo-400' : 'text-[#71717a]'} />
                </div>
                <div>
                  <p className={`text-[13px] ${isScheduling ? 'text-[#f2f2f2]' : 'text-[#71717a]'}`}>Schedule Post</p>
                  {isScheduling && scheduledAt && (
                    <p className="text-[10px] text-[#52525b] mt-0.5">{new Date(scheduledAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <Toggle checked={isScheduling} onChange={() => setIsScheduling(!isScheduling)} />
            </div>

            {isScheduling && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full mt-2 px-2.5 py-1.5 bg-[#1a1a1a] border border-[#252525] rounded-md text-[12px] text-[#d4d4d4] focus:outline-none focus:border-indigo-500"
              />
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Save Draft</Button>
              <Button
                size="sm" className="flex-1"
                onClick={handlePublish}
                disabled={selectedPlatforms.size === 0 || isPublishing}
              >
                {isPublishing ? '...' : isScheduling && scheduledAt ? 'Schedule' : 'Publish'}
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Create Draft Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New draft</DialogTitle>
            <DialogDescription>Give your post a working title.</DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={newPostTitle}
            onChange={e => setNewPostTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreatePost()}
            placeholder="Post title..."
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#252525] rounded-md text-[13px] text-[#f2f2f2] placeholder-[#52525b] focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleCreatePost}
              disabled={!newPostTitle.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Settings Required Dialog ────────────────────────────────────────── */}
      <Dialog open={!!showSettingsDialog} onOpenChange={() => setShowSettingsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Platform</DialogTitle>
            <DialogDescription>
              You need to connect this platform in your Settings before you can publish to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSettingsDialog(null)}>Cancel</Button>
            <Button onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

function PublishedView({ posts, onSelect }: { posts: any[]; onSelect: (p: any) => void }) {
  const [filterPlatform, setFilterPlatform] = useState<string | 'all'>('all');

  const published = posts.filter(p => {
    if (p.status !== 'PUBLISHED') return false;
    if (filterPlatform === 'all') return true;
    const plats = p.platforms || {};
    return plats[filterPlatform]?.status === 'PUBLISHED';
  });

  const filterOptions = [
    { id: 'all', name: 'All' },
    { id: 'twitter', name: 'X (Twitter)' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'devto', name: 'Dev.to' },
    { id: 'hashnode', name: 'Hashnode' },
    { id: 'medium', name: 'Medium' }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-[#f2f2f2]">Published</h2>
          <p className="text-[12px] text-[#52525b] mt-0.5">{published.length} post{published.length !== 1 ? 's' : ''}</p>
        </div>
        
        {/* Platform Filter */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {filterOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterPlatform(opt.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap border ${
                filterPlatform === opt.id
                  ? 'bg-[#f2f2f2] text-[#0f0f0f] border-[#f2f2f2]'
                  : 'bg-transparent text-[#71717a] border-[#252525] hover:text-[#d4d4d4] hover:border-[#3a3a3a]'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>
      {published.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Globe size={28} className="text-[#3a3a3a] mb-3" />
          <p className="text-[13px] text-[#52525b]">Nothing published yet</p>
        </div>
      ) : (
        <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
          {published.map((post: any, idx: number) => {
            const platforms = Object.entries(post.platforms || {})
              .filter(([_, v]: any) => v.status === 'PUBLISHED')
              .map(([k]) => k);
            return (
              <div
                key={post.id}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors ${
                  idx < published.length - 1 ? 'border-b border-[#1f1f1f]' : ''
                }`}
                onClick={() => onSelect(post)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[#f2f2f2] font-medium truncate">{post.title || 'Untitled'}</p>
                  <p className="text-[11px] text-[#52525b] mt-0.5">
                    {new Date(post.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {/* Platform badges */}
                  <div className="flex gap-1.5">
                    {platforms.map(plat => {
                      const icons: Record<string, React.ComponentType<any>> = {
                        twitter: Twitter, linkedin: Linkedin, devto: Globe,
                        hashnode: FileText, medium: BookOpen,
                      };
                      const Icon = icons[plat] || Globe;
                      return (
                        <div key={plat} className="text-[#6366f1]" title={plat}>
                          <Icon size={12} />
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
                    Published
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────
function AnalyticsView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <BarChart2 size={28} className="text-[#3a3a3a] mb-3" />
      <h2 className="text-[15px] font-semibold text-[#f2f2f2] mb-1">Analytics</h2>
      <p className="text-[12px] text-[#52525b]">Cross-platform performance metrics — coming soon.</p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <PenTool size={24} className="text-[#3a3a3a] mb-3" />
      <h2 className="text-[15px] font-semibold text-[#f2f2f2] mb-1">Start writing</h2>
      <p className="text-[12px] text-[#52525b] mb-5 max-w-xs">
        Write once, publish everywhere — X, LinkedIn, Dev.to, Hashnode, Medium.
      </p>
      <button onClick={onCreate} className="btn-primary flex items-center gap-1.5">
        <Plus size={13} /> New draft
      </button>
    </div>
  );
}

// ─── Preview Panel Wrapper ────────────────────────────────────────────────────
function PreviewPanelWrapper({ post }: { post: any }) {
  const tabs = ['devto', 'hashnode', 'medium', 'twitter', 'linkedin'];
  const [activeTab, setActiveTab] = useState<string>('devto');

  // Fallback to markdown if structuredContent is missing for older posts
  // But PreviewRenderer will handle structuredContent or plain text
  const contentToRender = post.structuredContent || post.bodyMarkdown;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0f0f0f]">
      {/* Pill Tab bar */}
      <div className="flex justify-center items-center px-4 pt-6 pb-8 shrink-0 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-3">
          {tabs.map(platform => {
            const meta = PLATFORMS.find(p => p.id === platform) || { name: platform, icon: Globe as any };
            const Icon = meta.icon;
            const isActive = activeTab === platform;
            
            return (
              <button
                key={platform}
                onClick={() => setActiveTab(platform)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#ffffff] text-[#0f0f0f]' // White pill with dark text
                    : 'bg-[#1f1f1f] text-[#a3a3a3] hover:text-[#f2f2f2] hover:bg-[#2a2a2a]'
                }`}
              >
                <div className={`flex items-center justify-center w-5 h-5 rounded ${isActive ? 'bg-[#2563eb] text-white' : ''}`}>
                  <Icon size={14} className={isActive ? 'text-white' : ''} />
                </div>
                {meta.name}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1 bg-[#141414] rounded-t-2xl mx-6 border border-[#252525] border-b-0 shadow-2xl">
        <PreviewRenderer
          platform={activeTab}
          structuredContent={contentToRender}
          title={post.title}
          tags={post.tags || []}
        />
      </ScrollArea>
    </div>
  );
}