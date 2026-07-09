import { AuthenticationProvider } from './AuthenticationProvider';
import { SNAService } from '../services/SNAService';
import { AuthResult, AuthenticationMethod, User } from '../types/auth';
import { logger } from '../utils/logger';
import { Platform } from 'react-native';

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

      logger.info('SNA Challenge URL received, normalizing and triggering native cellular request', { url: requestResult.challengeUrl });

      if (Platform.OS === 'android') {
        try {
          const { triggerCellularGet } = require('../../modules/cellular-request');
          
          let targetUrl = requestResult.challengeUrl || '';
          if (targetUrl.includes('sna/api/auth/check/')) {
            targetUrl = targetUrl.replace('sna/api/auth/check/', 'verify/v1/sna/auth/check/');
          }
          
          logger.info('Routing challenge URL via cellular GET request', { targetUrl });
          const cellularResult = await triggerCellularGet(targetUrl);
          logger.info('Cellular network request completed', { status: cellularResult.status });

          if (cellularResult.status >= 200 && cellularResult.status < 300) {
            let pinCode = '';
            let refCode = '';
            try {
              const parsedBody = JSON.parse(cellularResult.body);
              pinCode = parsedBody.pin_code;
              refCode = parsedBody.ref_code;
            } catch (jsonErr) {
              logger.error('Failed to parse cellular response body as JSON', jsonErr);
              throw new Error('SNA verification payload is invalid or unreadable.');
            }

            if (!pinCode || !refCode) {
              throw new Error('Cellular response did not contain verification parameters.');
            }

            // 2. Verification using extracted pin and ref
            const verifyResult = await this.snaService.verifyLogin({ pinCode, refCode });

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
          } else {
            throw new Error(`Carrier check failed with HTTP status ${cellularResult.status}`);
          }
        } catch (e) {
          logger.error('Failed to route SNA challenge via native cellular module', e);
          return {
            success: false,
            method: this.getType(),
            message: e instanceof Error ? e.message : 'Cellular carrier routing failed',
          };
        }
      } else {
        // Fallback for non-Android environments (simulators / iOS demo)
        logger.warn('SNA cellular request skipped (non-Android platform)');
        
        // Mock fallback verification
        const verifyResult = await this.snaService.verifyLogin({ pinCode: 'mock', refCode: 'mock' });
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
      }
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
