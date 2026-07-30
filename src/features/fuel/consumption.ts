/**
 * Fuel consumption and cost math.
 *
 * Single source of truth for the "full-to-full" method: the distance between
 * the first and last refuel is attributed to every litre poured *after* the
 * first one, because the first tank fuelled the distance travelled before we
 * started measuring.
 *
 * These functions are pure so they can run on the server (aggregated rows) and
 * on the client (offline cache) alike.
 */

export interface RefuelSample {
  odometer: number;
  liters: number;
  cost: number;
  pricePerLiter?: number | null;
  stationName?: string | null;
}

export interface Consumption {
  /** Distance between the first and last refuel, in odometer units (km). */
  distance: number;
  /** Litres attributed to that distance — every refuel except the first. */
  liters: number;
  /** Litres per 100 km, or null when there is not enough data. */
  per100: number | null;
}

const EMPTY: Consumption = { distance: 0, liters: 0, per100: null };

/**
 * Full-to-full consumption for a single vehicle.
 *
 * Returns `per100: null` rather than 0 whenever the figure would be
 * meaningless: fewer than two refuels, a non-positive distance (duplicate or
 * rolled-back odometer readings), or no litres after excluding the first tank.
 * Callers must render "—" for null instead of a fabricated zero.
 */
export function calcConsumption(refuels: readonly RefuelSample[]): Consumption {
  if (refuels.length < 2) return EMPTY;

  // Defensive copy: callers pass rows ordered by date, which is not necessarily
  // odometer order (logs can be back-filled).
  const sorted = [...refuels].sort((a, b) => a.odometer - b.odometer);

  const distance = sorted[sorted.length - 1].odometer - sorted[0].odometer;
  if (distance <= 0) return EMPTY;

  const liters = sorted.slice(1).reduce((sum, r) => sum + r.liters, 0);
  if (liters <= 0) return EMPTY;

  return { distance, liters, per100: (liters / distance) * 100 };
}

/**
 * Fleet-wide consumption: distances and litres are pooled across vehicles
 * before dividing, so a bike with more mileage weighs proportionally more.
 * Averaging each bike's per100 instead would over-weight rarely used bikes.
 */
export function calcFleetConsumption(
  refuelsByVehicle: Iterable<readonly RefuelSample[]>,
): Consumption {
  let distance = 0;
  let liters = 0;

  for (const refuels of refuelsByVehicle) {
    const c = calcConsumption(refuels);
    if (c.per100 === null) continue;
    distance += c.distance;
    liters += c.liters;
  }

  if (distance <= 0 || liters <= 0) return EMPTY;
  return { distance, liters, per100: (liters / distance) * 100 };
}

/**
 * The same rule as `calcConsumption`, expressed over SQL aggregates.
 *
 * The dashboard cannot ship every row to the client just to divide two numbers,
 * so Postgres does the summing and this reassembles the result. It must stay
 * in lockstep with `calcConsumption` — the tests assert both agree on the same
 * data.
 */
export interface FuelAggregate {
  /** Number of refuels; fewer than two makes consumption unmeasurable. */
  logCount: number;
  minOdometer: number;
  maxOdometer: number;
  totalLiters: number;
  /** Litres in the earliest tank, excluded for the same reason as above. */
  firstLiters: number;
}

export function calcConsumptionFromAggregates(
  aggregates: readonly FuelAggregate[],
): Consumption {
  let distance = 0;
  let liters = 0;

  for (const a of aggregates) {
    if (a.logCount < 2) continue;
    const vehicleDistance = a.maxOdometer - a.minOdometer;
    const vehicleLiters = a.totalLiters - a.firstLiters;
    if (vehicleDistance <= 0 || vehicleLiters <= 0) continue;
    distance += vehicleDistance;
    liters += vehicleLiters;
  }

  if (distance <= 0 || liters <= 0) return EMPTY;
  return { distance, liters, per100: (liters / distance) * 100 };
}

export interface FuelTotals {
  totalCost: number;
  totalLiters: number;
  /** Cost-weighted average price per litre, or null when nothing was poured. */
  avgPricePerLiter: number | null;
}

export function calcFuelTotals(refuels: readonly RefuelSample[]): FuelTotals {
  let totalCost = 0;
  let totalLiters = 0;

  for (const r of refuels) {
    totalCost += r.cost;
    totalLiters += r.liters;
  }

  return {
    totalCost,
    totalLiters,
    avgPricePerLiter: totalLiters > 0 ? totalCost / totalLiters : null,
  };
}

export interface StationSummary {
  station: string;
  count: number;
  cost: number;
  liters: number;
}

/**
 * Spend per fuel station, busiest first. Rows without a station name are
 * bucketed under `unknownLabel` so the caller controls the wording (i18n).
 */
export function groupByStation(
  refuels: readonly RefuelSample[],
  unknownLabel: string,
): StationSummary[] {
  const map = new Map<string, StationSummary>();

  for (const r of refuels) {
    const station = r.stationName?.trim() || unknownLabel;
    const entry = map.get(station) ?? { station, count: 0, cost: 0, liters: 0 };
    entry.count += 1;
    entry.cost += r.cost;
    entry.liters += r.liters;
    map.set(station, entry);
  }

  return [...map.values()].sort((a, b) => b.count - a.count || b.cost - a.cost);
}
