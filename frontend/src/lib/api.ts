import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  Post,
  PostCreateRequest,
  PostAutosaveRequest,
  PublishRequest,
  PreviewResponse,
  ApiError,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for auth if needed
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
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

export default api;