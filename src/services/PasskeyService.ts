import { PasskeyApi } from '../api/passkey';
import {
  GenerateKeyRequest,
  GenerateKeyResponse,
  RegisterKeyRequest,
  RegisterKeyResponse,
  LoginRequest,
  LoginRequestResponse,
  LoginVerifyRequest,
  LoginVerifyResponse
} from '../types/passkey';

/**
 * PasskeyService Singleton
 *
 * Orchestrates Passkey-related business flows.
 */
export class PasskeyService {
  private static instance: PasskeyService;

  private constructor() {}

  public static getInstance(): PasskeyService {
    if (!PasskeyService.instance) {
      PasskeyService.instance = new PasskeyService();
    }
    return PasskeyService.instance;
  }

  /**
   * Request a challenge for Passkey registration.
   */
  public async generateRegistrationChallenge(request: GenerateKeyRequest): Promise<GenerateKeyResponse> {
    return await PasskeyApi.generateKey(request);
  }

  /**
   * Complete Passkey registration with the signed challenge.
   */
  public async registerKey(
      request: RegisterKeyRequest
  ): Promise<RegisterKeyResponse> {
      return PasskeyApi.registerKey(request);
  }

  /**
   * Request a challenge for Passkey login.
   */
  public async requestLoginChallenge(request: LoginRequest): Promise<LoginRequestResponse> {
    return await PasskeyApi.loginRequest(request);
  }

  /**
   * Verify a Passkey login assertion.
   */
  public async verifyLogin(request: LoginVerifyRequest): Promise<LoginVerifyResponse> {
    return await PasskeyApi.loginVerify(request);
  }
}

export const passkeyService = PasskeyService.getInstance();
