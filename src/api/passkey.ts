import apiClient from './axios';
import {
  PasskeyGenerateResponse,
  PasskeyLoginRequestResponse
} from '../types';

export const PasskeyAPI = {
  generateKey: async (email: string): Promise<PasskeyGenerateResponse> => {
    const response = await apiClient.post('/passkey/api/generate/key', { email });
    return response.data;
  },

  register: async (email: string, attestation: any): Promise<any> => {
    const response = await apiClient.post('/passkey/api/register/key', { email, attestation });
    return response.data;
  },

  loginRequest: async (): Promise<PasskeyLoginRequestResponse> => {
    const response = await apiClient.post('/passkey/api/login/request');
    return response.data;
  },

  verify: async (assertion: any): Promise<any> => {
    const response = await apiClient.post('/passkey/api/login/verify', { assertion });
    return response.data;
  },
};
