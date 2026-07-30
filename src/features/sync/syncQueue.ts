"use client";

import { db, type SyncActionType, type SyncPayload, type SyncQueueItem } from "@/lib/dexie";
import { addRefuelLog } from "@/features/fuel/actions";
import { addMaintenanceLog } from "@/features/maintenance/actions";
import { addVehicle } from "@/features/garage/actions";
import { logger } from "@/shared/lib/logger";
import { MAX_SYNC_ATTEMPTS, hasAttemptsLeft, isDue, nextAttemptAt } from "./backoff";

export async function enqueue(type: SyncActionType, payload: SyncPayload): Promise<void> {
  if (typeof window === "undefined") return;

  await db.syncQueue.add({
    type,
    payload,
    status: "pending",
    attempts: 0,
    nextAttemptAt: 0,
    createdAt: new Date().toISOString(),
  });
}

export interface SyncOutcome {
  synced: number;
  failed: number;
  /** Items deferred to a later attempt because their backoff has not elapsed. */
  deferred: number;
}

/**
 * Drains the offline queue.
 *
 * Items are processed oldest-first because they can depend on one another: a
 * refuel queued offline references a vehicle that is itself still queued, so
 * `tempIdMap` rewrites the placeholder id once the vehicle reaches the server.
 */
export async function drainSyncQueue(): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { synced: 0, failed: 0, deferred: 0 };
  if (typeof window === "undefined" || !navigator.onLine) return outcome;

  const queue = await db.syncQueue.orderBy("id").toArray();
  if (queue.length === 0) return outcome;

  const tempIdMap = new Map<string, string>();

  for (const item of queue) {
    if (item.status === "failed") continue;
    if (!isDue(item)) {
      outcome.deferred += 1;
      continue;
    }

    try {
      await syncItem(item, tempIdMap);
      if (item.id !== undefined) await db.syncQueue.delete(item.id);
      outcome.synced += 1;
    } catch (error) {
      outcome.failed += 1;
      await recordFailure(item, error);
    }
  }

  return outcome;
}

async function syncItem(item: SyncQueueItem, tempIdMap: Map<string, string>): Promise<void> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(item.payload)) {
    // A queued child action still carries the placeholder id its parent had
    // before the server assigned a real one.
    formData.append(key, key === "vehicleId" ? (tempIdMap.get(value) ?? value) : value);
  }

  if (item.type === "ADD_VEHICLE") {
    const result = await addVehicle(formData);
    if (!result.ok) throw new Error(result.error);

    const tempId = item.payload.tempId;
    if (tempId) {
      tempIdMap.set(tempId, result.data.id);
      await db.transaction("rw", db.vehicles, async () => {
        await db.vehicles.delete(tempId);
        await db.vehicles.put({
          id: result.data.id,
          make: result.data.make,
          model: result.data.model,
          year: result.data.year,
          slug: result.data.slug,
          engineDisplacement: result.data.engineDisplacement,
          photoUrl: result.data.photoUrl,
          brandName: result.data.brandName,
          refuelingLogs: [],
          maintenanceLogs: [],
          plannedMaintenances: [],
          specs: null,
        });
      });
    }
    return;
  }

  const vehicleId = formData.get("vehicleId")?.toString();
  if (!vehicleId) throw new Error("Queued log has no vehicleId");

  const result =
    item.type === "REFUEL"
      ? await addRefuelLog(vehicleId, formData)
      : await addMaintenanceLog(vehicleId, formData);

  if (!result.ok) throw new Error(result.error);
}

async function recordFailure(item: SyncQueueItem, error: unknown): Promise<void> {
  if (item.id === undefined) return;

  const attempts = item.attempts + 1;
  const message = error instanceof Error ? error.message : String(error);
  const givingUp = !hasAttemptsLeft(attempts);

  logger.warn(
    `sync ${item.type} attempt ${attempts}/${MAX_SYNC_ATTEMPTS} failed: ${message}`,
  );

  await db.syncQueue.update(item.id, {
    attempts,
    lastError: message,
    // Kept in the queue rather than deleted, so the entry the user typed is
    // still recoverable and visible instead of vanishing silently.
    status: givingUp ? "failed" : "pending",
    nextAttemptAt: givingUp ? 0 : nextAttemptAt(attempts),
  });
}

/** Items that exhausted their retries and need the user to intervene. */
export function countFailed(): Promise<number> {
  if (typeof window === "undefined") return Promise.resolve(0);
  return db.syncQueue.where("status").equals("failed").count();
}
