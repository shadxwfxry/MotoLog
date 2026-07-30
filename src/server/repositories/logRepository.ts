import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export interface CursorPage {
  /** Id of the last row on the previous page; omit for the first page. */
  cursor?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 20;

/**
 * Cursor pagination over a `date desc, id desc` ordering.
 *
 * Offset pagination would be wrong here: rows are inserted with arbitrary
 * dates (logs get back-filled), so an offset shifts under the reader. `id` is
 * the tiebreaker because several logs commonly share one date.
 */
function paginate({ cursor, limit = DEFAULT_LIMIT }: CursorPage) {
  return {
    take: limit + 1, // one extra row tells us whether another page exists
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ date: "desc" as const }, { id: "desc" as const }],
  };
}

function toPage<T extends { id: string }>(rows: T[], limit = DEFAULT_LIMIT) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export const refuelRepository = {
  listByVehicle(vehicleId: string, page: CursorPage = {}) {
    const limit = page.limit ?? DEFAULT_LIMIT;
    return prisma.refuelingLog
      .findMany({ where: { vehicleId }, ...paginate({ ...page, limit }) })
      .then((rows) => toPage(rows, limit));
  },

  /** Every refuel for a vehicle, odometer-ascending — the consumption input. */
  listForConsumption(vehicleIds: string[]) {
    if (vehicleIds.length === 0) return Promise.resolve([]);
    return prisma.refuelingLog.findMany({
      where: { vehicleId: { in: vehicleIds } },
      select: { vehicleId: true, odometer: true, liters: true, cost: true },
      orderBy: { odometer: "asc" },
    });
  },

  create(vehicleId: string, data: Omit<Prisma.RefuelingLogCreateInput, "vehicle">) {
    return prisma.refuelingLog.create({ data: { ...data, vehicleId } });
  },

  findOwned(logId: string, userId: string) {
    return prisma.refuelingLog.findFirst({
      where: { id: logId, vehicle: { userId } },
      select: { id: true, vehicleId: true },
    });
  },

  deleteById(logId: string) {
    return prisma.refuelingLog.delete({ where: { id: logId } });
  },

  setPublic(logId: string, isPublic: boolean) {
    return prisma.refuelingLog.update({ where: { id: logId }, data: { isPublic } });
  },
};

export const maintenanceRepository = {
  listByVehicle(vehicleId: string, page: CursorPage = {}) {
    const limit = page.limit ?? DEFAULT_LIMIT;
    return prisma.maintenanceLog
      .findMany({
        where: { vehicleId },
        include: { parts: true },
        ...paginate({ ...page, limit }),
      })
      .then((rows) => toPage(rows, limit));
  },

  create(vehicleId: string, data: Omit<Prisma.MaintenanceLogCreateInput, "vehicle">) {
    return prisma.maintenanceLog.create({ data: { ...data, vehicleId } });
  },

  findOwned(logId: string, userId: string) {
    return prisma.maintenanceLog.findFirst({
      where: { id: logId, vehicle: { userId } },
      select: { id: true, vehicleId: true },
    });
  },

  deleteById(logId: string) {
    return prisma.maintenanceLog.delete({ where: { id: logId } });
  },

  setPublic(logId: string, isPublic: boolean) {
    return prisma.maintenanceLog.update({ where: { id: logId }, data: { isPublic } });
  },
};

export const plannedMaintenanceRepository = {
  create(vehicleId: string, data: Omit<Prisma.PlannedMaintenanceCreateInput, "vehicle">) {
    return prisma.plannedMaintenance.create({ data: { ...data, vehicleId } });
  },

  findOwned(id: string, userId: string) {
    return prisma.plannedMaintenance.findFirst({
      where: { id, vehicle: { userId } },
      select: { id: true, vehicleId: true },
    });
  },

  markCompleted(id: string) {
    return prisma.plannedMaintenance.update({ where: { id }, data: { isCompleted: true } });
  },

  deleteById(id: string) {
    return prisma.plannedMaintenance.delete({ where: { id } });
  },
};
