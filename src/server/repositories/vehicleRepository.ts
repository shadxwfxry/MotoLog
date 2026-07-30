import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

/** Columns needed to render a garage card — deliberately not the whole row. */
const cardSelect = {
  id: true,
  make: true,
  model: true,
  year: true,
  brandName: true,
  photoUrl: true,
  slug: true,
  engineDisplacement: true,
} satisfies Prisma.VehicleSelect;

export const vehicleRepository = {
  findOwnerId(vehicleId: string) {
    return prisma.vehicle
      .findUnique({ where: { id: vehicleId }, select: { userId: true } })
      .then((v) => v?.userId ?? null);
  },

  /**
   * Garage list. The odometer is the highest reading across *both* log types —
   * the previous query took only the latest refuel, so a bike whose most recent
   * event was a service showed a stale odometer.
   */
  listForGarage(userId: string) {
    return prisma.vehicle.findMany({
      where: { userId },
      select: {
        ...cardSelect,
        refuelingLogs: { orderBy: { odometer: "desc" }, take: 1, select: { odometer: true } },
        maintenanceLogs: { orderBy: { odometer: "desc" }, take: 1, select: { odometer: true } },
      },
      orderBy: { year: "desc" },
    });
  },

  /** Home screen: vehicles plus their open reminders and latest odometer readings. */
  listWithReminders(userId: string) {
    return prisma.vehicle.findMany({
      where: { userId },
      select: {
        ...cardSelect,
        specs: true,
        refuelingLogs: { orderBy: { odometer: "desc" }, take: 1, select: { odometer: true } },
        maintenanceLogs: { orderBy: { odometer: "desc" }, take: 1, select: { odometer: true } },
        plannedMaintenances: {
          where: { isCompleted: false },
          orderBy: [{ targetOdometer: "asc" }, { targetDate: "asc" }],
        },
      },
      orderBy: { year: "desc" },
    });
  },

  /** Vehicle detail, scoped to the owner so a wrong id 404s rather than leaking. */
  findOwnedById(vehicleId: string, userId: string) {
    return prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      include: {
        plannedMaintenances: { orderBy: { isCompleted: "asc" } },
      },
    });
  },

  findPublicBySlug(slug: string, logLimit = 10) {
    return prisma.vehicle.findFirst({
      where: { slug, isPublic: true },
      include: {
        refuelingLogs: { where: { isPublic: true }, orderBy: { date: "desc" }, take: logLimit },
        maintenanceLogs: { where: { isPublic: true }, orderBy: { date: "desc" }, take: logLimit },
      },
    });
  },

  /** Public QR/tournament lookup — exposes only presentational fields. */
  findPublicCard(vehicleId: string) {
    return prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        brandName: true,
        model: true,
        photoUrl: true,
        user: { select: { name: true } },
      },
    });
  },

  /** Full log history for CSV/PDF export, oldest first. */
  findOwnedForExport(vehicleId: string, userId: string) {
    return prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      include: {
        refuelingLogs: { orderBy: { date: "asc" } },
        maintenanceLogs: { orderBy: { date: "asc" }, include: { parts: true } },
      },
    });
  },

  create(userId: string, data: Prisma.VehicleCreateWithoutUserInput) {
    return prisma.vehicle.create({ data: { ...data, userId } });
  },

  /**
   * Scoped update. Returns false when nothing matched, which means the vehicle
   * is missing *or* not owned — the caller must not distinguish the two.
   */
  async updateOwned(vehicleId: string, userId: string, data: Prisma.VehicleUpdateInput) {
    const result = await prisma.vehicle.updateMany({
      where: { id: vehicleId, userId },
      data,
    });
    return result.count > 0;
  },

  async deleteOwned(vehicleId: string, userId: string) {
    const result = await prisma.vehicle.deleteMany({ where: { id: vehicleId, userId } });
    return result.count > 0;
  },

  /** Wipes both log types for a vehicle in one transaction. */
  clearLogs(vehicleId: string, userId: string) {
    return prisma.$transaction([
      prisma.refuelingLog.deleteMany({ where: { vehicleId, vehicle: { userId } } }),
      prisma.maintenanceLog.deleteMany({ where: { vehicleId, vehicle: { userId } } }),
    ]);
  },
};
