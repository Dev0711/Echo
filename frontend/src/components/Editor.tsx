'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import MDEditor, { commands, ICommand } from '@uiw/react-md-editor';
import { usePostStore } from '@/lib/store';
import { postsApi } from '@/lib/api';
import type { Post, PostAutosaveRequest } from '@/types';
import { AlertCircle, CheckCircle, Loader2, Tag, X } from 'lucide-react';

interface EditorProps {
  post: Post | null;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: 'DRAFT' | 'READY' | 'PUBLISHED') => void;
}

const editorCommands: ICommand[] = [
  commands.bold, commands.italic, commands.strikethrough, commands.divider,
  commands.title1, commands.title2, commands.title3, commands.divider,
  commands.codeBlock, commands.quote, commands.divider,
  commands.unorderedListCommand, commands.orderedListCommand, commands.divider,
  commands.link, commands.image, commands.divider,
  commands.fullscreen,
];

export function Editor({ post, onTitleChange, onStatusChange }: EditorProps) {
  const [markdown, setMarkdown] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [editorHeight, setEditorHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutosavedContentRef = useRef('');
  const { updatePost } = usePostStore();

  // Dynamically compute the editor height to fill the container
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Subtract: title(~80px) + toolbar(~44px) + tags(~52px) + footer(~40px)
        const available = rect.height - 220;
        setEditorHeight(Math.max(300, available));
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (post) {
      setMarkdown(post.bodyMarkdown);
      lastAutosavedContentRef.current = post.bodyMarkdown;
    }
  }, [post?.id]);

  const triggerAutosave = useCallback(() => {
    if (!post || !isDirty) return;
    const request: PostAutosaveRequest = { bodyMarkdown: markdown };
    postsApi.autosave(post.id, request)
      .then(() => {
        updatePost(post.id, {
          bodyMarkdown: markdown,
          lastAutosavedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setLastSaved(new Date());
        setSaveError(null);
        lastAutosavedContentRef.current = markdown;
        setIsDirty(false);
      })
      .catch((error) => {
        setSaveError(error.response?.data?.message || 'Autosave failed');
      });
  }, [post, markdown, isDirty, updatePost]);

  useEffect(() => {
    if (!post) return;
    const hasChanged = markdown !== lastAutosavedContentRef.current;
    setIsDirty(hasChanged);
    if (hasChanged) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(triggerAutosave, 3000);
    }
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [markdown, post, triggerAutosave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (post && isDirty) triggerAutosave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, isDirty, triggerAutosave]);

  const addTag = () => {
    if (!tagInput.trim() || !post) return;
    const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!post.tags.includes(newTag)) {
      updatePost(post.id, { tags: [...post.tags, newTag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!post) return;
    updatePost(post.id, { tags: post.tags.filter(t => t !== tag) });
  };

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;

  return (
    <div ref={containerRef} className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-2xl">
      {/* Title */}
      <div className="px-8 pt-8 pb-4 border-b border-white/5">
        <input
          type="text"
          value={post?.title || ''}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled masterpiece..."
          className="w-full bg-transparent text-4xl font-extrabold text-white placeholder:text-gray-700 border-none outline-none focus:ring-0 leading-tight tracking-tight"
        />

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Tag size={14} className="text-gray-500 shrink-0" />
          {post?.tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full">
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            placeholder="Add tag..."
            className="bg-transparent text-xs text-gray-400 placeholder:text-gray-600 border-none outline-none w-24 focus:ring-0 focus:w-36 transition-all"
          />
        </div>
      </div>

      {/* MDEditor — explicit pixel height via ResizeObserver */}
      <div className="flex-1 min-h-0" data-color-mode="dark">
        <MDEditor
          value={markdown}
          onChange={(val) => setMarkdown(val || '')}
          commands={editorCommands}
          height={editorHeight}
          visibleDragbar={false}
          previewOptions={{
            className: 'prose prose-invert max-w-none px-8 py-6',
          }}
          textareaProps={{
            placeholder: 'Start writing... Use the toolbar for rich formatting, or type Markdown directly.',
            style: { paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.5rem', fontSize: '1.05rem', lineHeight: '1.8' },
            spellCheck: true,
          }}
          style={{ background: 'transparent', border: 'none' }}
        />
      </div>

      {/* Footer status bar */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-white/5 text-xs text-gray-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
        <div className="flex items-center gap-2">
          {saveError ? (
            <span className="text-red-400 flex items-center gap-1.5"><AlertCircle size={12} /> {saveError}</span>
          ) : isDirty ? (
            <span className="text-amber-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Saving...</span>
          ) : lastSaved ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle size={12} /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span>Ctrl+S to save</span>
          )}
        </div>
      </div>
    </div>
  );
}