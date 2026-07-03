import { AuthResult, AuthenticationMethod } from '../types/auth';

/**
 * AuthenticationProvider Interface
 *
 * Defines the contract for all authentication methods (Passkey, SNA, etc.)
 */
export interface AuthenticationProvider {
  /**
   * Execute the login flow for the provider.
   */
  login(params?: unknown): Promise<AuthResult>;

  /**
   * Execute the registration flow for the provider.
   */
  register(params?: unknown): Promise<AuthResult>;

  /**
   * Perform provider-specific logout actions.
   */
  logout(): Promise<void>;

  /**
   * Check if the authentication method is available on the current device.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the type of authentication method.
   */
  getType(): AuthenticationMethod;
}
