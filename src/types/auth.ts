/**
 * Authentication Type Definitions
 */

export interface TokenRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Timestamp in ms
  authenticated: boolean;
}
