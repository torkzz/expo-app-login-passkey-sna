import { AxiosError } from 'axios';

/**
 * Normalized application error structure.
 */
export interface AppError {
  code: string;
  message: string;
  status?: number;
  requestId?: string;
  details?: unknown;
}

/**
 * Maps various error types to a normalized AppError.
 */
export const mapError = (error: unknown, requestId?: string): AppError => {
  if (error instanceof Error && (error as any).isAppError) {
    return error as unknown as AppError;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Handle common HTTP error codes
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: data?.message || 'Invalid request',
          status,
          requestId,
          details: data,
        };
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          status,
          requestId,
        };
      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied',
          status,
          requestId,
        };
      case 404:
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          status,
          requestId,
        };
      case 409:
        return {
          code: 'CONFLICT',
          message: 'Conflict occurred',
          status,
          requestId,
        };
      case 422:
        return {
          code: 'UNPROCESSABLE_ENTITY',
          message: 'Validation failed',
          status,
          requestId,
          details: data,
        };
      case 429:
        return {
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded',
          status,
          requestId,
        };
      case 500:
        return {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          status,
          requestId,
        };
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed or timed out',
        requestId,
      };
    }

    return {
      code: 'UNKNOWN_API_ERROR',
      message: error.message || 'An unexpected error occurred',
      status,
      requestId,
      details: data,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    requestId,
  };
};

function isAxiosError(error: any): error is AxiosError {
  return error && error.isAxiosError === true;
}
