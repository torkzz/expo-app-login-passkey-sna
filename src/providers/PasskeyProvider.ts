import { AuthenticationProvider } from './AuthenticationProvider';
import { PasskeyService } from '../services/PasskeyService';
import { AuthResult, AuthenticationMethod } from '../types/auth';
import { logger } from '../utils/logger';
import { demoPasskeyStore } from '../services/DemoPasskeyStore';
import { Platform } from 'react-native';
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

  private decodeMimeBase64(value: string): string {
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

public async login(params: { userId: string }): Promise<AuthResult> {
  console.log('PasskeyProvider: Starting login flow', {
    userId: params.userId,
  });

  try {
    // STEP 1
    console.log('[LOGIN][STEP 1] Requesting login challenge...');

    const challengeResponse =
      await this.passkeyService.requestLoginChallenge({
        userId: params.userId,
      });

    console.log('[LOGIN][STEP 2] Login challenge received');
    console.log(JSON.stringify(challengeResponse, null, 2));

    if (Platform.OS === 'android') {
      console.log('[ANDROID] Native Passkey login');

      const publicKeyOptions = {
        ...challengeResponse,

        challenge: this.decodeMimeBase64(
          challengeResponse.challenge,
        ),

        allowCredentials:
          challengeResponse.allowCredentials?.map((credential) => ({
            ...credential,
            id: this.decodeMimeBase64(credential.id),
          })),
      };

      console.log('[ANDROID] PublicKey Options');
      console.log(JSON.stringify(publicKeyOptions, null, 2));

      // TODO:
      // const assertion = await get(publicKeyOptions);
      //
      // if (!assertion) {
      //   throw new Error('Passkey login cancelled.');
      // }
      //
      // const loginResponse =
      //   await this.passkeyService.verifyLogin(assertion);
      //
      // return {
      //   success: loginResponse.success,
      //   method: this.getType(),
      //   token: loginResponse.token,
      //   message: loginResponse.message,
      // };

      return {
        success: false,
        code: 'ANDROID_NATIVE_NOT_IMPLEMENTED',
        method: this.getType(),
        challenge: challengeResponse,
        message:
          'Android native Passkey login has not been implemented yet.',
      };
    }

    // iOS fallback (until native implementation)
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

      const publicKeyOptions = {
        ...challengeResponse.key.publicKey,

        challenge: this.decodeMimeBase64(
          challengeResponse.key.publicKey.challenge,
        ),

        user: {
          ...challengeResponse.key.publicKey.user,
          id: this.decodeMimeBase64(
            challengeResponse.key.publicKey.user.id,
          ),
        },
      };

      console.log('[ANDROID] PublicKey Options');
      console.log("========== CREATE INPUT ==========");
      console.log(JSON.stringify(publicKeyOptions, null, 2));
      console.log("==================================");
      // STEP 1: Create the native passkey
      const credential = await create(publicKeyOptions);

      if (!credential) {
        throw new Error('Passkey creation cancelled.');
      }

      console.log('[ANDROID] Credential');
      console.log(JSON.stringify(credential, null, 2));

      // STEP 2: Register the credential with the backend
      const registerResponse = await this.passkeyService.registerKey({
        pin_code: challengeResponse.pin_code,
        ref_code: challengeResponse.ref_code,

        credentialId: credential.id,

        transport: credential.response.transports,

        clientDataJSON: credential.response.clientDataJSON,

        attestationObject: credential.response.attestationObject,
      });

      console.log('[ANDROID] Registration Complete');
      console.log(JSON.stringify(registerResponse, null, 2));

      return {
        success: registerResponse.success,
        method: this.getType(),
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
