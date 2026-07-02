import { useAuthStore } from '../store/authStore';
import { PasskeyService } from './PasskeyService';
import { SNAService } from './SNAService';
import { StorageService } from './StorageService';
import { AuthMethod } from '../types';

export const AuthService = {
  loginWithPasskey: async () => {
    const { setLoading, setAuthenticated, setAuthMethod, setUser, setAccessToken, setError } = useAuthStore.getState();
    if (useAuthStore.getState().loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await PasskeyService.authenticate();

      await StorageService.saveAccessToken(result.access_token);
      await StorageService.saveAuthMethod('passkey');
      if (result.user) await StorageService.saveUser(result.user);
      if (result.ref_code) await StorageService.saveRefCode(result.ref_code);
      if (result.pin_code) await StorageService.savePinCode(result.pin_code);

      setAccessToken(result.access_token);
      setAuthMethod('passkey');
      setUser(result.user || { id: 'unknown', email: 'user@example.com' });
      setAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Passkey login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  },

  registerPasskey: async (email: string) => {
    const { setLoading, setAuthenticated, setAuthMethod, setUser, setAccessToken, setError } = useAuthStore.getState();
    if (useAuthStore.getState().loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await PasskeyService.register(email);

      await StorageService.saveAccessToken(result.access_token);
      await StorageService.saveAuthMethod('passkey');
      if (result.user) await StorageService.saveUser(result.user);
      if (result.ref_code) await StorageService.saveRefCode(result.ref_code);
      if (result.pin_code) await StorageService.savePinCode(result.pin_code);

      setAccessToken(result.access_token);
      setAuthMethod('passkey');
      setUser(result.user || { id: 'unknown', email });
      setAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Passkey registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  },

  loginWithSNA: async (phoneNumber: string) => {
    const { setLoading, setAuthenticated, setAuthMethod, setUser, setAccessToken, setError } = useAuthStore.getState();
    if (useAuthStore.getState().loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await SNAService.authenticate(phoneNumber);

      await StorageService.saveAccessToken(result.access_token);
      await StorageService.saveAuthMethod('sna');
      if (result.user) await StorageService.saveUser(result.user);
      if (result.ref_code) await StorageService.saveRefCode(result.ref_code);
      if (result.pin_code) await StorageService.savePinCode(result.pin_code);

      setAccessToken(result.access_token);
      setAuthMethod('sna');
      setUser(result.user || { id: 'unknown', phoneNumber });
      setAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'SNA login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  },

  restoreSession: async () => {
    const { setAuthenticated, setAuthMethod, setUser, setAccessToken, setLoading } = useAuthStore.getState();
    setLoading(true);
    try {
      const token = await StorageService.getAccessToken();
      const method = await StorageService.getAuthMethod();
      const user = await StorageService.getUser();

      if (token) {
        setAccessToken(token);
        setAuthMethod(method as AuthMethod);
        setUser(user);
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
    } finally {
      setLoading(false);
    }
  },

  logout: async () => {
    const { logout } = useAuthStore.getState();
    await StorageService.clearAll();
    logout();
  },
};
