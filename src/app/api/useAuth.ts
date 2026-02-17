// ─── React hooks for authentication ─────────────────────────
// Wraps the auth API in hooks with state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setAuthToken, getAuthToken, type ApiUser } from './client';

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        const res = await authApi.login(email, password);
        if (res.ok && res.data) {
          setAuthToken(res.data.token);
          set({
            user: res.data.user,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
        set({ error: res.error || 'Login failed', isLoading: false });
        return false;
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        const res = await authApi.register(email, password, displayName);
        if (res.ok && res.data) {
          setAuthToken(res.data.token);
          set({
            user: res.data.user,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
        set({ error: res.error || 'Registration failed', isLoading: false });
        return false;
      },

      logout: async () => {
        await authApi.logout();
        setAuthToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkSession: async () => {
        const token = getAuthToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        setAuthToken(token);
        set({ isLoading: true });
        const res = await authApi.me();
        if (res.ok && res.data) {
          set({ user: res.data, isAuthenticated: true, isLoading: false });
        } else {
          setAuthToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false, token: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'dataos-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Listen for auth expiry events from the API client
if (typeof window !== 'undefined') {
  window.addEventListener('auth:expired', () => {
    useAuthStore.getState().logout();
  });
}
