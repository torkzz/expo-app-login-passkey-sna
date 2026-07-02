/**
 * Silent Network Authentication (SNA) Type Definitions
 */

export interface SNALoginRequest {
  phoneNumber: string;
}

export interface SNALoginResponse {
  success: boolean;
  checkUrl: string;
  referenceId: string;
  message?: string;
}

export interface SNAVerifyRequest {
  referenceId: string;
}

export interface SNAVerifyResponse {
  success: boolean;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  message?: string;
}

/**
 * Application-level SNA result (Normalized)
 */
export interface SNAResult {
  success: boolean;
  challengeUrl?: string;
  referenceId?: string;
  message?: string;
  status?: string;
  raw?: unknown;
}
