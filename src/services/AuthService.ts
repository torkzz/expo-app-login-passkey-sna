import { AuthApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { ENV } from '../config/env';
import { TokenRequest } from '../types/auth';
import { tokenManager } from './TokenManager';
import { logger } from '../utils/logger';

/**
 * AuthService Singleton
 *
 * Orchestrates authentication flows and manages token lifecycle.
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Obtain an OAuth2 token and establish a session.
   */
  public async login(): Promise<void> {
    logger.info('AuthService: Starting login');
    const request: TokenRequest = {
      grant_type: 'client_credentials',
      client_id: ENV.VERIFY_CLIENT_ID,
      client_secret: ENV.VERIFY_CLIENT_SECRET,
    };

    logger.info('AuthService: Requesting token from AuthApi');
    const response = await AuthApi.getToken(request);
    logger.info('AuthService: Token received successfully');

    const expiresAt = Date.now() + response.expires_in * 1000;

    // Update TokenManager
    await tokenManager.set(
      response.access_token,
      expiresAt,
      response.refresh_token
    );

    // Update Store
    useAuthStore.getState().setSession({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
      authenticated: true,
    });
  }

  /**
   * Terminate the current session.
   */
  public async logout(): Promise<void> {
    await tokenManager.clear();
    useAuthStore.getState().clearSession();
  }

  /**
   * Get the current access token.
   */
  public getAccessToken(): string {
    return tokenManager.getAccessToken() || '';
  }
}

export const authService = AuthService.getInstance();
