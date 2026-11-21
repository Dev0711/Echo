'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '@/lib/auth';
import { usePostStore } from '@/lib/store';
import { postsApi, credentialsApi, errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { PLATFORMS, platformMeta } from '@/lib/platforms';
import { Editor, EditorHandle } from '@/components/Editor';
import type { EditorSelection } from '@/components/BlockEditor';
import { PreviewRenderer } from '@/components/PreviewRenderer';
import { PostsView } from '@/components/PostsView';
import { CalendarView } from '@/components/CalendarView';
import { PublishDialog } from '@/components/PublishDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Plus, Eye, Send, Loader2, Settings, ChevronLeft, ChevronRight, Bell, Maximize2, Minimize2,
  BarChart2, Sparkles, History, User, CalendarDays, FileText, ArrowLeft, Pencil,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TemplatePickerModal } from '@/components/TemplatePickerModal';
import { VersionHistoryPanel } from '@/components/VersionHistoryPanel';
import { AiAssistantPanel } from '@/components/AiAssistantPanel';
import { NotificationPanel, NotificationBell, useNotificationStore } from '@/components/NotificationPanel';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import type { Post, PostCreateRequest } from '@/types';

type View = 'POSTS' | 'EDITOR' | 'CALENDAR' | 'ANALYTICS';

