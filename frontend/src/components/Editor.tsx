'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
const BlockEditor = dynamic(() => import('./BlockEditor'), { ssr: false });
import { usePostStore } from '@/lib/store';
import { postsApi } from '@/lib/api';
import type { Post, PostAutosaveRequest } from '@/types';
import { AlertCircle, CheckCircle, Loader2, Tag, X, Twitter, Linkedin, Globe, FileText, BookOpen } from 'lucide-react';

interface EditorProps {
  post: Post | null;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: 'DRAFT' | 'READY' | 'PUBLISHED') => void;
}



export function Editor({ post, onTitleChange, onStatusChange }: EditorProps) {
  const [markdown, setMarkdown] = useState('');
  const [structuredContent, setStructuredContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [editorHeight, setEditorHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutosavedContentRef = useRef('');
  const lastAutosavedTitleRef = useRef('');
  const isMountedRef = useRef(true);
  const { updatePost } = usePostStore();

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Dynamically compute the editor height to fill the container
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Subtract: custom header (~46px) + footer status bar (~40px) + small buffer
        const available = rect.height - 100;
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
      const mdContent = post.bodyMarkdown;
      const scContent = post.structuredContent;
      setMarkdown(mdContent || '');
      setStructuredContent(scContent || '');
      lastAutosavedContentRef.current = scContent || mdContent || '';
      lastAutosavedTitleRef.current = post.title || '';
    }
  }, [post?.id]);

  const triggerAutosave = useCallback(() => {
    if (!post || !isDirty) return;
    const request: PostAutosaveRequest = { 
      title: post.title,
      bodyMarkdown: markdown,
      structuredContent: structuredContent,
      platformOverrides: post.platformOverrides
    };
    postsApi.autosave(post.id, request)
      .then(() => {
        updatePost(post.id, {
          bodyMarkdown: request.bodyMarkdown,
          structuredContent: request.structuredContent,
          platformOverrides: request.platformOverrides,
          lastAutosavedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        if (isMountedRef.current) {
          setLastSaved(new Date());
          setSaveError(null);
          setIsDirty(false);
        }
        lastAutosavedContentRef.current = structuredContent || markdown;
        lastAutosavedTitleRef.current = post.title;
      })
      .catch((error) => {
        if (isMountedRef.current) {
          setSaveError(error.response?.data?.message || 'Autosave failed');
        }
      });
  }, [post, markdown, structuredContent, isDirty, updatePost]);

  useEffect(() => {
    if (!post) return;
    const currentContent = structuredContent || markdown;
    const hasContentChanged = currentContent !== lastAutosavedContentRef.current;
    const hasTitleChanged = post.title !== lastAutosavedTitleRef.current;
    
    const hasChanged = hasContentChanged || hasTitleChanged;
    setIsDirty(hasChanged);
    if (hasChanged) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(triggerAutosave, 3000);
    }
    // We explicitly do NOT clear the timeout on unmount.
    // This allows the final autosave to complete in the background if the user navigates away.
  }, [markdown, structuredContent, post, triggerAutosave]);

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

  const uploadImage = async (file: File, cursorPosition: number) => {
    if (!file.type.startsWith('image/')) return;
    
    const placeholder = `![Uploading ${file.name}...]()`;
    setMarkdown(prev => prev.substring(0, cursorPosition) + placeholder + prev.substring(cursorPosition));

    try {
      const sigRes = await fetch('http://localhost:8080/api/media/signature');
      const sigData = await sigRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp.toString());
      formData.append('signature', sigData.signature);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setMarkdown(prev => prev.replace(placeholder, `![${file.name}](${uploadData.secure_url})`));
      }
    } catch (error) {
      console.error('Upload failed', error);
      setMarkdown(prev => prev.replace(placeholder, ''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadImage(file, e.currentTarget.selectionStart);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const items = e.dataTransfer?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadImage(file, e.currentTarget.selectionStart);
          break;
        }
      }
    }
  };

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden bg-transparent">
      {/* Block Editor */}
      <div className="flex-1 overflow-y-auto bg-transparent px-8 py-4 hide-scrollbar">
        <BlockEditor
          structuredContent={structuredContent}
          markdownContent={markdown}
          onChange={(astJson, mdOut) => {
            setStructuredContent(astJson);
            setMarkdown(mdOut);
          }}
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