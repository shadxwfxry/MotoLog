/**
 * Minimal structured logger.
 *
 * Errors used to be swallowed by bare `console.error` calls inside actions,
 * which meant failures were invisible in production. This gives one place to
 * attach a reporter (Sentry) without touching call sites.
 */

type Reporter = (error: unknown, context: { message: string }) => void;

let reporter: Reporter | null = null;

/** Wired up once at startup when an error-reporting backend is configured. */
export function setErrorReporter(fn: Reporter | null): void {
  reporter = fn;
}

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  debug(message: string, ...rest: unknown[]): void {
    if (isDev) console.debug(`[motolog] ${message}`, ...rest);
  },

  info(message: string, ...rest: unknown[]): void {
    console.info(`[motolog] ${message}`, ...rest);
  },

  warn(message: string, ...rest: unknown[]): void {
    console.warn(`[motolog] ${message}`, ...rest);
  },

  error(message: string, error?: unknown): void {
    console.error(`[motolog] ${message}`, error);
    if (reporter) {
      try {
        reporter(error, { message });
      } catch {
        // A failing reporter must never take down the request it is reporting on.
      }
    }
  },
};
