import { ForbiddenError, UnauthorizedError } from "@/server/auth/guards";
import { logger } from "@/shared/lib/logger";

/**
 * Uniform server-action result.
 *
 * Actions previously mixed two conventions — some returned `{ error }`, others
 * threw — so callers could not tell success from failure without knowing which
 * action they were calling. Everything now returns this discriminated union.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/**
 * `redirect()` and `notFound()` signal control flow by throwing an error
 * carrying a `NEXT_*` digest. Swallowing those would silently break navigation,
 * so they are re-thrown untouched.
 */
function isControlFlowError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

/**
 * Runs an action, converting thrown errors into a failed result.
 *
 * Unexpected errors are logged with their stack and reported to the caller as a
 * generic message — internal details must not reach the client. Auth errors get
 * a specific message because the UI acts on them.
 */
export async function runAction<T>(
  name: string,
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (isControlFlowError(error)) throw error;

    if (error instanceof UnauthorizedError) return fail("Please sign in to continue.");
    if (error instanceof ForbiddenError) return fail("You do not have access to this item.");

    logger.error(`action:${name} failed`, error);
    return fail("Something went wrong. Please try again.");
  }
}
