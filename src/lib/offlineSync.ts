import { openDB } from "idb";

const DB_NAME = "motolog_offline";
const STORE_NAME = "sync_queue";

export interface SyncItem {
  id: number;
  actionType: "REFUEL" | "MAINTENANCE";
  payload: Record<string, string>;
  createdAt: string;
}

export async function getDB() {
  if (typeof window === "undefined") return null;
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function addToSyncQueue(
  actionType: "REFUEL" | "MAINTENANCE",
  payload: Record<string, string>
) {
  const db = await getDB();
  if (!db) return;
  await db.add(STORE_NAME, {
    actionType,
    payload,
    createdAt: new Date().toISOString(),
  });
}

export async function getSyncQueue(): Promise<SyncItem[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll(STORE_NAME);
}

export async function clearSyncItem(id: number) {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE_NAME, id);
}
