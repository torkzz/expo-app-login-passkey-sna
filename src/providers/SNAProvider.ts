import { AuthenticationProvider } from './AuthenticationProvider';
import { SNAService } from '../services/SNAService';
import { AuthResult, AuthenticationMethod, User } from '../types/auth';
import { logger } from '../utils/logger';

/**
 * SNAProvider
 *
 * Implements AuthenticationProvider for Silent Network Authentication.
 * Delegates to SNAService for flow orchestration.
 */
export class SNAProvider implements AuthenticationProvider {
  private readonly snaService: SNAService;

  constructor(snaService: SNAService) {
    this.snaService = snaService;
  }

  public async login(params: { phoneNumber: string }): Promise<AuthResult> {
    logger.info('Starting SNA login flow', { phoneNumber: params.phoneNumber });

    try {
      // 1. Request SNA Login
      const requestResult = await this.snaService.requestLogin(params.phoneNumber);

      if (!requestResult.success || !requestResult.challengeUrl) {
        return {
          success: false,
          method: this.getType(),
          message: requestResult.message || 'SNA request failed',
        };
      }

      // TODO: Implement UI/Native logic to trigger the challengeUrl
      // (usually by opening the URL in a hidden web view or performing a network request on cellular data)
      logger.info('SNA Challenge URL received', { url: requestResult.challengeUrl });

      // 2. Verification
      // In a real flow, we would wait for the challenge to be completed before verifying.
      const verifyResult = await this.snaService.verifyLogin(requestResult.referenceId || '');

      const mockUser: User = {
        id: params.phoneNumber,
        mobileNumber: params.phoneNumber,
      };

      return {
        success: verifyResult.success,
        method: this.getType(),
        user: verifyResult.success ? mockUser : undefined,
        message: verifyResult.message,
      };
    } catch (error) {
      logger.error('SNA login failed', error);
      return {
        success: false,
        method: this.getType(),
        message: error instanceof Error ? error.message : 'Unknown SNA error',
      };
    }
  }

  public async register(params: { phoneNumber: string; username: string }): Promise<AuthResult> {
    logger.info('SNA registration flow started (SNA typically uses login for first-time verification)', params);
    return this.login({ phoneNumber: params.phoneNumber });
  }

  public async logout(): Promise<void> {
    logger.info('SNA provider logout');
  }

  public async isAvailable(): Promise<boolean> {
    // TODO: Implement check for Cellular data connectivity
    return true;
  }

  public getType(): AuthenticationMethod {
    return 'sna';
  }
}
