import { prisma } from "@/server/db";
import {
  calcConsumptionFromAggregates,
  type Consumption,
} from "@/features/fuel/consumption";

export interface VehicleFuelAggregate {
  vehicleId: string;
  totalCost: number;
  totalLiters: number;
  logCount: number;
  minOdometer: number;
  maxOdometer: number;
  /** Litres in the earliest tank — excluded from full-to-full consumption. */
  firstLiters: number;
}

export interface CategorySummary {
  category: string;
  count: number;
  cost: number;
}

export interface VehicleSpendSummary {
  vehicleId: string;
  fuel: number;
  maintenance: number;
}

export interface StationSummary {
  station: string | null;
  count: number;
  cost: number;
  liters: number;
}

export interface FleetStats {
  fuel: { totalCost: number; totalLiters: number; avgPricePerLiter: number | null };
  maintenance: { totalCost: number; byCategory: CategorySummary[] };
  consumption: Consumption;
  byVehicle: VehicleSpendSummary[];
  byStation: StationSummary[];
}

const EMPTY_STATS: FleetStats = {
  fuel: { totalCost: 0, totalLiters: 0, avgPricePerLiter: null },
  maintenance: { totalCost: 0, byCategory: [] },
  consumption: { distance: 0, liters: 0, per100: null },
  byVehicle: [],
  byStation: [],
};

/**
 * Dashboard statistics, aggregated in Postgres.
 *
 * The pages this replaces fetched every refuel and maintenance row for every
 * vehicle — each with a joined `vehicle` — and summed them in the browser, so
 * payload and render cost grew without bound as the log filled up. These are
 * five GROUP BY queries whose result size depends on the number of vehicles,
 * stations and categories, not on the number of logs.
 */
export const statsRepository = {
  async getFleetStats(vehicleIds: string[]): Promise<FleetStats> {
    if (vehicleIds.length === 0) return EMPTY_STATS;

    const scope = { vehicleId: { in: vehicleIds } };

    const [fuelByVehicle, firstRefuels, maintByVehicle, maintByCategory, byStation] =
      await Promise.all([
        prisma.refuelingLog.groupBy({
          by: ["vehicleId"],
          where: scope,
          _sum: { cost: true, liters: true },
          _min: { odometer: true },
          _max: { odometer: true },
          _count: { _all: true },
        }),
        // `distinct` on an odometer-ascending scan yields the earliest refuel per
        // vehicle in a single query, avoiding a per-vehicle N+1.
        prisma.refuelingLog.findMany({
          where: scope,
          orderBy: { odometer: "asc" },
          distinct: ["vehicleId"],
          select: { vehicleId: true, liters: true },
        }),
        prisma.maintenanceLog.groupBy({
          by: ["vehicleId"],
          where: scope,
          _sum: { cost: true },
        }),
        prisma.maintenanceLog.groupBy({
          by: ["category"],
          where: scope,
          _sum: { cost: true },
          _count: { _all: true },
        }),
        prisma.refuelingLog.groupBy({
          by: ["stationName"],
          where: scope,
          _sum: { cost: true, liters: true },
          _count: { _all: true },
        }),
      ]);

    const firstLitersByVehicle = new Map(firstRefuels.map((r) => [r.vehicleId, r.liters]));

    const aggregates: VehicleFuelAggregate[] = fuelByVehicle.map((row) => ({
      vehicleId: row.vehicleId,
      totalCost: row._sum.cost ?? 0,
      totalLiters: row._sum.liters ?? 0,
      logCount: row._count._all,
      minOdometer: row._min.odometer ?? 0,
      maxOdometer: row._max.odometer ?? 0,
      firstLiters: firstLitersByVehicle.get(row.vehicleId) ?? 0,
    }));

    const totalCost = aggregates.reduce((s, a) => s + a.totalCost, 0);
    const totalLiters = aggregates.reduce((s, a) => s + a.totalLiters, 0);

    const spend = new Map<string, VehicleSpendSummary>();
    for (const a of aggregates) {
      spend.set(a.vehicleId, { vehicleId: a.vehicleId, fuel: a.totalCost, maintenance: 0 });
    }
    for (const row of maintByVehicle) {
      const entry = spend.get(row.vehicleId) ?? {
        vehicleId: row.vehicleId,
        fuel: 0,
        maintenance: 0,
      };
      entry.maintenance = row._sum.cost ?? 0;
      spend.set(row.vehicleId, entry);
    }

    return {
      fuel: {
        totalCost,
        totalLiters,
        avgPricePerLiter: totalLiters > 0 ? totalCost / totalLiters : null,
      },
      maintenance: {
        totalCost: maintByCategory.reduce((s, r) => s + (r._sum.cost ?? 0), 0),
        byCategory: maintByCategory
          .map((r) => ({
            category: r.category,
            count: r._count._all,
            cost: r._sum.cost ?? 0,
          }))
          .sort((a, b) => b.cost - a.cost),
      },
      consumption: calcConsumptionFromAggregates(aggregates),
      byVehicle: [...spend.values()].sort(
        (a, b) => b.fuel + b.maintenance - (a.fuel + a.maintenance),
      ),
      byStation: byStation
        .map((r) => ({
          station: r.stationName,
          count: r._count._all,
          cost: r._sum.cost ?? 0,
          liters: r._sum.liters ?? 0,
        }))
        .sort((a, b) => b.count - a.count),
    };
  },

  /** Per-vehicle aggregate for the vehicle detail page. */
  async getVehicleStats(vehicleId: string) {
    const [fuel, firstRefuel, maintenance] = await Promise.all([
      prisma.refuelingLog.aggregate({
        where: { vehicleId },
        _sum: { cost: true, liters: true },
        _min: { odometer: true },
        _max: { odometer: true },
        _count: { _all: true },
      }),
      prisma.refuelingLog.findFirst({
        where: { vehicleId },
        orderBy: { odometer: "asc" },
        select: { liters: true },
      }),
      prisma.maintenanceLog.aggregate({
        where: { vehicleId },
        _sum: { cost: true },
        _max: { odometer: true },
      }),
    ]);

    const aggregate: VehicleFuelAggregate = {
      vehicleId,
      totalCost: fuel._sum.cost ?? 0,
      totalLiters: fuel._sum.liters ?? 0,
      logCount: fuel._count._all,
      minOdometer: fuel._min.odometer ?? 0,
      maxOdometer: fuel._max.odometer ?? 0,
      firstLiters: firstRefuel?.liters ?? 0,
    };

    return {
      fuelTotal: aggregate.totalCost,
      totalLiters: aggregate.totalLiters,
      maintenanceTotal: maintenance._sum.cost ?? 0,
      consumption: calcConsumptionFromAggregates([aggregate]),
      // Both log types are odometer readings; the highest wins.
      currentOdometer: Math.max(aggregate.maxOdometer, maintenance._max.odometer ?? 0),
    };
  },
};
