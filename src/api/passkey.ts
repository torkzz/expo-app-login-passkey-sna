import { apiClient } from './axios';
import { API } from '../config/api';
import { logger } from '../utils/logger';
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
 * Passkey API module.
 *
 * Handles raw HTTP communication for Passkey/WebAuthn operations.
 */
export const PasskeyApi = {
  /**
   * Generate a new Passkey registration challenge.
   */
  generateKey: async (
    request: GenerateKeyRequest
  ): Promise<GenerateKeyResponse> => {
    try {
      console.log('========== GENERATE KEY ==========');
      console.log('URL:', API.PASSKEY.GENERATE_KEY);
      console.log('BODY:');
      console.log(JSON.stringify(request, null, 2));
      console.log('==================================');

      const response = await apiClient.post<GenerateKeyResponse>(
        API.PASSKEY.GENERATE_KEY,
        request,
      );

      console.log('========== RESPONSE ==========');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('==============================');

      return response.data;
    } catch (error: any) {
      console.log('========== GENERATE KEY ERROR ==========');

      if (error.response) {
        console.log('STATUS:', error.response.status);
        console.log('DATA:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }

      console.log('MESSAGE:', error.message);
      console.log('========================================');

      throw error;
    }
  },
  /**
   * Register a new Passkey credential.
   */
  registerKey: async (request: RegisterKeyRequest): Promise<RegisterKeyResponse> => {
    logger.info('PasskeyApi: POST ' + API.PASSKEY.REGISTER);
    const response = await apiClient.post<RegisterKeyResponse>(API.PASSKEY.REGISTER, request);
    return response.data;
  },

  /**
   * Request a Passkey login challenge.
   */
  loginRequest: async (request: LoginRequest): Promise<LoginRequestResponse> => {
    const response = await apiClient.post<LoginRequestResponse>(API.PASSKEY.LOGIN_REQUEST, request);
    return response.data;
  },

  /**
   * Verify a Passkey login assertion.
   */
  loginVerify: async (request: LoginVerifyRequest): Promise<LoginVerifyResponse> => {
    const response = await apiClient.post<LoginVerifyResponse>(API.PASSKEY.LOGIN_VERIFY, request);
    return response.data;
  },
};
