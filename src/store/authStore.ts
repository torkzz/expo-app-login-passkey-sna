import { create } from 'zustand';
import { AuthSession, User } from '../types/auth';

interface AuthState extends AuthSession {
  setSession: (session: Partial<AuthSession>) => void;
  setUser: (user: User | undefined) => void;
  clearSession: () => void;
}

const initialState: AuthSession = {
  accessToken: '',
  refreshToken: undefined,
  expiresAt: 0,
  authenticated: false,
  user: undefined,
};

/**
 * Authentication Store (Zustand)
 *
 * Pure state container for authentication data.
 * Business logic and persistence are handled by AuthenticationManager and TokenManager.
 */
export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setSession: (session: Partial<AuthSession>) => {
    set((state) => ({ ...state, ...session }));
  },

  setUser: (user: User | undefined) => {
    set({ user });
  },

  clearSession: () => {
    set(initialState);
  },
}));
