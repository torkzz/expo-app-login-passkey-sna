import * as SecureStore from 'expo-secure-store';
import { GenerateKeyResponse } from '../types/passkey';
import { logger } from '../utils/logger';

// DEMO ONLY: This store is for demonstration purposes in Expo Go only.
// It allows simulating a registered state so the login flow can be demonstrated
// up until the point of native Passkey assertion.

const DEMO_PASSKEY_KEY = 'demo_passkey_data';

export interface DemoPasskey {
  username: string;
  mobileNumber: string;
  challenge: GenerateKeyResponse;
  createdAt: number;
  registered: boolean;
}

/**
 * DemoPasskeyStore Singleton (DEMO ONLY)
 *
 * Persists registration metadata in Secure Store to simulate
 * a registered device for demo flows in Expo Go.
 */
export class DemoPasskeyStore {
  private static instance: DemoPasskeyStore;
  private currentPasskey: DemoPasskey | null = null;

  private constructor() {}

  public static getInstance(): DemoPasskeyStore {
    if (!DemoPasskeyStore.instance) {
      DemoPasskeyStore.instance = new DemoPasskeyStore();
    }
    return DemoPasskeyStore.instance;
  }

  /**
   * Save demo passkey data (DEMO ONLY)
   */
  public async saveDemoPasskey(passkey: DemoPasskey): Promise<void> {
    logger.info('[DEMO ONLY] Saving demo passkey to Secure Store');
    this.currentPasskey = passkey;
    try {
      await SecureStore.setItemAsync(DEMO_PASSKEY_KEY, JSON.stringify(passkey));
    } catch (error) {
      logger.error('[DEMO ONLY] Failed to save demo passkey', error);
    }
  }

  /**
   * Get demo passkey data (DEMO ONLY)
   */
  public async getDemoPasskey(): Promise<DemoPasskey | null> {
    if (this.currentPasskey) return this.currentPasskey;

    try {
      const data = await SecureStore.getItemAsync(DEMO_PASSKEY_KEY);
      if (data) {
        this.currentPasskey = JSON.parse(data);
        return this.currentPasskey;
      }
    } catch (error) {
      logger.error('[DEMO ONLY] Failed to retrieve demo passkey', error);
    }
    return null;
  }

  /**
   * Check if a demo passkey exists (DEMO ONLY)
   */
  public async hasDemoPasskey(): Promise<boolean> {
    const passkey = await this.getDemoPasskey();
    return !!passkey && passkey.registered;
  }

  /**
   * Clear demo passkey data (DEMO ONLY)
   */
  public async clearDemoPasskey(): Promise<void> {
    logger.info('[DEMO ONLY] Clearing demo passkey');
    this.currentPasskey = null;
    try {
      await SecureStore.deleteItemAsync(DEMO_PASSKEY_KEY);
    } catch (error) {
      logger.error('[DEMO ONLY] Failed to clear demo passkey', error);
    }
  }
}

export const demoPasskeyStore = DemoPasskeyStore.getInstance();
