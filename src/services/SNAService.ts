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
    const request: SNALoginRequest = {
      to: phoneNumber,
      from: 'M360', // Default registered sender ID
    };
    const response = await SNAApi.loginRequest(request);

    return {
      success: response.success || response.code === 2001,
      challengeUrl: response.check_url,
      referenceId: response.transid,
      message: response.message,
      raw: response,
    };
  }

  /**
   * Verify the status of an SNA authentication.
   */
  public async verifyLogin(params: { pinCode: string; refCode: string }): Promise<SNAResult> {
    const request: SNAVerifyRequest = {
      pin_code: params.pinCode,
      ref_code: params.refCode,
    };
    const response = await SNAApi.loginVerify(request);

    return {
      // code 2011 is PIN_VERIFIED
      success: response.success || response.code === 2011 || response.status === 'pin_verified',
      status: response.status,
      message: response.message,
      raw: response,
    };
  }
}

export const snaService = SNAService.getInstance();
