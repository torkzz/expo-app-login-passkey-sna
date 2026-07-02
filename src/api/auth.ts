import apiClient from './axios';
import { AuthResponse } from '../types';

export const AuthAPI = {
  getToken: async (payload: any): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/token', payload);
    return response.data;
  },
};
