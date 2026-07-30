/**
 * Urgency scoring for planned maintenance.
 *
 * Replaces two divergent implementations that had drifted apart:
 * `RemindersSection` used a 500 km / 7 day horizon, `HomeClient` used
 * 1000 km / 14 days. Both horizons are legitimate — a vehicle detail page wants
 * near-term actionable items, the home overview wants a wider net — so the
 * horizon is a parameter, while the rule itself lives here once.
 */

export type Urgency = "overdue" | "soon" | "ok";

export interface ReminderInput {
  targetOdometer?: number | null;
  targetDate?: Date | string | null;
  isCompleted?: boolean;
}

export interface UrgencyHorizon {
  /** Distance before the target at which the reminder turns "soon". */
  odometerKm: number;
  /** Days before the target date at which the reminder turns "soon". */
  days: number;
}

export const URGENCY_HORIZON = {
  /** Vehicle detail page — only what needs doing shortly. */
  detail: { odometerKm: 500, days: 7 },
  /** Home overview — wider net, so nothing arrives as a surprise. */
  overview: { odometerKm: 1000, days: 14 },
} as const satisfies Record<string, UrgencyHorizon>;

/** Higher rank = more urgent. Used for sorting. */
export const URGENCY_RANK: Record<Urgency, number> = { overdue: 3, soon: 2, ok: 1 };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Urgency of a single reminder.
 *
 * A reminder can carry both an odometer target and a date target. The **more
 * urgent** of the two wins — the previous vehicle-page implementation checked
 * the odometer first and returned early, so a reminder 400 km out but already
 * a month past its date was reported as merely "soon".
 *
 * `now` is injectable so the result is deterministic under test.
 */
export function calcUrgency(
  reminder: ReminderInput,
  currentOdometer: number,
  horizon: UrgencyHorizon,
  now: number = Date.now(),
): Urgency {
  let urgency: Urgency = "ok";

  const promote = (candidate: Urgency) => {
    if (URGENCY_RANK[candidate] > URGENCY_RANK[urgency]) urgency = candidate;
  };

  // `!= null` rather than a truthy check: a target of 0 is meaningless but must
  // not silently disable the whole branch.
  if (reminder.targetOdometer != null) {
    const remaining = reminder.targetOdometer - currentOdometer;
    if (remaining <= 0) promote("overdue");
    else if (remaining <= horizon.odometerKm) promote("soon");
  }

  if (reminder.targetDate != null) {
    const remainingDays = (new Date(reminder.targetDate).getTime() - now) / DAY_MS;
    if (Number.isNaN(remainingDays)) return urgency;
    if (remainingDays <= 0) promote("overdue");
    else if (remainingDays <= horizon.days) promote("soon");
  }

  return urgency;
}

export type Scored<T> = T & { urgency: Urgency; rank: number };

/**
 * Scores active reminders and orders them most-urgent first. Completed
 * reminders are dropped — they are never actionable.
 */
export function scoreReminders<T extends ReminderInput>(
  reminders: readonly T[],
  currentOdometer: number,
  horizon: UrgencyHorizon,
  now: number = Date.now(),
): Scored<T>[] {
  return reminders
    .filter((r) => !r.isCompleted)
    .map((r) => {
      const urgency = calcUrgency(r, currentOdometer, horizon, now);
      return { ...r, urgency, rank: URGENCY_RANK[urgency] };
    })
    .sort((a, b) => b.rank - a.rank);
}

/** True when at least one active reminder is past its target. */
export function hasOverdue(scored: readonly { urgency: Urgency }[]): boolean {
  return scored.some((r) => r.urgency === "overdue");
}

/**
 * Highest odometer reading known for a vehicle. Refuels and maintenance logs
 * are both odometer readings, so the current odometer is the max of the two —
 * taking only the latest refuel (as the garage list does) under-reports for a
 * bike whose last event was a service.
 */
export function currentOdometerOf(readings: {
  refuelingLogs?: readonly { odometer: number }[] | null;
  maintenanceLogs?: readonly { odometer: number }[] | null;
}): number {
  let max = 0;
  for (const log of readings.refuelingLogs ?? []) max = Math.max(max, log.odometer);
  for (const log of readings.maintenanceLogs ?? []) max = Math.max(max, log.odometer);
  return max;
}
