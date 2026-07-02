export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
}

export type AuthMethod = 'passkey' | 'sna';

export interface AuthState {
  authenticated: boolean;
  authenticationMethod: AuthMethod | null;
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Passkey Types
export interface PasskeyGenerateRequest {
  email: string;
}

export interface PasskeyGenerateResponse {
  challenge: string;
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  rp: {
    id: string;
    name: string;
  };
  pubKeyCredParams: {
    type: string;
    alg: number;
  }[];
  timeout?: number;
  attestation?: string;
  excludeCredentials?: any[];
  authenticatorSelection?: any;
}

export interface PasskeyRegisterRequest {
  email: string;
  attestation: any;
}

export interface PasskeyLoginRequestResponse {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: any[];
  userVerification?: string;
}

export interface PasskeyLoginVerifyRequest {
  assertion: any;
}

// SNA Types
export interface SNALoginRequestResponse {
  challenge: string;
  url: string;
}

export interface SNALoginVerifyRequest {
  challenge: string;
}
