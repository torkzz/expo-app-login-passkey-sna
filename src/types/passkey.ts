/**
 * Passkey Type Definitions
 *
 * Based on WebAuthn standard and Verify API contract.
 */

export interface GenerateKeyRequest {
  userId: string;
  userName: string;
  displayName?: string;
}

export interface GenerateKeyResponse {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: {
    type: string;
    alg: number;
  }[];
  timeout?: number;
  attestation?: string;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    userVerification?: string;
  };
}

export interface RegisterKeyRequest {
  id: string;
  rawId: string;
  type: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
}

export interface RegisterKeyResponse {
  success: boolean;
  credentialId: string;
  message?: string;
}

export interface LoginRequest {
  userId: string;
}

export interface LoginRequestResponse {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: {
    type: string;
    id: string;
    transports?: string[];
  }[];
  userVerification?: string;
}

export interface LoginVerifyRequest {
  id: string;
  rawId: string;
  type: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle?: string;
  };
}

export interface LoginVerifyResponse {
  success: boolean;
  token?: string;
  message?: string;
}
