'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { usePostStore } from '@/lib/store';
import { postsApi } from '@/lib/api';
import type { Post, PostAutosaveRequest } from '@/types';
import { Save, Eye, Globe, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface EditorProps {
  post: Post | null;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: 'DRAFT' | 'READY' | 'PUBLISHED') => void;
}

import type { ICommand } from '@uiw/react-md-editor';

const editorCommands: ICommand[] = [
  'undo', 'redo', '|',
  'bold', 'italic', '|',
  'heading', '|',
  'code', 'quote', '|',
  'unorderedListCommand', 'orderedListCommand', '|',
  'image', 'link', '|',
  'table', 'fullscreen'
] as unknown as ICommand[];

export function Editor({ post, onTitleChange, onStatusChange }: EditorProps) {
  const [markdown, setMarkdown] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutosavedContentRef = useRef('');
  const { updatePost, updatePlatformStatus } = usePostStore();

  // Initialize markdown from post
  useEffect(() => {
    if (post) {
      setMarkdown(post.bodyMarkdown);
      lastAutosavedContentRef.current = post.bodyMarkdown;
    }
  }, [post]);

  // Autosave logic: 3-5s debounce or every 30s
  const triggerAutosave = useCallback(() => {
    if (!post || !isDirty) return;
    
    const request: PostAutosaveRequest = { bodyMarkdown: markdown };
    
    postsApi.autosave(post.id, request)
      .then((response) => {
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
        console.error('Autosave error:', error);
      });
  }, [post, markdown, isDirty, updatePost]);

  // Debounced autosave
  useEffect(() => {
    if (!post) return;
    
    const hasChanged = markdown !== lastAutosavedContentRef.current;
    setIsDirty(hasChanged);
    
    if (hasChanged) {
      // Debounce 3-5 seconds
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        triggerAutosave();
      }, 4000);
    }
    
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [markdown, post, triggerAutosave]);

  // Periodic autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (post && isDirty) {
        triggerAutosave();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [post, isDirty, triggerAutosave]);

  // Manual save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (post && isDirty) {
          triggerAutosave();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, isDirty, triggerAutosave]);

  const handleChange = (value?: string, _event?: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(value || '');
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never saved';
    return `Saved ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex-1">
          <input
            type="text"
            value={post?.title || ''}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Post title..."
            className="w-full px-3 py-2 text-lg font-medium border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          />
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && <span className="text-xs text-gray-500 dark:text-gray-400">{formatLastSaved()}</span>}
          {saveError && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {saveError}
            </span>
          )}
          {isDirty && !saveError && (
            <span className="text-xs text-yellow-500 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
          {!isDirty && lastSaved && !saveError && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle size={12} /> Saved
            </span>
          )}
        </div>
      </div>
      
      {/* Editor */}
      <MDEditor
        value={markdown}
        onChange={handleChange}
        commands={editorCommands}
        className="flex-1"
        textareaProps={{
          spellCheck: true,
          placeholder: "Write your article in Markdown...",
        }}
      />
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <span>{markdown.split('\n').length} lines • {markdown.length} characters</span>
        <span>Press Ctrl+S to save</span>
      </div>
    </div>
  );
}