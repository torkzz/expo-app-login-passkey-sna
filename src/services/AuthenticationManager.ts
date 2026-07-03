import { PasskeyProvider } from '../providers/PasskeyProvider';
import { SNAProvider } from '../providers/SNAProvider';
import { AuthService } from './AuthService';
import { PasskeyService } from './PasskeyService';
import { SNAService } from './SNAService';
import { tokenManager } from './TokenManager';
import { useAuthStore } from '../store/authStore';
import { AuthResult, User } from '../types/auth';
import { logger } from '../utils/logger';

/**
 * AuthenticationManager Singleton
 *
 * Single public entry point for all authentication operations.
 * Orchestrates between AuthenticationProviders and AuthService.
 */
export class AuthenticationManager {
  private static instance: AuthenticationManager;

  private readonly authService: AuthService;
  private readonly passkeyProvider: PasskeyProvider;
  private readonly snaProvider: SNAProvider;

  private constructor() {
    this.authService = AuthService.getInstance();
    this.passkeyProvider = new PasskeyProvider(PasskeyService.getInstance());
    this.snaProvider = new SNAProvider(SNAService.getInstance());
  }

  public static getInstance(): AuthenticationManager {
    if (!AuthenticationManager.instance) {
      AuthenticationManager.instance = new AuthenticationManager();
    }
    return AuthenticationManager.instance;
  }

  /**
   * Initialize the authentication state on application start.
   */
  public async initialize(): Promise<void> {
    logger.info('AuthenticationManager: Starting initialization');

    try {
      const tokens = await tokenManager.restore();
      logger.info('AuthenticationManager: Token restoration complete');

      if (tokens && !tokenManager.isExpired()) {
        logger.info('AuthenticationManager: Valid session found, restoring...');
        useAuthStore.getState().setSession({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          authenticated: true,
        });
        logger.info('AuthenticationManager: Session restored successfully');
      } else {
        logger.info('AuthenticationManager: No valid session found during initialization');
        // Clear everything to be safe, but don't perform network logout
        useAuthStore.getState().clearSession();
      }
    } catch (error) {
      logger.error('AuthenticationManager: Initialization failed', error);
      useAuthStore.getState().clearSession();
    } finally {
      logger.info('AuthenticationManager: Initialization complete');
    }
  }

  /**
   * Login using Passkey.
   */
  public async loginWithPasskey(userId: string): Promise<AuthResult> {
    return this.orchestrateLogin(() => this.passkeyProvider.login({ userId }));
  }

  /**
   * Login using Silent Network Authentication.
   */
  public async loginWithSNA(phoneNumber: string): Promise<AuthResult> {
    return this.orchestrateLogin(() => this.snaProvider.login({ phoneNumber }));
  }

  /**
   * Register a new Passkey.
   */
  public async registerWithPasskey(username: string, mobileNumber: string): Promise<AuthResult> {
    logger.info('AuthenticationManager: Starting registerWithPasskey', { username, mobileNumber });
    try {
      console.log("A");
      // 1. Ensure valid OAuth token
      if (!tokenManager.hasValidToken()) {
         console.log("B");
        logger.info('AuthenticationManager: No valid OAuth token, performing client credentials login');
        await this.authService.login();
           console.log("C");
        logger.info('AuthenticationManager: OAuth login successful');
      } else {
        logger.info('AuthenticationManager: Using existing valid OAuth token');
      }

      // 2. Delegate to PasskeyProvider for registration flow
      logger.info('AuthenticationManager: Delegating to PasskeyProvider.register');
      const result = await this.passkeyProvider.register({ username, mobileNumber });

      if (result.success && result.user) {
        logger.info('AuthenticationManager: Passkey registration successful');
        useAuthStore.getState().setUser(result.user);
        useAuthStore.getState().setSession({ authenticated: true });
      } else {
        logger.warn('AuthenticationManager: Passkey registration failed', result.message);
      }

      return result;
    } catch (error: any) {
      logger.error('AuthenticationManager: registerWithPasskey failed', error);

      const errorMessage = error?.message || error?.code || 'Registration failed';

      return {
        success: false,
        method: 'passkey',
        message: errorMessage,
      };
    }
  }

  /**
   * Common orchestration logic for all authentication methods.
   */
  private async orchestrateLogin(providerLogin: () => Promise<AuthResult>): Promise<AuthResult> {
    try {
      // 1. Ensure valid OAuth token
      if (!tokenManager.hasValidToken()) {
        logger.info('No valid OAuth token, performing client credentials login');
        await this.authService.login();
      }

      // 2. Perform provider-specific login
      const result = await providerLogin();

      if (result.success && result.user) {
        logger.info(`Login successful with method: ${result.method}`);
        useAuthStore.getState().setUser(result.user);
        // Note: authenticated status is already true if we have a valid OAuth token,
        // but we can refine this state if 'authenticated' should mean 'user-authenticated'
        useAuthStore.getState().setSession({ authenticated: true });
      }

      return result;
    } catch (error) {
      logger.error('Login orchestration failed', error);
      return {
        success: false,
        method: 'passkey', // Default or dynamic
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout from the application.
   */
  public async logout(): Promise<void> {
    logger.info('Performing application logout');
    await this.authService.logout();
    await this.passkeyProvider.logout();
    await this.snaProvider.logout();
  }

  /**
   * Restore the session from persistence.
   */
  public async restoreSession(): Promise<void> {
    await this.initialize();
  }

  /**
   * Get the current authenticated user.
   */
  public getCurrentUser(): User | undefined {
    return useAuthStore.getState().user;
  }

  /**
   * Check if the user is currently authenticated.
   */
  public isAuthenticated(): boolean {
    return useAuthStore.getState().authenticated && tokenManager.hasValidToken();
  }
}

export const authenticationManager = AuthenticationManager.getInstance();
