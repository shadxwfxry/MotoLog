/**
 * Retry policy for the offline queue.
 *
 * Previously a failed item was logged and left in the queue with no attempt
 * counter, so a permanently invalid entry (say, a refuel for a vehicle that was
 * deleted on another device) was retried on every reconnect, forever, blocking
 * nothing but filling the console. Attempts are now bounded and spaced out.
 */

export const MAX_SYNC_ATTEMPTS = 5;

const BASE_DELAY_MS = 5_000;
const MAX_DELAY_MS = 5 * 60_000;

/**
 * Exponential backoff: 5s, 10s, 20s, 40s, … capped at 5 minutes.
 * Deterministic — jitter would buy little here, since the queue is per-device
 * and drains sequentially rather than stampeding a shared endpoint.
 */
export function backoffDelayMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.min(BASE_DELAY_MS * 2 ** (attempts - 1), MAX_DELAY_MS);
}

export function nextAttemptAt(attempts: number, now: number = Date.now()): number {
  return now + backoffDelayMs(attempts);
}

export function hasAttemptsLeft(attempts: number): boolean {
  return attempts < MAX_SYNC_ATTEMPTS;
}

/** An item is due when it is still pending and its backoff window has passed. */
export function isDue(
  item: { status: string; nextAttemptAt: number },
  now: number = Date.now(),
): boolean {
  return item.status === "pending" && item.nextAttemptAt <= now;
}
