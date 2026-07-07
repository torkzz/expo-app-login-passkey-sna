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
  code: number;
  status: string;
  message: string;
  success: boolean;

  transid: string;
  pin_code: string;
  ref_code: string;
  expires_in: number;
  timestamp: number;

  key: {
    publicKey: {
      rp: {
        name: string;
        id: string;
      };

      user: {
        id: string;
        name: string;
        displayName: string;
      };

      challenge: string;

      timeout: number;

      attestation: string;

      authenticatorSelection?: {
        authenticatorAttachment?: string;
        residentKey?: string;
        userVerification?: string;
      };

      pubKeyCredParams: {
        type: string;
        alg: number;
      }[];

      excludeCredentials: any[];

      extensions?: Record<string, unknown>;
    };
  };
}

export interface RegisterKeyRequest {
    pin_code: string;
    ref_code: string;

    credentialId: string;

    /**
     * WebAuthn authenticator transports (e.g. ['internal', 'hybrid']).
     * Field name matches credential.response.transports from react-native-passkeys.
     */
    transports?: string[];

    clientDataJSON: string;

    attestationObject: string;
}

export interface RegisterKeyResponse {
  success: boolean;
  credentialId: string;
  message?: string;
}

export interface LoginRequest {
   pinCode: string;
    refCode: string;
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
