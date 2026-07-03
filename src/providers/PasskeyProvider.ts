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
    logger.info('[REGISTER] ===== START =====');
    logger.info('[REGISTER] Params', {
      username: params.username,
      mobileNumber: params.mobileNumber,
    });

    try {
      // STEP 1
      logger.info('[REGISTER][STEP 1] Requesting registration challenge...');

      const challengeResponse = await this.passkeyService.generateRegistrationChallenge({
        userId: params.mobileNumber,
        userName: params.username,
      });

      logger.info('[REGISTER][STEP 2] Registration challenge received');

      logger.info('[REGISTER][STEP 2] Challenge Metadata', {
        rpName: challengeResponse.rp?.name,
        rpId: challengeResponse.rp?.id,
        userId: challengeResponse.user?.id,
        userName: challengeResponse.user?.name,
      });

      logger.info('[REGISTER][STEP 2] Full Challenge');
      console.log(JSON.stringify(challengeResponse, null, 2));

      // STEP 3
      logger.info('[REGISTER][STEP 3] Saving DemoPasskey...');

      await demoPasskeyStore.saveDemoPasskey({
        username: params.username,
        mobileNumber: params.mobileNumber,
        challenge: challengeResponse,
        createdAt: Date.now(),
        registered: true,
      });

      logger.info('[REGISTER][STEP 4] DemoPasskey saved successfully');

      logger.info('[REGISTER][STEP 5] Returning PASSKEY_NATIVE_REQUIRED');

      return {
        success: false,
        code: 'PASSKEY_NATIVE_REQUIRED',
        method: this.getType(),
        challenge: challengeResponse,
        message:
          'Native Passkey registration requires an Expo Development Build. Backend challenge generation completed successfully.',
      };
    } catch (error: any) {
      logger.error('[REGISTER] FAILED');
      logger.error(error);

      console.log('================ ERROR ================');
      console.log(error);

      if (error?.response) {
        console.log('HTTP STATUS:', error.response.status);
        console.log('HTTP DATA:', JSON.stringify(error.response.data, null, 2));
      }

      if (error?.message) {
        console.log('MESSAGE:', error.message);
      }

      if (error?.stack) {
        console.log('STACK:', error.stack);
      }

      console.log('=======================================');

      return {
        success: false,
        code: 'REGISTER_EXCEPTION',
        method: this.getType(),
        message:
          error?.message ??
          'Unknown registration exception',
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
