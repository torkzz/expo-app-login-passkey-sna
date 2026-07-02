import * as Passkeys from 'react-native-passkeys';
import { PasskeyAPI } from '../api/passkey';

export const PasskeyService = {
  isSupported: () => {
    return Passkeys.isSupported();
  },

  register: async (email: string) => {
    try {
      const challenge = await PasskeyAPI.generateKey(email);

      // react-native-passkeys.create takes a standard WebAuthn creation options object
      const response = await Passkeys.create(challenge as any);

      if (response) {
        const registration = await PasskeyAPI.register(email, response);
        return registration;
      }

      throw new Error('Registration failed: No result from native prompt');
    } catch (error: any) {
      console.error('Passkey Registration Error:', error);
      throw error;
    }
  },

  authenticate: async () => {
    try {
      const request = await PasskeyAPI.loginRequest();

      // react-native-passkeys.get takes standard WebAuthn assertion/request options
      const response = await Passkeys.get({
        challenge: request.challenge,
        rpId: request.rpId || 'example.com',
        timeout: request.timeout || 60000,
        allowCredentials: request.allowCredentials,
        userVerification: request.userVerification
      } as any);

      if (response) {
        const verification = await PasskeyAPI.verify(response);
        return verification;
      }

      throw new Error('Authentication failed: No result from native prompt');
    } catch (error: any) {
      console.error('Passkey Authentication Error:', error);
      throw error;
    }
  },
};
