import Dexie, { type EntityTable } from "dexie";

/**
 * Offline queue payloads.
 *
 * A discriminated action type rather than `payload: any`: the sync worker
 * switches on `type`, and a mismatched payload is now a compile error instead
 * of a runtime surprise on a phone with no signal.
 */
export type SyncActionType = "ADD_VEHICLE" | "REFUEL" | "MAINTENANCE";

/** Form fields are always strings — they are replayed through FormData. */
export type SyncPayload = Record<string, string>;

export type SyncStatus = "pending" | "failed";

export interface SyncQueueItem {
  id?: number;
  type: SyncActionType;
  payload: SyncPayload;
  status: SyncStatus;
  /** Failed attempts so far; drives the backoff and the give-up threshold. */
  attempts: number;
  /** Epoch ms before which the item must not be retried. */
  nextAttemptAt: number;
  lastError?: string;
  createdAt: string;
}

export interface CachedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  slug: string;
  engineDisplacement?: number | null;
  photoUrl?: string | null;
  brandName?: string | null;
  refuelingLogs?: { odometer: number }[];
  maintenanceLogs?: { odometer: number }[];
  plannedMaintenances?: unknown[];
  specs?: unknown;
}

export class MotoLogDB extends Dexie {
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  vehicles!: EntityTable<CachedVehicle, "id">;

  constructor() {
    super("MotoLogDB");

    this.version(1).stores({
      syncQueue: "++id, type, status, createdAt",
      vehicles: "id, make, model, year",
    });

    // v2 adds retry bookkeeping. Items already queued are upgraded in place so
    // a user who was offline across the deploy does not lose their entries.
    this.version(2)
      .stores({
        syncQueue: "++id, type, status, createdAt, nextAttemptAt",
        vehicles: "id, make, model, year",
      })
      .upgrade((tx) =>
        tx
          .table<SyncQueueItem>("syncQueue")
          .toCollection()
          .modify((item) => {
            item.attempts ??= 0;
            item.nextAttemptAt ??= 0;
            // "processing" existed in v1 and could strand an item forever if
            // the tab closed mid-sync; those go back to pending.
            if (item.status !== "failed") item.status = "pending";
          }),
      );
  }
}

export const db = new MotoLogDB();
