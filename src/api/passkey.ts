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
  generateKey: async (request: GenerateKeyRequest): Promise<GenerateKeyResponse> => {
    logger.info('PasskeyApi: POST ' + API.PASSKEY.GENERATE_KEY);
    const response = await apiClient.post<GenerateKeyResponse>(API.PASSKEY.GENERATE_KEY, request);
    return response.data;
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
