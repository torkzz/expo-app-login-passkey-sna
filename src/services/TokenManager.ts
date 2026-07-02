import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
};

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * TokenManager Singleton
 *
 * Single source of truth for token lifecycle and persistence.
 * Encapsulates Secure Store interactions.
 */
export class TokenManager {
  private static instance: TokenManager;
  private currentTokens: TokenData | null = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Persist tokens to Secure Store and update memory state.
   */
  public async set(accessToken: string, expiresAt: number, refreshToken?: string): Promise<void> {
    this.currentTokens = { accessToken, expiresAt, refreshToken };

    try {
      await Promise.all([
        SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(SECURE_STORE_KEYS.EXPIRES_AT, expiresAt.toString()),
      ]);

      if (refreshToken) {
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, refreshToken);
      } else {
        await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      }
    } catch (error) {
      logger.error('Failed to persist tokens to Secure Store', error);
    }
  }

  /**
   * Restore tokens from Secure Store.
   */
  public async restore(): Promise<TokenData | null> {
    try {
      const [accessToken, expiresAtStr, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
      ]);

      if (accessToken && expiresAtStr) {
        this.currentTokens = {
          accessToken,
          expiresAt: parseInt(expiresAtStr, 10),
          refreshToken: refreshToken || undefined,
        };
        return this.currentTokens;
      }
    } catch (error) {
      logger.error('Failed to restore tokens from Secure Store', error);
    }

    this.currentTokens = null;
    return null;
  }

  /**
   * Clear tokens from Secure Store and memory.
   */
  public async clear(): Promise<void> {
    this.currentTokens = null;
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
      ]);
    } catch (error) {
      logger.error('Failed to clear tokens from Secure Store', error);
    }
  }

  public getAccessToken(): string | undefined {
    return this.currentTokens?.accessToken;
  }

  public getExpiration(): number {
    return this.currentTokens?.expiresAt || 0;
  }

  /**
   * Check if the current token is expired.
   */
  public isExpired(): boolean {
    const expiresAt = this.getExpiration();
    if (expiresAt === 0) return true;

    // Add a 30-second buffer
    return Date.now() > expiresAt - 30000;
  }

  /**
   * Check if there is a valid (non-expired) token available.
   */
  public hasValidToken(): boolean {
    return !!this.getAccessToken() && !this.isExpired();
  }
}

export const tokenManager = TokenManager.getInstance();
