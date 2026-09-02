import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Post, PostStatus, PlatformStatus } from '@/types';

interface PostState {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  removePost: (id: string) => void;
  setCurrentPost: (post: Post | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePlatformStatus: (postId: string, platform: string, statusUpdate: Partial<PlatformStatus>) => void;
}

export const usePostStore = create<PostState>()(
  persist(
    (set) => ({
      posts: [],
      currentPost: null,
      isLoading: false,
      error: null,
      
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      updatePost: (id, updates) => set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        currentPost: state.currentPost?.id === id ? { ...state.currentPost, ...updates } : state.currentPost,
      })),
      removePost: (id) => set((state) => ({
        posts: state.posts.filter((p) => p.id !== id),
        currentPost: state.currentPost?.id === id ? null : state.currentPost,
      })),
      setCurrentPost: (post) => set({ currentPost: post }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      updatePlatformStatus: (postId, platform, statusUpdate) => set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== postId) return p;
          const platforms = { ...p.platforms };
          const current = platforms[platform] || { status: 'NOT_STARTED' };
          platforms[platform] = { ...current, ...statusUpdate };
          return { ...p, platforms };
        }),
        currentPost: state.currentPost?.id === postId 
          ? { 
              ...state.currentPost, 
              platforms: { 
                ...state.currentPost.platforms, 
                [platform]: { 
                  ...(state.currentPost.platforms[platform] || { status: 'NOT_STARTED' }), 
                  ...statusUpdate 
                } 
              } 
            } 
          : state.currentPost,
      })),
    }),
    {
      name: 'echo-posts',
      partialize: (state) => ({ posts: state.posts }),
    }
  )
);