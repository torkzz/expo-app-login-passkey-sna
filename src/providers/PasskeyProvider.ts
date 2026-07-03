import { AuthenticationProvider } from './AuthenticationProvider';
import { PasskeyService } from '../services/PasskeyService';
import { AuthResult, AuthenticationMethod, User } from '../types/auth';
import { logger } from '../utils/logger';

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
    logger.info('Starting Passkey login flow', { userId: params.userId });

    try {
      // 1. Request Login Challenge
      const challengeResponse = await this.passkeyService.requestLoginChallenge({
        userId: params.userId,
      });

      // TODO: Implement Native Passkey Assertion
      // This step requires expo-passkeys or react-native-passkeys.
      // For now, we are focusing on the orchestration and API layer.
      logger.warn('Native Passkey Assertion is not yet implemented. Use Expo Go compatible mock if necessary.');

      // Mocking a successful verification for flow demonstration
      // (In reality, we would call passkeyService.verifyLogin with the native assertion)

      const mockUser: User = {
        id: params.userId,
        username: 'demo_user',
      };

      return {
        success: true,
        method: this.getType(),
        user: mockUser,
        message: 'Passkey authentication initiated (Verification pending native implementation)',
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
    logger.info('PasskeyProvider: Starting registration flow', params);

    try {
      // 1. Generate Registration Challenge
      logger.info('PasskeyProvider: Requesting registration challenge');
      const challengeResponse = await this.passkeyService.generateRegistrationChallenge({
        userId: params.mobileNumber,
        userName: params.username,
      });
      logger.info('PasskeyProvider: Registration challenge received');

      // 2. Invoke Native Passkey Registration
      logger.info('PasskeyProvider: Invoking native Passkey API');
      // TODO: Implement Native Passkey Registration
      logger.warn('PasskeyProvider: Native Passkey Registration is not yet implemented.');

      // 3. Verify Registration with Backend
      logger.info('PasskeyProvider: Verifying registration with backend');
      // Mocking successful verification for flow demonstration
      // const registerResponse = await this.passkeyService.registerPasskey({ ...nativeAttestation });
      logger.info('PasskeyProvider: Passkey registration verified (mock)');

      const mockUser: User = {
        id: params.mobileNumber,
        username: params.username,
        mobileNumber: params.mobileNumber,
      };

      return {
        success: true,
        method: this.getType(),
        user: mockUser,
        message: 'Registration successful',
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
