import { AuthenticationProvider } from './AuthenticationProvider';
import { PasskeyService } from '../services/PasskeyService';
import { AuthResult, AuthenticationMethod } from '../types/auth';
import { logger } from '../utils/logger';
import { demoPasskeyStore } from '../services/DemoPasskeyStore';

/**
 * PasskeyProvider
 *
 * Implements AuthenticationProvider for Passkey/WebAuthn.
 * Delegates to PasskeyService for HTTP communication.
 */
export class PasskeyProvider implements AuthenticationProvider {
  private readonly passkeyService: PasskeyService;

  constructor(passkeyService: PasskeyService) {
    this.passkeyService = passkeyService;
  }

  public async login(params: { userId: string }): Promise<AuthResult> {
    logger.info('PasskeyProvider: Starting login flow', { userId: params.userId });

    try {
      // 1. Check for Demo Passkey (DEMO ONLY)
      const hasDemoPasskey = await demoPasskeyStore.hasDemoPasskey();
      if (!hasDemoPasskey) {
        logger.warn('[DEMO ONLY] No demo registration found for login');
        return {
          success: false,
          code: 'PASSKEY_NOT_REGISTERED',
          method: this.getType(),
          message: 'No demo Passkey registration found. Please register first.',
        };
      }

      // 2. Request Login Challenge
      logger.info('PasskeyProvider: Requesting login challenge');
      const challengeResponse = await this.passkeyService.requestLoginChallenge({
        userId: params.userId,
      });
      logger.info('PasskeyProvider: Login challenge received', {
        rpId: challengeResponse.rpId,
        timeout: challengeResponse.timeout,
        userId: params.userId,
      });

      // 3. STOP: Native Passkey Assertion is required
      logger.info('PasskeyProvider: Native Passkey unavailable (Expo Go). Returning challenge to caller.');

      return {
        success: false,
        code: 'PASSKEY_NATIVE_REQUIRED',
        method: this.getType(),
        challenge: challengeResponse,
        message:
          'Native Passkey authentication requires an Expo Development Build. Backend challenge generation completed successfully.',
      };
    } catch (error) {
      logger.error('Passkey login failed', error);
      return {
        success: false,
        method: this.getType(),
        message: error instanceof Error ? error.message : 'Unknown Passkey error',
      };
    }
  }

  public async register(params: { username: string; mobileNumber: string }): Promise<AuthResult> {
    logger.info('PasskeyProvider: Starting registration flow', {
      username: params.username,
      mobileNumber: params.mobileNumber,
    });

    try {
      // 1. Generate Registration Challenge
      logger.info('PasskeyProvider: Requesting registration challenge');
      const challengeResponse = await this.passkeyService.generateRegistrationChallenge({
        userId: params.mobileNumber,
        userName: params.username,
      });
      logger.info('PasskeyProvider: Registration challenge received', {
        rpName: challengeResponse.rp.name,
        rpId: challengeResponse.rp.id,
        userId: challengeResponse.user.id,
        userName: challengeResponse.user.name,
      });

      // 2. Save Demo Passkey (DEMO ONLY)
      logger.info('[DEMO ONLY] PasskeyProvider: Saving demo registration metadata');
      await demoPasskeyStore.saveDemoPasskey({
        username: params.username,
        mobileNumber: params.mobileNumber,
        challenge: challengeResponse,
        createdAt: Date.now(),
        registered: true,
      });

      // 3. STOP: Native Passkey Registration is required
      logger.info('PasskeyProvider: Native Passkey unavailable (Expo Go). Returning challenge to caller.');

      return {
        success: false,
        code: 'PASSKEY_NATIVE_REQUIRED',
        method: this.getType(),
        challenge: challengeResponse,
        message:
          'Native Passkey registration requires an Expo Development Build. Backend challenge generation completed successfully.',
      };
    } catch (error) {
      logger.error('PasskeyProvider: Registration failed', error);
      return {
        success: false,
        method: this.getType(),
        message: error instanceof Error ? error.message : 'Passkey registration failed',
      };
    }
  }

  public async logout(): Promise<void> {
    logger.info('Passkey provider logout');
    // No specific local cleanup needed for Passkeys usually
  }

  public async isAvailable(): Promise<boolean> {
    // TODO: Implement native check for Passkey availability (e.g. Platform.OS and biometrics check)
    return true;
  }

  public getType(): AuthenticationMethod {
    return 'passkey';
  }
}
