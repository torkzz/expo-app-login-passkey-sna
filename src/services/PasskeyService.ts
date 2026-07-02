import * as Passkeys from 'expo-passkeys';
import { PasskeyAPI } from '../api/passkey';

export const PasskeyService = {
  isSupported: () => {
    return Passkeys.isSupported();
  },

  register: async (email: string) => {
    try {
      const challenge = await PasskeyAPI.generateKey(email);

      const response = await Passkeys.createAsync(
        challenge.challenge,
        challenge.user as any,
        challenge.rp as any,
        challenge.timeout || 60000
      );

      if (response.result) {
        const registration = await PasskeyAPI.register(email, response.result);
        return registration;
      }

      if (response.error) {
        throw new Error(`Registration failed: ${response.error.code}`);
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

      const response = await Passkeys.signInAsync(
        request.challenge,
        { id: '0000-0000-0000-0000', name: '', displayName: '' } as any,
        { id: request.rpId || 'example.com', name: '' } as any,
        request.timeout || 60000
      );

      if (response.result) {
        const verification = await PasskeyAPI.verify(response.result);
        return verification;
      }

      if (response.error) {
        throw new Error(`Authentication failed: ${response.error.code}`);
      }

      throw new Error('Authentication failed: No result from native prompt');
    } catch (error: any) {
      console.error('Passkey Authentication Error:', error);
      throw error;
    }
  },
};
