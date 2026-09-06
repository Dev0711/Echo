import type { UserResponse } from '@/types';

const TOKEN_KEY = 'echo_jwt';

export const auth = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    const token = auth.getToken();
    if (!token) return false;
    try {
      // Decode JWT payload (no verification — backend verifies on every request)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getUser: (): { id: string; email: string; name: string } | null => {
    const token = auth.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  },

  loginWithGoogle: () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  },

  logout: () => {
    auth.clearToken();
    window.location.href = '/login';
  },
};
