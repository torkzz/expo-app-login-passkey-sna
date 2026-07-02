import { AuthApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { ENV } from '../config/env';
import { TokenRequest } from '../types/auth';

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
    const request: TokenRequest = {
      grant_type: 'client_credentials',
      client_id: ENV.VERIFY_CLIENT_ID,
      client_secret: ENV.VERIFY_CLIENT_SECRET,
    };

    const response = await AuthApi.getToken(request);

    const expiresAt = Date.now() + response.expires_in * 1000;

    await useAuthStore.getState().setSession({
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
    await useAuthStore.getState().clearSession();
  }

  /**
   * Restore the session from persistence.
   */
  public async restoreSession(): Promise<void> {
    await useAuthStore.getState().restoreSession();
  }

  /**
   * Check if the user is currently authenticated with a valid token.
   */
  public isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated();
  }

  /**
   * Get the current access token.
   */
  public getAccessToken(): string {
    return useAuthStore.getState().accessToken;
  }
}

export const authService = AuthService.getInstance();
