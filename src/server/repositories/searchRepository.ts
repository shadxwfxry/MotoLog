import { prisma } from "@/server/db";

export interface LogSearchHit {
  id: string;
  date: Date;
  type: "refuel" | "maintenance";
  content: string;
  vehicle: { make: string; model: string };
}

/**
 * Log search.
 *
 * Previously the home page shipped every refuel and maintenance row to the
 * browser so a `String.includes` filter could run over them. This does the
 * matching in Postgres and returns only the handful of rows actually shown.
 */
export const searchRepository = {
  async searchLogs(userId: string, query: string, limit = 5): Promise<LogSearchHit[]> {
    const term = query.trim();
    if (term.length < 2) return [];

    const scope = { vehicle: { userId } };
    const contains = { contains: term, mode: "insensitive" as const };
    const vehicle = { select: { make: true, model: true } };

    const [refuels, maintenance] = await Promise.all([
      prisma.refuelingLog.findMany({
        where: {
          ...scope,
          OR: [{ stationName: contains }, { notes: contains }, { fuelGrade: contains }],
        },
        select: { id: true, date: true, stationName: true, notes: true, vehicle },
        orderBy: { date: "desc" },
        take: limit,
      }),
      prisma.maintenanceLog.findMany({
        where: { ...scope, OR: [{ type: contains }, { description: contains }] },
        select: { id: true, date: true, type: true, description: true, vehicle },
        orderBy: { date: "desc" },
        take: limit,
      }),
    ]);

    const hits: LogSearchHit[] = [
      ...refuels.map((r) => ({
        id: r.id,
        date: r.date,
        type: "refuel" as const,
        content: [r.stationName, r.notes].filter(Boolean).join(" · "),
        vehicle: r.vehicle,
      })),
      ...maintenance.map((m) => ({
        id: m.id,
        date: m.date,
        type: "maintenance" as const,
        content: [m.type, m.description].filter(Boolean).join(": "),
        vehicle: m.vehicle,
      })),
    ];

    return hits.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  },

  /** Recent logs used as grounding context for the AI assistant. */
  async recentLogsForContext(userId: string, limit = 25): Promise<LogSearchHit[]> {
    const scope = { vehicle: { userId } };
    const vehicle = { select: { make: true, model: true } };

    const [refuels, maintenance] = await Promise.all([
      prisma.refuelingLog.findMany({
        where: scope,
        orderBy: { date: "desc" },
        take: limit,
        select: {
          id: true,
          date: true,
          stationName: true,
          cost: true,
          liters: true,
          odometer: true,
          vehicle,
        },
      }),
      prisma.maintenanceLog.findMany({
        where: scope,
        orderBy: { date: "desc" },
        take: limit,
        select: {
          id: true,
          date: true,
          type: true,
          description: true,
          cost: true,
          odometer: true,
          vehicle,
        },
      }),
    ]);

    const hits: LogSearchHit[] = [
      ...refuels.map((r) => ({
        id: r.id,
        date: r.date,
        type: "refuel" as const,
        content: `Station: ${r.stationName || "Unknown"}, Cost: ${r.cost}, Liters: ${r.liters}, Odo: ${r.odometer}`,
        vehicle: r.vehicle,
      })),
      ...maintenance.map((m) => ({
        id: m.id,
        date: m.date,
        type: "maintenance" as const,
        content: `${m.type}: ${m.description || "No description"}, Cost: ${m.cost}, Odo: ${m.odometer}`,
        vehicle: m.vehicle,
      })),
    ];

    return hits.sort((a, b) => b.date.getTime() - a.date.getTime());
  },
};
