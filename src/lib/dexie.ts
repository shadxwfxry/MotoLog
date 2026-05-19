import Dexie, { type EntityTable } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'failed';
  createdAt: string;
}

export interface CachedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  engineDisplacement?: number | null;
  photoUrl?: string | null;
  brandName?: string | null;
  refuelingLogs?: any[];
  maintenanceLogs?: any[];
  plannedMaintenances?: any[];
  specs?: any;
}

export class MotoLogDB extends Dexie {
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  vehicles!: EntityTable<CachedVehicle, 'id'>;

  constructor() {
    super('MotoLogDB');
    this.version(1).stores({
      syncQueue: '++id, type, status, createdAt',
      vehicles: 'id, make, model, year'
    });
  }
}

export const db = new MotoLogDB();
