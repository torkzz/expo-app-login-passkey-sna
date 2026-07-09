/**
 * Silent Network Authentication (SNA) Type Definitions
 */

export interface SNALoginRequest {
  to: string;
  from: string;
}

export interface SNALoginResponse {
  success: boolean;
  code?: number;
  check_url?: string;
  transid?: string;
  ref_code?: string;
  message?: string;
}

export interface SNAVerifyRequest {
  pin_code: string;
  ref_code: string;
}

export interface SNAVerifyResponse {
  success: boolean;
  code?: number;
  status?: string;
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
