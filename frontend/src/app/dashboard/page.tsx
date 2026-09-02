'use client';

import { useState, useEffect } from 'react';
import { usePostStore } from '@/lib/store';
import { postsApi } from '@/lib/api';
import { Editor } from '@/components/Editor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Plus, Save, Eye, Send, Trash2, Loader2, ExternalLink } from 'lucide-react';
import type { Post, PostCreateRequest, PublishRequest, PreviewResponse } from '@/types';

export default function DashboardPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [publishingPlatforms, setPublishingPlatforms] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { posts, currentPost, setPosts, addPost, setCurrentPost, setLoading, setError, updatePlatformStatus, isLoading } = usePostStore();

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await postsApi.getAll();
      setPosts(response.data);
    } catch (error) {
      setError('Failed to load posts');
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim()) return;
    
    setLoading(true);
    try {
      const request: PostCreateRequest = {
        title: newPostTitle.trim(),
        bodyMarkdown: '',
        tags: [],
      };
      const response = await postsApi.create(request);
      addPost(response.data);
      setCurrentPost(response.data);
      setNewPostTitle('');
      setIsCreating(false);
    } catch (error) {
      setError('Failed to create post');
      console.error('Create post error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    if (currentPost) {
      setCurrentPost({ ...currentPost, title });
    }
  };

  const handleStatusChange = (status: 'DRAFT' | 'READY' | 'PUBLISHED') => {
    if (currentPost) {
      setCurrentPost({ ...currentPost, status });
    }
  };

  const handlePreview = async () => {
    if (!currentPost) return;
    
    try {
      const response = await postsApi.preview(currentPost.id);
      setShowPreview(true);
    } catch (error) {
      setError('Failed to generate preview');
      console.error('Preview error:', error);
    }
  };

  const handlePublish = async () => {
    if (!currentPost || publishingPlatforms.size === 0) return;
    
    setIsPublishing(true);
    try {
      const request: PublishRequest = {
        platforms: Array.from(publishingPlatforms),
      };
      await postsApi.publish(currentPost.id, request);
      
      // Update local status to pending
      publishingPlatforms.forEach(platform => {
        updatePlatformStatus(currentPost.id, platform, { status: 'PENDING' });
      });
      
      setPublishingPlatforms(new Set());
    } catch (error) {
      setError('Failed to publish');
      console.error('Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    // Note: Backend delete endpoint not implemented yet
    // This would be implemented when needed
    console.log('Delete post:', id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ExternalLink size={24} className="text-blue-600" />
            Echo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cross-posting platform</p>
        </div>
        
        <div className="p-4 border-b">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>New Post</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Your Posts
          </h2>
          
          {posts.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No posts yet. Create your first post!
            </div>
          ) : (
            <ul className="space-y-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <button
                    onClick={() => setCurrentPost(post)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentPost?.id === post.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {post.title || 'Untitled'}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        post.status === 'READY' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {post.status}
                      </span>
                      <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {Object.entries(post.platforms).map(([platform, status]) => (
                        <span
                          key={platform}
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            status.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            status.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            status.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="border-b bg-white dark:bg-gray-900 px-6 py-4">
          {currentPost ? (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentPost.title || 'Untitled'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status: <span className="capitalize">{currentPost.status.toLowerCase()}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Eye size={18} />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => {
                    // Open publish dialog
                  }}
                  disabled={isPublishing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Publish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              Select a post from the sidebar or create a new one
            </div>
          )}
        </header>
        
        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {showPreview && currentPost ? (
            <PreviewPanelWrapper 
              postId={currentPost.id} 
              onClose={() => setShowPreview(false)} 
            />
          ) : (
            <div className="flex-1 flex flex-col p-6">
              {currentPost ? (
                <Editor
                  post={currentPost}
                  onTitleChange={handleTitleChange}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ExternalLink size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      Welcome to Echo
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Write once, publish everywhere. Create a post and publish to Dev.to, Hashnode, X/Twitter, LinkedIn, and Medium.
                    </p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Your First Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Create post modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            <input
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostTitle.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Publish dialog - simplified */}
      {/* Would be a proper modal in production */}
    </div>
  );
}

function PreviewPanelWrapper({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [previews, setPreviews] = useState<PreviewResponse['previews']>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.preview(postId)
      .then((response) => {
        setPreviews(response.data.previews);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Platform Previews</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Back to Editor
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <PreviewPanel previews={previews} />
        )}
      </div>
    </div>
  );
}