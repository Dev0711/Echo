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
} from '@/types';
import { auth } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

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
};

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