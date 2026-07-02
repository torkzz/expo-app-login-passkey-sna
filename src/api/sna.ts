import apiClient from './axios';
import { SNALoginRequestResponse } from '../types';

export const SNAAPI = {
  loginRequest: async (phoneNumber: string): Promise<SNALoginRequestResponse> => {
    const response = await apiClient.post('/sna/api/login/request', { phoneNumber });
    return response.data;
  },

  verify: async (challenge: string): Promise<any> => {
    const response = await apiClient.post('/sna/api/login/verify', { challenge });
    return response.data;
  },
};
