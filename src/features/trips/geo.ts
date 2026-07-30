/**
 * Geospatial maths for ride tracking.
 *
 * Pure and dependency-free so it can run in the recording hook, in the offline
 * replay path, and under test without a browser.
 */

export interface GeoFix {
  lat: number;
  lon: number;
  /** Epoch milliseconds. */
  t: number;
  /** Horizontal accuracy in metres, as reported by the Geolocation API. */
  accuracyM?: number | null;
  /** Device-reported speed in m/s; null when the platform omits it. */
  speedMps?: number | null;
  altitudeM?: number | null;
  headingDeg?: number | null;
}

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance in metres.
 *
 * Haversine rather than the equirectangular approximation: motorcycle GPS fixes
 * arrive a few metres apart, where the cheap approximation's error is a
 * meaningful fraction of the step and accumulates across thousands of samples.
 */
export function haversineM(a: GeoFix, b: GeoFix): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Speed between two fixes in km/h, or null when no time elapsed. */
export function speedBetweenKph(a: GeoFix, b: GeoFix): number | null {
  const seconds = (b.t - a.t) / 1000;
  if (seconds <= 0) return null;
  return (haversineM(a, b) / seconds) * 3.6;
}

export interface FilterOptions {
  /** Fixes less precise than this are dropped outright. */
  maxAccuracyM: number;
  /** A step implying more than this is treated as a GPS jump, not travel. */
  maxSpeedKph: number;
  /** Steps shorter than this are treated as standstill jitter. */
  minStepM: number;
}

export const DEFAULT_FILTER: FilterOptions = {
  // Consumer GPS under trees or between buildings routinely reports 20-50m.
  maxAccuracyM: 30,
  // Faster than any road-legal bike sustains; such a step is a fix jump.
  maxSpeedKph: 300,
  // A stationary receiver wanders by a few metres; without this the odometer
  // creeps upward while parked at a light.
  minStepM: 3,
};

/**
 * Drops fixes that would corrupt the track.
 *
 * Always keeps the first acceptable fix so a trip has an origin, then admits a
 * fix only if it is precise enough, far enough from the last kept one to be
 * real movement, and reachable at a plausible speed.
 */
export function filterFixes(
  fixes: readonly GeoFix[],
  options: FilterOptions = DEFAULT_FILTER,
): GeoFix[] {
  const kept: GeoFix[] = [];

  for (const fix of fixes) {
    if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lon)) continue;
    if (fix.accuracyM != null && fix.accuracyM > options.maxAccuracyM) continue;

    const previous = kept[kept.length - 1];
    if (!previous) {
      kept.push(fix);
      continue;
    }

    // Out-of-order fixes would produce negative time steps and NaN speeds.
    if (fix.t <= previous.t) continue;

    const stepM = haversineM(previous, fix);
    if (stepM < options.minStepM) continue;

    const kph = speedBetweenKph(previous, fix);
    if (kph !== null && kph > options.maxSpeedKph) continue;

    kept.push(fix);
  }

  return kept;
}

export interface TripStats {
  /** Metres travelled. */
  distanceM: number;
  /** Seconds between the first and last fix. */
  durationS: number;
  avgSpeedKph: number | null;
  maxSpeedKph: number | null;
  /** Per-fix speed in km/h, aligned with the input array. */
  speedsKph: number[];
}

/**
 * Distance, duration and speeds for an already-filtered track.
 *
 * Speed is taken from the device when it reports one — a GPS receiver's Doppler
 * speed is far steadier than differentiating positions — and derived from the
 * positions otherwise.
 */
export function calcTripStats(fixes: readonly GeoFix[]): TripStats {
  if (fixes.length === 0) {
    return { distanceM: 0, durationS: 0, avgSpeedKph: null, maxSpeedKph: null, speedsKph: [] };
  }

  const speedsKph: number[] = [];
  let distanceM = 0;

  for (let i = 0; i < fixes.length; i++) {
    const fix = fixes[i];

    if (i > 0) distanceM += haversineM(fixes[i - 1], fix);

    if (fix.speedMps != null && Number.isFinite(fix.speedMps) && fix.speedMps >= 0) {
      speedsKph.push(fix.speedMps * 3.6);
    } else if (i > 0) {
      speedsKph.push(speedBetweenKph(fixes[i - 1], fix) ?? 0);
    } else {
      speedsKph.push(0);
    }
  }

  const durationS = Math.max(0, (fixes[fixes.length - 1].t - fixes[0].t) / 1000);

  return {
    distanceM,
    durationS,
    // Average over elapsed time, including stops — this is journey speed, which
    // is what the rider compares between rides.
    avgSpeedKph: durationS > 0 ? (distanceM / durationS) * 3.6 : null,
    maxSpeedKph: speedsKph.length > 0 ? Math.max(...speedsKph) : null,
    speedsKph,
  };
}

/** Bounding box for fitting a map to a track. */
export function boundsOf(fixes: readonly GeoFix[]) {
  if (fixes.length === 0) return null;

  let minLat = fixes[0].lat;
  let maxLat = fixes[0].lat;
  let minLon = fixes[0].lon;
  let maxLon = fixes[0].lon;

  for (const f of fixes) {
    if (f.lat < minLat) minLat = f.lat;
    if (f.lat > maxLat) maxLat = f.lat;
    if (f.lon < minLon) minLon = f.lon;
    if (f.lon > maxLon) maxLon = f.lon;
  }

  return { minLat, maxLat, minLon, maxLon };
}
