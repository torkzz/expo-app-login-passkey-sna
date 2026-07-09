import { AuthenticationProvider } from './AuthenticationProvider';
import { PasskeyService } from '../services/PasskeyService';
import { AuthResult, AuthenticationMethod } from '../types/auth';
import { LoginVerifyRequest } from '../types/passkey';
import { logger } from '../utils/logger';
import { demoPasskeyStore } from '../services/DemoPasskeyStore';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create,
  get,
  isSupported, } from 'react-native-passkeys';

console.log(
  'Passkey supported:',
  isSupported(),
);
/**
 * PasskeyProvider
 *
 * Implements AuthenticationProvider for Passkey/WebAuthn.
 * Delegates to PasskeyService for HTTP communication.
 */
export class PasskeyProvider implements AuthenticationProvider {
  private readonly passkeyService: PasskeyService;

  constructor(passkeyService: PasskeyService) {
    this.passkeyService = passkeyService;
  }

  private decodeMimeBase64(value: string | undefined | null): string {
    if (!value) {
      console.warn('[PasskeyProvider] decodeMimeBase64 received undefined/null/empty value');
      return '';
    }
    const prefix = '=?BINARY?B?';
    const suffix = '?=';

    let result = value;

    if (result.startsWith(prefix) && result.endsWith(suffix)) {
      result = result.substring(prefix.length, result.length - suffix.length);
    }

    return result
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private toStandardBase64(base64url: string): string {
    let base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad === 2) {
      base64 += '==';
    } else if (pad === 3) {
      base64 += '=';
    }
    return base64;
  }


  public async login(params?: { userId?: string }): Promise<AuthResult> {
    console.log('PasskeyProvider: Starting login flow');

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Load registration identifiers
    // -------------------------------------------------------------------------
    const pinCode = await SecureStore.getItemAsync('pin_code') || '';
    const refCode = await SecureStore.getItemAsync('ref_code') || '';

    console.log('[LOGIN][STEP 0] Loaded credentials', {
      pinCode,
      refCode,
    });

    if (!pinCode || !refCode) {
      return {
        success: false,
        code: 'PASSKEY_NOT_REGISTERED',
        method: this.getType(),
        message:
          'No registered Passkey information was found on this device.',
      };
    }

    // -------------------------------------------------------------------------
    // STEP 1: Request authentication challenge
    // -------------------------------------------------------------------------

    console.log('[LOGIN][STEP 1] Requesting login challenge...');

    const challengeResponse =
      await this.passkeyService.requestLoginChallenge({
        pinCode,
        refCode,
      });

    console.log('[LOGIN][STEP 2] Login challenge received');
    console.log(JSON.stringify(challengeResponse, null, 2));

    // Extract the publicKey options from the nested key.publicKey structure
    const publicKeyChallenge = challengeResponse.key.publicKey;

    // Use the pin_code / ref_code echoed back from the *login challenge* response
    // (they may differ from the ones stored in SecureStore if the server rotated them)
    const loginPinCode = challengeResponse.pin_code || pinCode;
    const loginRefCode = challengeResponse.ref_code || refCode;

    console.log('[LOGIN][STEP 2] Extracted publicKey challenge options');
    console.log(JSON.stringify(publicKeyChallenge, null, 2));

    // -------------------------------------------------------------------------
    // ANDROID
    // -------------------------------------------------------------------------

    if (Platform.OS === 'android') {
      console.log('[ANDROID] Native Passkey login');

      const publicKeyOptions: any = {
        ...publicKeyChallenge,

        challenge: this.decodeMimeBase64(
          publicKeyChallenge.challenge,
        ),

        allowCredentials:
          publicKeyChallenge.allowCredentials?.map((credential) => ({
            ...credential,
            id: this.decodeMimeBase64(credential.id),
          })),
      };

      console.log('[ANDROID] PublicKey Options');
      console.log(JSON.stringify(publicKeyOptions, null, 2));

      console.log('[ANDROID] Calling get()...');
      const assertion = await get(publicKeyOptions);

      if (!assertion) {
        throw new Error('Passkey login cancelled.');
      }

      console.log('[ANDROID] Assertion received');
      console.log(JSON.stringify(assertion, null, 2));

      const loginPayload: LoginVerifyRequest = {
        pin_code: loginPinCode,
        ref_code: loginRefCode,
        credentialId: this.toStandardBase64(assertion.id),
        clientDataJSON: assertion.response.clientDataJSON,
        authenticatorData: assertion.response.authenticatorData,
        signature: assertion.response.signature,
      };

      console.log('[ANDROID] Verifying login assertion...');
      const loginResponse = await this.passkeyService.verifyLogin(loginPayload);

      console.log('[ANDROID] Login verify response:', JSON.stringify(loginResponse, null, 2));

      return {
        success: loginResponse.success,
        method: this.getType(),
        accessToken: loginResponse.token,
        user: {
          id: pinCode,
          mobileNumber: pinCode,
        },
        message: loginResponse.message,
      };
    }

    // -------------------------------------------------------------------------
    // iOS fallback
    // -------------------------------------------------------------------------

    console.log('[IOS] Demo Passkey flow');

    const hasDemoPasskey =
      await demoPasskeyStore.hasDemoPasskey();

    if (!hasDemoPasskey) {
      return {
        success: false,
        code: 'PASSKEY_NOT_REGISTERED',
        method: this.getType(),
        message: 'No demo Passkey registration found.',
      };
    }

    return {
      success: false,
      code: 'PASSKEY_NATIVE_REQUIRED',
      method: this.getType(),
      challenge: challengeResponse,
      message:
        'Native Passkey authentication requires an Apple Developer-enabled build.',
    };
  } catch (error) {
    console.log('[LOGIN] FAILED');
    console.log(error);

    return {
      success: false,
      method: this.getType(),
      message:
        error instanceof Error
          ? error.message
          : 'Unknown Passkey error',
    };
  }
}

