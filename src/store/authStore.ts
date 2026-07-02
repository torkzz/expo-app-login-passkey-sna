import { create } from 'zustand';
import { AuthState, User, AuthMethod } from '../types';

interface AuthStore extends AuthState {
  setAuthenticated: (authenticated: boolean) => void;
  setAuthMethod: (method: AuthMethod | null) => void;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  authenticated: false,
  authenticationMethod: null,
  user: null,
  accessToken: null,
  loading: false,
  error: null,

  setAuthenticated: (authenticated) => set({ authenticated }),
  setAuthMethod: (authenticationMethod) => set({ authenticationMethod }),
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  logout: () => set({
    authenticated: false,
    authenticationMethod: null,
    user: null,
    accessToken: null
  }),
}));
