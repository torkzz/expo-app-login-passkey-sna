import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const AUTH_METHOD_KEY = 'auth_method';
const USER_KEY = 'user_data';
const REF_CODE_KEY = 'ref_code';
const PIN_CODE_KEY = 'pin_code';

export const StorageService = {
  saveAccessToken: async (token: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  getAccessToken: async () => {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  saveAuthMethod: async (method: string) => {
    await SecureStore.setItemAsync(AUTH_METHOD_KEY, method);
  },

  getAuthMethod: async () => {
    return await SecureStore.getItemAsync(AUTH_METHOD_KEY);
  },

  saveUser: async (user: any) => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  getUser: async () => {
    const user = await SecureStore.getItemAsync(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  saveRefCode: async (code: string) => {
    await SecureStore.setItemAsync(REF_CODE_KEY, code);
  },

  getRefCode: async () => {
    return await SecureStore.getItemAsync(REF_CODE_KEY);
  },

  savePinCode: async (code: string) => {
    await SecureStore.setItemAsync(PIN_CODE_KEY, code);
  },

  getPinCode: async () => {
    return await SecureStore.getItemAsync(PIN_CODE_KEY);
  },

  clearAll: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(AUTH_METHOD_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(REF_CODE_KEY);
    await SecureStore.deleteItemAsync(PIN_CODE_KEY);
  },
};