export default function DashboardPage() {
  const [view, setView] = useState<View>('POSTS');
  const [isCreating, setIsCreating] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem('echo_sidebar_collapsed') === 'true') setSidebarCollapsed(true); } catch { /* ignore */ }
  }, []);
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('echo_sidebar_collapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const [showPublish, setShowPublish] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [aiSelection, setAiSelection] = useState<EditorSelection | null>(null);
  const [liveMarkdown, setLiveMarkdown] = useState('');
  const [templateInitialBlocks, setTemplateInitialBlocks] = useState<object[] | null>(null);

  const { addNotification } = useNotificationStore();
  const { posts, currentPost, setPosts, addPost, updatePost, removePost, setCurrentPost, setLoading, isLoading } = usePostStore();
  const user = auth.getUser();
  const editorRef = useRef<EditorHandle>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try { setPosts((await postsApi.getAll()).data); }
    catch (e) { toast.error(errorMessage(e, 'Could not load your posts.')); }
    finally { setLoading(false); }
  }, [setLoading, setPosts]);

  useEffect(() => {
    if (!auth.isAuthenticated()) { window.location.href = '/login'; return; }
    void loadPosts();
    credentialsApi.getAll()
      .then(res => setConnected(Object.fromEntries(res.data.map((s: { platform: string; connected: boolean }) => [s.platform, !!s.connected]))))
      .catch(() => { /* connection status is optional */ });
  }, [loadPosts]);

  const openPost = (post: Post) => { setCurrentPost(post); setShowPreview(false); setView('EDITOR'); };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim()) return;
    setLoading(true);
    try {
      const req: PostCreateRequest = {
        title: newPostTitle.trim(), bodyMarkdown: '', tags: [],
        structuredContent: templateInitialBlocks && templateInitialBlocks.length > 0 ? JSON.stringify(templateInitialBlocks) : undefined,
      };
      const { data } = await postsApi.create(req);
      addPost(data); setCurrentPost(data);
      setNewPostTitle(''); setTemplateInitialBlocks(null); setIsCreating(false); setShowPreview(false); setView('EDITOR');
      addNotification({ type: 'info', title: 'New draft created', message: `"${data.title}" is ready to edit.` });
    } catch (e) { toast.error(errorMessage(e, 'Could not create the post.')); }
    finally { setLoading(false); }
  };

  const handleDelete = async (post: Post) => {
    try { await postsApi.remove(post.id); removePost(post.id); toast.success('Post deleted'); }
    catch (e) { toast.error(errorMessage(e, 'Could not delete the post.')); throw e; }
  };

  const handleUnschedule = async (post: Post) => {
    try { const { data } = await postsApi.unschedule(post.id); updatePost(post.id, data); toast.success('Schedule cancelled — it’s back in your drafts'); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  const handleRetry = async (post: Post, platform: string) => {
    try {
      await postsApi.publish(post.id, { platforms: [platform] });
      toast.info(`Retrying ${platformMeta(platform).name}…`);
      // Platforms publish in the background; check back a couple of times.
      setTimeout(loadPosts, 2500); setTimeout(loadPosts, 7000);
    } catch (e) { toast.error(errorMessage(e, 'Retry failed.')); }
  };

  const handleTitleChange = (title: string) => { if (currentPost) updatePost(currentPost.id, { title }); };

  const openAi = () => {
    setAiSelection(editorRef.current?.getSelection() ?? null);
    setLiveMarkdown(editorRef.current?.getMarkdown() ?? currentPost?.bodyMarkdown ?? '');
    setShowAiAssistant(true);
  };
  const openHistory = () => { setLiveMarkdown(editorRef.current?.getMarkdown() ?? currentPost?.bodyMarkdown ?? ''); setShowVersionHistory(true); };

  const recentPosts = posts.filter(p => p.status !== 'PUBLISHED').slice(0, 6);
  const sidebarWidth = sidebarCollapsed ? 'w-[52px]' : 'w-[208px]';
  const navActive = (id: 'POSTS' | 'CALENDAR' | 'ANALYTICS') => view === id || (id === 'POSTS' && view === 'EDITOR');
  const inEditor = view === 'EDITOR' && !!currentPost;
  const crumb = view === 'CALENDAR' ? 'Calendar' : view === 'ANALYTICS' ? 'Analytics' : 'Posts';

  const IconBtn = ({ label, onClick, children, className = '' }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <Tooltip>
      <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={label} onClick={onClick} className={className}>{children}</Button></TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={400}>
      <div className="h-screen w-screen flex overflow-hidden bg-[#0f0f0f]">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        {!isFullScreen && (
          <aside className={`${sidebarWidth} flex flex-col shrink-0 surface-sidebar relative transition-all duration-200`}>
            <div className={`px-3 pt-5 pb-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
              <Logo className="w-5 h-5 text-[#f2f2f2] shrink-0" />
              {!sidebarCollapsed && <span className="text-[14px] font-semibold text-[#f2f2f2] tracking-tight">Echo</span>}
            </div>

            <div className="px-2 mb-4">
              <Button onClick={() => setIsCreating(true)} className={`w-full ${sidebarCollapsed ? 'px-0' : ''}`} aria-label="New post">
                <Plus size={14} />{!sidebarCollapsed && 'New post'}
              </Button>
            </div>

            <nav className="px-1.5 space-y-0.5 mb-4" aria-label="Main">
              {([['POSTS', 'Posts', FileText], ['CALENDAR', 'Calendar', CalendarDays], ['ANALYTICS', 'Analytics', BarChart2]] as const).map(([id, label, Icon]) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button onClick={() => { setView(id); setShowPreview(false); }} aria-current={navActive(id) ? 'page' : undefined}
                      className={`nav-item w-full rounded-sm ${sidebarCollapsed ? 'justify-center px-0' : ''} ${navActive(id) ? 'nav-active !text-[#f2f2f2]' : ''}`}>
                      <Icon size={14} />{!sidebarCollapsed && label}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
                </Tooltip>
              ))}
            </nav>

            {!sidebarCollapsed ? (
              <ScrollArea className="flex-1 px-2 pb-4">
                {recentPosts.length > 0 && <p className="label-xs px-2 mb-2">Continue writing</p>}
                <ul className="space-y-0.5">
                  {recentPosts.map(post => (
                    <li key={post.id}>
                      <button onClick={() => openPost(post)}
                        className={`w-full text-left px-2 py-1.5 rounded-sm text-[12px] truncate transition-colors ${currentPost?.id === post.id && inEditor ? 'text-[#f2f2f2] bg-white/[0.05]' : 'text-[#71717a] hover:text-[#d4d4d4]'}`}>
                        {post.title || 'Untitled'}
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : <div className="flex-1" />}

            <div className="divider mx-3 mb-3" />
            <div className={`px-1.5 pb-4 flex ${sidebarCollapsed ? 'flex-col items-center gap-2' : 'items-center gap-2 px-3'}`}>
              {sidebarCollapsed ? (
                <>
                  <IconBtn label="Notifications" onClick={() => setShowNotifications(true)}><Bell size={13} /></IconBtn>
                  <a href="/settings" aria-label="Settings" className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white"><Settings size={13} /></a>
                </>
              ) : (
                <>
                  <div suppressHydrationWarning className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">{user?.name?.[0]?.toUpperCase() ?? '?'}</div>
                  <p suppressHydrationWarning className="flex-1 min-w-0 text-[11px] text-[#d4d4d4] truncate font-medium">{user?.name ?? 'Account'}</p>
                  <NotificationBell onClick={() => setShowNotifications(true)} />
                  <a href="/profile" aria-label="Profile" className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white"><User size={13} /></a>
                  <a href="/settings" aria-label="Settings" className="text-[#52525b] hover:text-[#d4d4d4]"><Settings size={12} /></a>
                </>
              )}
            </div>

            <button onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1f1f1f] border border-[#2e2e2e] flex items-center justify-center text-[#71717a] hover:text-[#f2f2f2] hover:bg-[#2a2a2a] z-10 shadow-md">
              {sidebarCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
            </button>
          </aside>
        )}

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 surface-main">
          <header className="h-12 flex items-center justify-between px-5 shrink-0" style={{ borderBottom: '1px solid #1f1f1f' }}>
            <div className="flex items-center gap-2 min-w-0">
              {isFullScreen && <Logo className="w-5 h-5 text-[#f2f2f2] mr-1" />}
              {inEditor ? (
                <>
                  <button onClick={() => { setView('POSTS'); setShowPreview(false); }} className="flex items-center gap-1 text-[12px] text-[#71717a] hover:text-[#d4d4d4]"><ArrowLeft size={13} /> Posts</button>
                  <span className="text-[#3a3a3a] text-[12px]">/</span>
                  <span className="text-[12px] text-[#a1a1aa] truncate max-w-[260px]">{currentPost!.title || 'Untitled'}</span>
                  {showPreview && <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">Preview</span>}
                </>
              ) : <span className="text-[12px] text-[#a1a1aa]">{crumb}</span>}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {inEditor && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(p => !p)} aria-pressed={showPreview}>
                    {showPreview ? <Pencil size={13} /> : <Eye size={13} />}<span className="hidden md:inline">{showPreview ? 'Edit' : 'Preview'}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={openHistory}><History size={13} /><span className="hidden md:inline">History</span></Button>
                  <Button variant="ghost" size="sm" onClick={openAi} className="!text-violet-300 hover:!bg-violet-500/10"><Sparkles size={13} /><span className="hidden md:inline">AI assistant</span></Button>
                  <IconBtn label={isFullScreen ? 'Exit focus mode' : 'Focus mode'} onClick={() => setIsFullScreen(f => !f)}>{isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}</IconBtn>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <Button size="sm" onClick={() => setShowPublish(true)}><Send size={12} /> Publish</Button>
                </>
              )}
              {!inEditor && <IconBtn label="Notifications" onClick={() => setShowNotifications(true)}><Bell size={13} /></IconBtn>}
            </div>
          </header>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {view === 'ANALYTICS' ? <AnalyticsDashboard />
              : view === 'CALENDAR' ? <CalendarView posts={posts} onOpen={openPost} />
              : inEditor ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {!showPreview && (
                    <div className="px-8 pt-5 pb-2 shrink-0">
                      <input type="text" value={currentPost!.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Give your post a title" aria-label="Post title"
                        className="w-full bg-transparent text-[24px] font-semibold text-[#f2f2f2] placeholder:text-[#3a3a3a] border-none outline-none focus:ring-0 leading-tight" />
                    </div>
                  )}
                  <div className="flex-1 min-h-0 overflow-hidden relative">
                    <div className={`absolute inset-0 z-10 ${showPreview ? 'block' : 'hidden'}`}><PreviewPanelWrapper post={currentPost!} /></div>
                    <div className={`absolute inset-0 ${!showPreview ? 'block' : 'hidden'}`}>
                      <Editor ref={editorRef} post={currentPost} onTitleChange={handleTitleChange} onStatusChange={() => {}} />
                    </div>
                  </div>
                </div>
              ) : (
                <PostsView posts={posts} isLoading={isLoading} connected={connected} onOpen={openPost}
                  onCreate={() => setIsCreating(true)} onDelete={handleDelete} onRetry={handleRetry} onUnschedule={handleUnschedule} />
              )}
          </div>
        </main>

        {/* ── Panels & dialogs ──────────────────────────────────────────── */}
        <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

        {currentPost && (
          <>
            {showAiAssistant && (
              <AiAssistantPanel
                postId={currentPost.id}
                postContent={liveMarkdown}
                selectedText={aiSelection?.text}
                isOpen={showAiAssistant}
                onClose={() => { setShowAiAssistant(false); setAiSelection(null); }}
                onReplace={(target, text) => {
                  if (target.scope === 'selection' && aiSelection) void editorRef.current?.replaceRange(aiSelection.from, aiSelection.to, text);
                  else if (target.scope === 'intro' && target.range) editorRef.current?.replaceMarkdown(liveMarkdown.slice(0, target.range.start) + text + liveMarkdown.slice(target.range.end));
                  else editorRef.current?.replaceMarkdown(text);
                }}
                onPrependTldr={text => editorRef.current?.replaceMarkdown(`> **TL;DR:** ${text}\n\n${liveMarkdown}`)}
                onAddTags={tags => updatePost(currentPost.id, { tags: [...new Set([...(currentPost.tags || []), ...tags])].slice(0, 10) })}
                onSetTitle={handleTitleChange}
                onSetMeta={text => updatePost(currentPost.id, { metaDescription: text })}
                onSetOverride={(platform, text) => updatePost(currentPost.id, { platformOverrides: { ...(currentPost.platformOverrides || {}), [platform]: text } })}
              />
            )}
            <VersionHistoryPanel
              postId={currentPost.id}
              currentMarkdown={liveMarkdown}
              isOpen={showVersionHistory}
              onClose={() => setShowVersionHistory(false)}
              onRestored={restored => {
                updatePost(restored.id, restored);
                editorRef.current?.replaceMarkdown(restored.bodyMarkdown || '');
              }}
            />
          </>
        )}

        <PublishDialog open={showPublish} onOpenChange={setShowPublish} post={currentPost} connected={connected}
          onPostUpdated={p => updatePost(p.id, { status: p.status, platforms: p.platforms, scheduledAt: p.scheduledAt, scheduledPlatforms: p.scheduledPlatforms })} />

        <Dialog open={isCreating} onOpenChange={o => { setIsCreating(o); if (!o) setTemplateInitialBlocks(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New post</DialogTitle>
              <DialogDescription>Give it a working title — you can change it any time.</DialogDescription>
            </DialogHeader>
            <input type="text" value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreatePost()}
              placeholder="e.g. How I built my first API" aria-label="Post title" autoFocus
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#252525] rounded-md text-[13px] text-[#f2f2f2] placeholder-[#52525b] focus:outline-none focus:border-indigo-500" />
            <button type="button" onClick={() => setShowTemplatePicker(true)} className="text-xs text-violet-400 hover:text-violet-300 text-left flex items-center gap-1.5">
              <Sparkles size={11} />{templateInitialBlocks && templateInitialBlocks.length > 0 ? '✓ Template selected — click to change' : 'Start from a template (optional)'}
            </button>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => { setIsCreating(false); setTemplateInitialBlocks(null); }}>Cancel</Button>
              <Button size="sm" onClick={handleCreatePost} disabled={!newPostTitle.trim() || isLoading}>
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TemplatePickerModal isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)}
          onSelect={blocks => { setTemplateInitialBlocks(blocks); setShowTemplatePicker(false); }} />
      </div>
    </TooltipProvider>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────
function PreviewPanelWrapper({ post }: { post: Post }) {
  const [activeTab, setActiveTab] = useState<string>('devto');
  const contentToRender = post.structuredContent || post.bodyMarkdown;
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0f0f0f]">
      <div className="flex justify-center items-center px-4 pt-5 pb-6 shrink-0 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Preview platform">
        <div className="flex items-center gap-2">
          {PLATFORMS.map(p => {
            const Icon = p.icon; const isActive = activeTab === p.id;
            return (
              <button key={p.id} role="tab" aria-selected={isActive} onClick={() => setActiveTab(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-white text-[#0f0f0f]' : 'bg-[#1f1f1f] text-[#a3a3a3] hover:text-[#f2f2f2] hover:bg-[#2a2a2a]'}`}>
                <Icon size={14} />{p.name}
              </button>
            );
          })}
        </div>
      </div>
      <ScrollArea className="flex-1 bg-[#141414] rounded-t-2xl mx-6 border border-[#252525] border-b-0 shadow-2xl">
        <PreviewRenderer platform={activeTab} structuredContent={contentToRender} title={post.title} tags={post.tags || []} />
      </ScrollArea>
    </div>
  );
}