public async register(params: { username: string; mobileNumber: string }): Promise<AuthResult> {
  console.log('[REGISTER] ===== START =====');
  console.log('[REGISTER] Params', {
    username: params.username,
    mobileNumber: params.mobileNumber,
  });

  try {
    console.log('[REGISTER][STEP 1] Requesting registration challenge...');

    const challengeResponse =
      await this.passkeyService.generateRegistrationChallenge({
        userId: params.mobileNumber,
        userName: params.username,
      });

    console.log('[REGISTER][STEP 2] Registration challenge received');


    console.log('[REGISTER][STEP 2] Challenge Metadata', {
      rpName: challengeResponse.key.publicKey.rp.name,
      rpId: challengeResponse.key.publicKey.rp.id,
      userId: challengeResponse.key.publicKey.user.id,
      userName: challengeResponse.key.publicKey.user.name,
    });

    console.log('[REGISTER][STEP 2] Full Challenge');
    console.log(JSON.stringify(challengeResponse, null, 2));

    if (Platform.OS === 'android') {
      console.log('[ANDROID] Native Passkey registration');
      
      // -----------------------------------------------------------------------
      // STEP 3: Build publicKey options for create()
      // -----------------------------------------------------------------------
      const rawPublicKey = challengeResponse.key.publicKey;

      const decodedChallenge = this.decodeMimeBase64(rawPublicKey.challenge);
      const decodedUserId   = this.decodeMimeBase64(rawPublicKey.user.id);

      console.log('[ANDROID][STEP 3] Raw challenge (backend):', rawPublicKey.challenge);
      console.log('[ANDROID][STEP 3] Decoded challenge (Base64URL):', decodedChallenge);
      console.log('[ANDROID][STEP 3] Raw user.id (backend):', rawPublicKey.user.id);
      console.log('[ANDROID][STEP 3] Decoded user.id (Base64URL):', decodedUserId);

      const publicKeyOptions: any = {
        ...rawPublicKey,
        challenge: decodedChallenge,
        user: {
          ...rawPublicKey.user,
          id: decodedUserId,
        },
      };

      console.log('[ANDROID][STEP 3] Full publicKeyOptions passed to create():');
      console.log('========== CREATE INPUT ==========');
      console.log(JSON.stringify(publicKeyOptions, null, 2));
      console.log('==================================');

      // -----------------------------------------------------------------------
      // STEP 4: Invoke native passkey creation
      // -----------------------------------------------------------------------
      console.log('[ANDROID][STEP 4] Calling create()...');
      const credential = await create(publicKeyOptions);

      if (!credential) {
        throw new Error('Passkey creation cancelled or not supported.');
      }

      console.log('[ANDROID][STEP 4] Credential received.');
      console.log('[ANDROID][STEP 4] credential.id:', credential.id);
      console.log('[ANDROID][STEP 4] credential.rawId:', credential.rawId);
      console.log('[ANDROID][STEP 4] credential.type:', credential.type);
      console.log('[ANDROID][STEP 4] credential.authenticatorAttachment:', credential.authenticatorAttachment);
      console.log('[ANDROID][STEP 4] credential.response keys:', Object.keys(credential.response));
      console.log('[ANDROID][STEP 4] credential.response.clientDataJSON:', credential.response.clientDataJSON);
      console.log('[ANDROID][STEP 4] credential.response.attestationObject:', credential.response.attestationObject);
      console.log('[ANDROID][STEP 4] credential.response.transports:', credential.response.transports);
      console.log('[ANDROID][STEP 4] Full credential:');
      console.log(JSON.stringify(credential, null, 2));

      // -----------------------------------------------------------------------
      // STEP 5: Build registerKey payload
      // -----------------------------------------------------------------------
      const registerPayload = {
        pin_code:          challengeResponse.pin_code,
        ref_code:          challengeResponse.ref_code,
        credentialId:      credential.id,
        transports:        credential.response.transports,
        clientDataJSON:    credential.response.clientDataJSON,
        attestationObject: credential.response.attestationObject,
      };

      console.log('[ANDROID][STEP 5] registerKey payload:');
      console.log(JSON.stringify(registerPayload, null, 2));

      // -----------------------------------------------------------------------
      // STEP 6: Submit to backend
      // -----------------------------------------------------------------------
      console.log('[ANDROID][STEP 6] Calling registerKey API...');
      const registerResponse = await this.passkeyService.registerKey(registerPayload);

      console.log('[ANDROID][STEP 6] registerKey response:');
      console.log(JSON.stringify(registerResponse, null, 2));

      if (registerResponse.success) {
        console.log('[ANDROID] Saving credentials to SecureStore...');
        await Promise.all([
          SecureStore.setItemAsync('pin_code', challengeResponse.pin_code),
          SecureStore.setItemAsync('ref_code', challengeResponse.ref_code),
        ]);
      }

      return {
        success: registerResponse.success,
        method: this.getType(),
        user: {
          id: params.mobileNumber,
          username: params.username,
          mobileNumber: params.mobileNumber,
        },
        message: registerResponse.message ?? 'Passkey registered successfully.',
      };
    }
  
    console.log('[IOS] Saving DemoPasskey...');

    await demoPasskeyStore.saveDemoPasskey({
      username: params.username,
      mobileNumber: params.mobileNumber,
      challenge: challengeResponse,
      createdAt: Date.now(),
      registered: true,
    });

    console.log('[IOS] DemoPasskey saved successfully');

    return {
      success: false,
      code: 'PASSKEY_NATIVE_REQUIRED',
      method: this.getType(),
      challenge: challengeResponse,
      message:
        'Native Passkey registration requires an Apple Developer-enabled build.',
    };
  } catch (error: any) {
    console.log('[REGISTER] FAILED');
    console.log(error);

    console.log('================ ERROR ================');
    console.log(error);

    if (error?.response) {
      console.log('HTTP STATUS:', error.response.status);
      console.log(
        'HTTP DATA:',
        JSON.stringify(error.response.data, null, 2),
      );
    }

    if (error?.message) {
      console.log('MESSAGE:', error.message);
    }

    if (error?.stack) {
      console.log('STACK:', error.stack);
    }

    console.log('=======================================');

    return {
      success: false,
      code: 'REGISTER_EXCEPTION',
      method: this.getType(),
      message:
        error?.message ??
        'Unknown registration exception',
    };
  }
}

  public async logout(): Promise<void> {
    console.log('Passkey provider logout');
    // No specific local cleanup needed for Passkeys usually
  }

  public async isAvailable(): Promise<boolean> {
    // TODO: Implement native check for Passkey availability (e.g. Platform.OS and biometrics check)
    return true;
  }

  public getType(): AuthenticationMethod {
    return 'passkey';
  }
}
