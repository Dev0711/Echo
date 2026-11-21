import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  Post,
  PostCreateRequest,
  PostAutosaveRequest,
  PublishRequest,
  PreviewResponse,
  ApiError,
  UserResponse,
  CredentialStatusResponse,
  SaveCredentialRequest,
  VersionSummary,
  VersionDetail,
  AiAssistResponse,
} from '@/types';
import { auth } from './auth';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = auth.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 — token expired / invalid
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      auth.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const postsApi = {
  getAll: () => api.get<Post[]>('/posts'),
  getById: (id: string) => api.get<Post>(`/posts/${id}`),
  create: (data: PostCreateRequest) => api.post<Post>('/posts', data),
  autosave: (id: string, data: PostAutosaveRequest) => api.patch<Post>(`/posts/${id}/autosave`, data),
  preview: (id: string) => api.get<PreviewResponse>(`/posts/${id}/preview`),
  publish: (id: string, data: PublishRequest) => api.post(`/posts/${id}/publish`, data),
  remove: (id: string) => api.delete(`/posts/${id}`),
  unschedule: (id: string) => api.post<Post>(`/posts/${id}/unschedule`),
  versions: (id: string) => api.get<VersionSummary[]>(`/posts/${id}/versions`),
  version: (id: string, versionId: string) => api.get<VersionDetail>(`/posts/${id}/versions/${versionId}`),
  saveVersion: (id: string, label?: string) => api.post<VersionSummary>(`/posts/${id}/versions`, { label }),
  updateVersion: (id: string, versionId: string, data: { label?: string; pinned?: boolean }) =>
    api.patch<VersionSummary>(`/posts/${id}/versions/${versionId}`, data),
  restoreVersion: (id: string, versionId: string) => api.post<Post>(`/posts/${id}/versions/${versionId}/restore`),
  aiAssist: (id: string, data: { action: string; content?: string; context?: string; option?: string }) =>
    api.post<AiAssistResponse>(`/posts/${id}/ai-assist`, data),
  aiCheckpoint: (id: string) => api.post(`/posts/${id}/ai-checkpoint`),
};

/** Pulls a human-readable message out of an axios error (the backend always returns {message}). */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as AxiosError<ApiError>;
  if (e?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  if (e && !e.response && e.message === 'Network Error') return "Can't reach the server. Check your connection.";
  return e?.response?.data?.message || fallback;
}

export const authApi = {
  me: () => api.get<UserResponse>('/auth/me'),
};

export const credentialsApi = {
  getAll: () => api.get<CredentialStatusResponse[]>('/credentials'),
  save: (platform: string, data: SaveCredentialRequest) =>
    api.post<CredentialStatusResponse>(`/credentials/${platform}`, data),
  delete: (platform: string) => api.delete(`/credentials/${platform}`),
};

export default api;