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
    logger.info('Initializing AuthenticationManager');

    const tokens = await tokenManager.restore();

    if (tokens && !tokenManager.isExpired()) {
      logger.info('Session restored successfully');
      useAuthStore.getState().setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        authenticated: true,
      });
      // TODO: Optionally fetch current user profile from backend
    } else {
      logger.info('No valid session found during initialization');
      await this.logout();
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
    try {
      // 1. Ensure valid OAuth token
      if (!tokenManager.hasValidToken()) {
        logger.info('No valid OAuth token, performing client credentials login');
        await this.authService.login();
      }

      // 2. Generate Registration Challenge
      const passkeyService = PasskeyService.getInstance();
      const challengeResponse = await passkeyService.generateRegistrationChallenge({
        userId: mobileNumber,
        userName: username,
      });

      // TODO: Implement Native Passkey Registration
      // This would call the native credential creation API.
      logger.warn('Native Passkey Registration is not yet implemented.');

      // Mocking successful registration for flow demonstration
      const mockUser: User = {
        id: mobileNumber,
        username,
        mobileNumber,
      };

      // 3. (In real flow) Verify registration with backend
      // await passkeyService.registerPasskey({ ...nativeAttestation });

      logger.info('Passkey registration successful (mock)');

      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setSession({ authenticated: true });

      return {
        success: true,
        method: 'passkey',
        user: mockUser,
        message: 'Registration successful',
      };
    } catch (error) {
      logger.error('Passkey registration failed', error);
      return {
        success: false,
        method: 'passkey',
        message: error instanceof Error ? error.message : 'Registration failed',
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
