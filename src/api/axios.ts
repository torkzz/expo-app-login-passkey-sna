import axios from 'axios';
import Constants from 'expo-constants';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev.m360.com.ph/verify/v1';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
