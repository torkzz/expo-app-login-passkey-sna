import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';
import { mapError } from '../utils/errorMapper';
import { tokenManager } from '../services/TokenManager';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime?: number;
      requestId?: string;
    };
  }
  export interface AxiosResponse {
    duration?: number;
  }
}

/**
 * Singleton Axios client for the application.
 */
class ApiClient {
  private static instance: ApiClient;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: ENV.API_BASE_URL,
      timeout: ENV.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestId = uuidv4();
        config.metadata = {
          startTime: Date.now(),
          requestId,
        };

        config.headers['X-Request-ID'] = requestId;

        // Inject Authorization header
        const accessToken = tokenManager.getAccessToken();
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }

        // Log request
        if (ENV.ENABLE_NETWORK_LOGGING) {
          const fullUrl = new URL(
            config.url ?? '',
            config.baseURL ?? ''
          ).toString();

          console.log('======================================');
          console.log('[HTTP REQUEST]');
          console.log(`${config.method?.toUpperCase()} ${fullUrl}`);
          console.log('Request ID:', requestId);
          console.log('Headers:', JSON.stringify(config.headers, null, 2));
          if (config.params) {
            console.log('Params:', JSON.stringify(config.params, null, 2));
          }
          if (config.data) {
            console.log('Body:', typeof config.data === 'string' ? config.data : JSON.stringify(config.data, null, 2));
          }
          console.log('======================================');
        }

        return config;
      },
      (error) => {
        return Promise.reject(mapError(error));
      }
    );

    // Response Interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const endTime = Date.now();
        const duration = endTime - (response.config.metadata?.startTime || endTime);
        const requestId = response.config.metadata?.requestId;

        response.duration = duration;

        if (ENV.ENABLE_NETWORK_LOGGING) {
          const fullUrl = new URL(
            response.config.url ?? '',
            response.config.baseURL ?? ''
          ).toString();

          console.log('======================================');
          console.log('[HTTP RESPONSE]');
          console.log(`${response.config.method?.toUpperCase()} ${fullUrl}`);
          console.log('Status:', response.status);
          console.log('Duration:', `${duration}ms`);
          console.log('Request ID:', requestId);
          console.log('Headers:', JSON.stringify(response.headers, null, 2));
          if (response.data) {
            console.log('Body:', typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
          }
          console.log('======================================');
        }

        return response;
      },
      (error) => {
        const requestId = error.config?.metadata?.requestId;
        const normalizedError = mapError(error, requestId);

        if (ENV.ENABLE_NETWORK_LOGGING) {
          const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
          const url = error.config?.url || 'UNKNOWN';
          console.log('======================================');
          console.log('[HTTP ERROR]');
          console.log(`${method} ${url}`);
          console.log('Request ID:', requestId);
          if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
            console.log('Body:', typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data, null, 2));
          } else {
            console.log('Message:', error.message);
          }
          console.log('======================================');

          logger.error(`API Error: ${method} ${url}`, normalizedError);
        }

        return Promise.reject(normalizedError);
      }
    );
  }
}

export const apiClient = ApiClient.getInstance().getAxios();
