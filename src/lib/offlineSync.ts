import { db } from "./dexie";

export interface SyncItem {
  id: number;
  actionType: "ADD_VEHICLE" | "REFUEL" | "MAINTENANCE";
  payload: Record<string, string>;
  createdAt: string;
}

export async function addToSyncQueue(
  actionType: "ADD_VEHICLE" | "REFUEL" | "MAINTENANCE",
  payload: Record<string, string>
) {
  if (typeof window === "undefined") return;
  await db.syncQueue.add({
    type: actionType,
    payload,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}

export async function getSyncQueue(): Promise<SyncItem[]> {
  if (typeof window === "undefined") return [];
  const items = await db.syncQueue.toArray();
  return items.map((item) => ({
    id: item.id!,
    actionType: item.type as "ADD_VEHICLE" | "REFUEL" | "MAINTENANCE",
    payload: item.payload,
    createdAt: item.createdAt,
  }));
}

export async function clearSyncItem(id: number) {
  if (typeof window === "undefined") return;
  await db.syncQueue.delete(id);
}

// ── Caching Vehicles & Logs Locally ──
export async function cacheVehiclesLocally(vehicles: any[]) {
  if (typeof window === "undefined") return;
  // Clear old cache and update with latest hydrated objects
  await db.vehicles.clear();
  for (const v of vehicles) {
    await db.vehicles.put({
      id: v.id,
      make: v.make,
      model: v.model,
      year: Number(v.year),
      engineDisplacement: v.engineDisplacement,
      photoUrl: v.photoUrl,
      brandName: v.brandName,
      refuelingLogs: v.refuelingLogs || [],
      maintenanceLogs: v.maintenanceLogs || [],
      plannedMaintenances: v.plannedMaintenances || [],
      specs: v.specs || null,
    });
  }
}

export async function getCachedVehicles() {
  if (typeof window === "undefined") return [];
  return db.vehicles.toArray();
}
