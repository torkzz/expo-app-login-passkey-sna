import { apiClient } from './axios';
import { API } from '../config/api';
import { logger } from '../utils/logger';
import { TokenRequest, TokenResponse } from '../types/auth';

/**
 * Authentication API module.
 *
 * Handles raw HTTP communication for authentication.
 */
export const AuthApi = {
  /**
   * Obtain OAuth2 token using client credentials.
   */
  getToken: async (request: TokenRequest): Promise<TokenResponse> => {
    logger.info('AuthApi: POST ' + API.AUTH.TOKEN);
    // Form data encoding for OAuth2 if needed, but assuming JSON based on requirements
    const response = await apiClient.post<TokenResponse>(API.AUTH.TOKEN, request);
    return response.data;
  },
};
