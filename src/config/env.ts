/**
 * Environment configuration module.
 *
 * This module is the single source of truth for environment variables.
 * No other file should access process.env directly.
 */

interface EnvConfig {
  API_BASE_URL_PASSKEY: string;
  API_BASE_URL_SNA: string;
  VERIFY_CLIENT_ID: string;
  VERIFY_CLIENT_SECRET: string;
  APP_NAME: string;
  APP_ENV: 'development' | 'staging' | 'production';
  API_TIMEOUT: number;
  ENABLE_NETWORK_LOGGING: boolean;
}

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is missing`);
  }
  return value;
};

export const ENV: EnvConfig = {
  API_BASE_URL_PASSKEY: getEnvVar('EXPO_PUBLIC_API_BASE_URL_PASSKEY', 'https://dev.m360.com.ph/verify/v1/'),
  API_BASE_URL_SNA: getEnvVar('EXPO_PUBLIC_API_BASE_URL_SNA', 'https://stg-verify.m360.com.ph/v1/'),
  VERIFY_CLIENT_ID: getEnvVar('EXPO_PUBLIC_VERIFY_CLIENT_ID', ''),
  VERIFY_CLIENT_SECRET: getEnvVar('EXPO_PUBLIC_VERIFY_CLIENT_SECRET', ''),
  APP_NAME: getEnvVar('EXPO_PUBLIC_APP_NAME', 'Verify Demo'),
  APP_ENV: getEnvVar('EXPO_PUBLIC_APP_ENV', 'development') as EnvConfig['APP_ENV'],
  API_TIMEOUT: parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '10000'), 10),
  ENABLE_NETWORK_LOGGING: getEnvVar('EXPO_PUBLIC_ENABLE_NETWORK_LOGGING', 'false') === 'true',
};

// Validation
const requiredVars: (keyof EnvConfig)[] = [
  'API_BASE_URL_PASSKEY',
  'API_BASE_URL_SNA',
  'VERIFY_CLIENT_ID',
  'VERIFY_CLIENT_SECRET',
];

for (const key of requiredVars) {
  if (!ENV[key]) {
    console.warn(`Warning: Environment variable ${key} is not set.`);
  }
}
