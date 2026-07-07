/**
 * API Endpoint Registry
 *
 * Centralized location for all API endpoints.
 * No endpoint paths should be hardcoded elsewhere in the project.
 */

export const API = {
  AUTH: {
    TOKEN: '/auth/token',
  },
  PASSKEY: {
    GENERATE_KEY: '/passkey/generate/key',
    REGISTER: '/passkey/register/key',
    LOGIN_REQUEST: '/passkey/login/request',
    LOGIN_VERIFY: '/passkey/login/verify',
  },
  SNA: {
    LOGIN_REQUEST: '/sna/api/login/request',
    LOGIN_VERIFY: '/sna/api/login/verify',
  },
} as const;

export type API_ENDPOINTS = typeof API;
