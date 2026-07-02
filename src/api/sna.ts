import { apiClient } from './axios';
import { API } from '../config/api';
import {
  SNALoginRequest,
  SNALoginResponse,
  SNAVerifyRequest,
  SNAVerifyResponse
} from '../types/sna';

/**
 * SNA API module.
 *
 * Handles raw HTTP communication for Silent Network Authentication.
 */
export const SNAApi = {
  /**
   * Request an SNA login challenge.
   */
  loginRequest: async (request: SNALoginRequest): Promise<SNALoginResponse> => {
    const response = await apiClient.post<SNALoginResponse>(API.SNA.LOGIN_REQUEST, request);
    return response.data;
  },

  /**
   * Verify an SNA login.
   */
  loginVerify: async (request: SNAVerifyRequest): Promise<SNAVerifyResponse> => {
    const response = await apiClient.post<SNAVerifyResponse>(API.SNA.LOGIN_VERIFY, request);
    return response.data;
  },
};
