import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthSession } from '../types/auth';
import { logger } from '../utils/logger';

interface AuthState extends AuthSession {
  setSession: (session: Partial<AuthSession>) => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  isAuthenticated: () => boolean;
  hasValidToken: () => boolean;
}

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
};

const initialState: AuthSession = {
  accessToken: '',
  refreshToken: undefined,
  expiresAt: 0,
  authenticated: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  setSession: async (session: Partial<AuthSession>) => {
    const newState = { ...get(), ...session };

    // Update memory state
    set(newState);

    // Persist to Secure Store
    if (session.accessToken !== undefined) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, session.accessToken);
    }
    if (session.refreshToken !== undefined) {
      if (session.refreshToken) {
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, session.refreshToken);
      } else {
        await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      }
    }
    if (session.expiresAt !== undefined) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.EXPIRES_AT, session.expiresAt.toString());
    }
  },

  clearSession: async () => {
    set(initialState);
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
    ]);
  },

  restoreSession: async () => {
    try {
      const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
      ]);

      if (accessToken) {
        const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
        const authenticated = !!accessToken && (expiresAt === 0 || expiresAt > Date.now());

        set({
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresAt,
          authenticated,
        });
      }
    } catch (error) {
      logger.error('Failed to restore session:', error);
      await get().clearSession();
    }
  },

  isAuthenticated: () => {
    const { authenticated, accessToken, expiresAt } = get();
    return authenticated && !!accessToken && (expiresAt === 0 || expiresAt > Date.now());
  },

  hasValidToken: () => {
    const { accessToken, expiresAt } = get();
    return !!accessToken && (expiresAt === 0 || expiresAt > Date.now());
  },
}));
