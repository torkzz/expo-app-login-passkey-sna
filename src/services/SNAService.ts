import { SNAApi } from '../api/sna';
import {
  SNALoginRequest,
  SNAVerifyRequest,
  SNAResult
} from '../types/sna';

/**
 * SNAService Singleton
 *
 * Orchestrates Silent Network Authentication flows and normalizes responses.
 */
export class SNAService {
  private static instance: SNAService;

  private constructor() {}

  public static getInstance(): SNAService {
    if (!SNAService.instance) {
      SNAService.instance = new SNAService();
    }
    return SNAService.instance;
  }

  /**
   * Initiate an SNA login request.
   */
  public async requestLogin(phoneNumber: string): Promise<SNAResult> {
    const request: SNALoginRequest = { phoneNumber };
    const response = await SNAApi.loginRequest(request);

    return {
      success: response.success,
      challengeUrl: response.checkUrl,
      referenceId: response.referenceId,
      message: response.message,
      raw: response,
    };
  }

  /**
   * Verify the status of an SNA authentication.
   */
  public async verifyLogin(referenceId: string): Promise<SNAResult> {
    const request: SNAVerifyRequest = { referenceId };
    const response = await SNAApi.loginVerify(request);

    return {
      success: response.success && response.status === 'COMPLETED',
      referenceId,
      status: response.status,
      message: response.message,
      raw: response,
    };
  }
}

export const snaService = SNAService.getInstance();
