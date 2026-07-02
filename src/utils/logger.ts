import { ENV } from '../config/env';

/**
 * Logger interface to allow future replacement with other logging services
 * like Sentry, Datadog, etc.
 */
export interface ILogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: unknown, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

class Logger implements ILogger {
  private readonly isLoggingEnabled = ENV.ENABLE_NETWORK_LOGGING;

  info(message: string, ...args: unknown[]): void {
    if (this.isLoggingEnabled) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.isLoggingEnabled) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    // We might want to log errors even if network logging is disabled,
    // but the requirement says logging must respect EXPO_PUBLIC_ENABLE_NETWORK_LOGGING.
    if (this.isLoggingEnabled) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isLoggingEnabled || ENV.APP_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
