import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

/** Columns for the trip list — deliberately excludes the track blob. */
const listSelect = {
  id: true,
  vehicleId: true,
  title: true,
  startedAt: true,
  endedAt: true,
  distanceM: true,
  durationS: true,
  avgSpeedKph: true,
  maxSpeedKph: true,
  maxLeanAngleDeg: true,
  status: true,
} satisfies Prisma.TripSelect;

export interface CreateTripInput {
  vehicleId: string;
  title?: string | null;
  startedAt: Date;
  endedAt: Date;
  distanceM: number;
  durationS: number;
  avgSpeedKph: number | null;
  maxSpeedKph: number | null;
  maxLeanAngleDeg: number | null;
  trackEncoded: string;
  samples: Prisma.InputJsonValue;
}

export const tripRepository = {
  /**
   * Trip list. `trackEncoded` and `samples` are omitted: a track is tens of
   * kilobytes and the list only renders summary figures.
   */
  listForUser(userId: string, limit = 50) {
    return prisma.trip.findMany({
      where: { userId },
      select: listSelect,
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  },

  listForVehicle(vehicleId: string, userId: string, limit = 50) {
    return prisma.trip.findMany({
      where: { vehicleId, userId },
      select: listSelect,
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  },

  /** Full trip including the track, for the detail page. */
  findOwnedById(tripId: string, userId: string) {
    return prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { vehicle: { select: { id: true, make: true, model: true } } },
    });
  },

  create(userId: string, input: CreateTripInput) {
    return prisma.trip.create({
      data: { ...input, userId, status: "completed" },
      select: { id: true },
    });
  },

  async deleteOwned(tripId: string, userId: string) {
    const result = await prisma.trip.deleteMany({ where: { id: tripId, userId } });
    return result.count > 0;
  },

  async renameOwned(tripId: string, userId: string, title: string) {
    const result = await prisma.trip.updateMany({
      where: { id: tripId, userId },
      data: { title },
    });
    return result.count > 0;
  },

  /**
   * Per-rider totals for the group-ride leaderboard.
   *
   * Aggregated in Postgres — the leaderboard compares whole ride histories, so
   * loading trips to sum them in the browser would not scale past a few rides.
   */
  async leaderboard(userIds: string[], since?: Date) {
    if (userIds.length === 0) return [];

    const rows = await prisma.trip.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, ...(since ? { startedAt: { gte: since } } : {}) },
      _sum: { distanceM: true, durationS: true },
      _max: { maxSpeedKph: true },
      _avg: { avgSpeedKph: true },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      userId: row.userId,
      trips: row._count._all,
      distanceM: row._sum.distanceM ?? 0,
      durationS: row._sum.durationS ?? 0,
      avgSpeedKph: row._avg.avgSpeedKph,
      maxSpeedKph: row._max.maxSpeedKph,
    }));
  },
};
