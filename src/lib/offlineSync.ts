import { db, type CachedVehicle, type SyncActionType, type SyncPayload } from "./dexie";
import { enqueue } from "@/features/sync/syncQueue";

export type { SyncActionType, SyncPayload };

/** Queues an action to replay once connectivity returns. */
export function addToSyncQueue(actionType: SyncActionType, payload: SyncPayload) {
  return enqueue(actionType, payload);
}

interface CacheableVehicle {
  id: string;
  make: string;
  model: string;
  year: number | string;
  slug?: string;
  engineDisplacement?: number | null;
  photoUrl?: string | null;
  brandName?: string | null;
  refuelingLogs?: { odometer: number }[];
  maintenanceLogs?: { odometer: number }[];
  plannedMaintenances?: unknown[];
  specs?: unknown;
}

/**
 * Refreshes the offline vehicle cache.
 *
 * Replacing the table wholesale is deliberate — a bike deleted on another
 * device must disappear here too — but it now happens inside one transaction
 * with a single bulk write. The previous version cleared the table and then
 * looped one `put` per vehicle, so an interruption mid-loop left the user with
 * a half-empty garage.
 */
export async function cacheVehiclesLocally(vehicles: readonly CacheableVehicle[]) {
  if (typeof window === "undefined") return;

  const rows: CachedVehicle[] = vehicles.map((v) => ({
    id: v.id,
    make: v.make,
    model: v.model,
    year: Number(v.year),
    slug: v.slug ?? v.id,
    engineDisplacement: v.engineDisplacement ?? null,
    photoUrl: v.photoUrl ?? null,
    brandName: v.brandName ?? null,
    refuelingLogs: v.refuelingLogs ?? [],
    maintenanceLogs: v.maintenanceLogs ?? [],
    plannedMaintenances: v.plannedMaintenances ?? [],
    specs: v.specs ?? null,
  }));

  await db.transaction("rw", db.vehicles, async () => {
    await db.vehicles.clear();
    await db.vehicles.bulkPut(rows);
  });
}

export async function getCachedVehicles(): Promise<CachedVehicle[]> {
  if (typeof window === "undefined") return [];
  return db.vehicles.toArray();
}
