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

        // Log request (Sensitive data exclusion handled by logging policy)
        if (ENV.ENABLE_NETWORK_LOGGING) {
          console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
            requestId,
            params: config.params,
            // Never log headers or data here to avoid sensitive info leaks
          });
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
          console.log(`Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            duration: `${duration}ms`,
            requestId,
          });
        }

        return response;
      },
      (error) => {
        const requestId = error.config?.metadata?.requestId;
        const normalizedError = mapError(error, requestId);

        if (ENV.ENABLE_NETWORK_LOGGING) {
          logger.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, normalizedError);
        }

        return Promise.reject(normalizedError);
      }
    );
  }
}

export const apiClient = ApiClient.getInstance().getAxios();
