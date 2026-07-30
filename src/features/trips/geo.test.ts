import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTER,
  boundsOf,
  calcTripStats,
  filterFixes,
  haversineM,
  speedBetweenKph,
  type GeoFix,
} from "./geo";

const fix = (lat: number, lon: number, t: number, extra: Partial<GeoFix> = {}): GeoFix => ({
  lat,
  lon,
  t,
  ...extra,
});

describe("haversineM", () => {
  it("matches a known distance", () => {
    // Kyiv Maidan → Lviv Rynok, ~468 km by great circle.
    const kyiv = fix(50.4501, 30.5234, 0);
    const lviv = fix(49.8397, 24.0297, 0);

    expect(haversineM(kyiv, lviv) / 1000).toBeCloseTo(468, 0);
  });

  it("is zero for identical points", () => {
    expect(haversineM(fix(50, 30, 0), fix(50, 30, 1000))).toBe(0);
  });

  it("is symmetric", () => {
    const a = fix(50.45, 30.52, 0);
    const b = fix(50.46, 30.53, 0);

    expect(haversineM(a, b)).toBeCloseTo(haversineM(b, a), 9);
  });

  it("handles one degree of latitude", () => {
    // A degree of latitude is ~111.2 km anywhere on Earth.
    expect(haversineM(fix(50, 30, 0), fix(51, 30, 0)) / 1000).toBeCloseTo(111.2, 0);
  });
});

describe("speedBetweenKph", () => {
  it("derives speed from distance and time", () => {
    // ~111.2 m north in 10 s ≈ 40 km/h.
    const a = fix(50, 30, 0);
    const b = fix(50.001, 30, 10_000);

    expect(speedBetweenKph(a, b)).toBeCloseTo(40, 0);
  });

  it("returns null when no time passed, rather than Infinity", () => {
    expect(speedBetweenKph(fix(50, 30, 1000), fix(50.001, 30, 1000))).toBeNull();
  });
});

describe("filterFixes", () => {
  it("drops imprecise fixes", () => {
    const fixes = [
      fix(50, 30, 0, { accuracyM: 5 }),
      fix(50.001, 30, 10_000, { accuracyM: 500 }),
      fix(50.002, 30, 20_000, { accuracyM: 8 }),
    ];

    expect(filterFixes(fixes)).toHaveLength(2);
  });

  it("keeps a fix with unknown accuracy", () => {
    const fixes = [fix(50, 30, 0), fix(50.001, 30, 10_000)];

    expect(filterFixes(fixes)).toHaveLength(2);
  });

  it("discards standstill jitter so a parked bike gains no distance", () => {
    // Roughly 1 m of wander, below the 3 m floor.
    const fixes = [
      fix(50, 30, 0),
      fix(50.00001, 30, 5_000),
      fix(50.00002, 30.00001, 10_000),
    ];

    expect(filterFixes(fixes)).toHaveLength(1);
    expect(calcTripStats(filterFixes(fixes)).distanceM).toBe(0);
  });

  it("rejects a teleport that implies an impossible speed", () => {
    const fixes = [
      fix(50, 30, 0),
      fix(51, 30, 1_000), // 111 km in one second
      fix(50.001, 30, 10_000),
    ];
    const kept = filterFixes(fixes);

    expect(kept).toHaveLength(2);
    expect(kept[1].lat).toBeCloseTo(50.001, 6);
  });

  it("ignores out-of-order and duplicate timestamps", () => {
    const fixes = [fix(50, 30, 10_000), fix(50.001, 30, 5_000), fix(50.002, 30, 10_000)];

    expect(filterFixes(fixes)).toHaveLength(1);
  });

  it("skips non-finite coordinates", () => {
    const fixes = [fix(Number.NaN, 30, 0), fix(50, 30, 10_000)];
    const kept = filterFixes(fixes);

    expect(kept).toHaveLength(1);
    expect(kept[0].lat).toBe(50);
  });

  it("returns an empty track for no input", () => {
    expect(filterFixes([])).toEqual([]);
  });

  it("respects custom thresholds", () => {
    const fixes = [fix(50, 30, 0, { accuracyM: 40 }), fix(50.001, 30, 10_000, { accuracyM: 40 })];

    expect(filterFixes(fixes, DEFAULT_FILTER)).toHaveLength(0);
    expect(filterFixes(fixes, { ...DEFAULT_FILTER, maxAccuracyM: 50 })).toHaveLength(2);
  });
});

describe("calcTripStats", () => {
  it("sums distance and elapsed time", () => {
    const fixes = [fix(50, 30, 0), fix(50.001, 30, 10_000), fix(50.002, 30, 20_000)];
    const stats = calcTripStats(fixes);

    expect(stats.distanceM).toBeCloseTo(222.4, 0);
    expect(stats.durationS).toBe(20);
    expect(stats.avgSpeedKph).toBeCloseTo(40, 0);
  });

  it("prefers the device's own speed over differentiating positions", () => {
    // Positions imply ~40 km/h but the receiver reports 100 km/h (27.78 m/s).
    const fixes = [
      fix(50, 30, 0, { speedMps: 27.78 }),
      fix(50.001, 30, 10_000, { speedMps: 27.78 }),
    ];

    expect(calcTripStats(fixes).maxSpeedKph).toBeCloseTo(100, 0);
  });

  it("falls back to positional speed when the device reports none", () => {
    const fixes = [fix(50, 30, 0), fix(50.001, 30, 10_000)];

    expect(calcTripStats(fixes).maxSpeedKph).toBeCloseTo(40, 0);
  });

  it("ignores a negative device speed", () => {
    const fixes = [fix(50, 30, 0, { speedMps: -1 }), fix(50.001, 30, 10_000, { speedMps: -1 })];

    expect(calcTripStats(fixes).maxSpeedKph).toBeCloseTo(40, 0);
  });

  it("averages over elapsed time including stops", () => {
    // 111 m of travel, then a 90 s stop: journey speed, not moving speed.
    const fixes = [fix(50, 30, 0), fix(50.001, 30, 10_000), fix(50.001, 30, 100_000)];
    const stats = calcTripStats(fixes);

    expect(stats.durationS).toBe(100);
    expect(stats.avgSpeedKph).toBeCloseTo(4, 0);
  });

  it("returns nulls for an empty track instead of NaN", () => {
    const stats = calcTripStats([]);

    expect(stats).toEqual({
      distanceM: 0,
      durationS: 0,
      avgSpeedKph: null,
      maxSpeedKph: null,
      speedsKph: [],
    });
  });

  it("handles a single fix", () => {
    const stats = calcTripStats([fix(50, 30, 0)]);

    expect(stats.distanceM).toBe(0);
    expect(stats.durationS).toBe(0);
    expect(stats.avgSpeedKph).toBeNull();
  });

  it("emits one speed sample per fix, so charts align with the track", () => {
    const fixes = [fix(50, 30, 0), fix(50.001, 30, 10_000), fix(50.002, 30, 20_000)];

    expect(calcTripStats(fixes).speedsKph).toHaveLength(fixes.length);
  });
});

describe("boundsOf", () => {
  it("spans every point", () => {
    const bounds = boundsOf([fix(50, 30, 0), fix(51, 29, 0), fix(49, 31, 0)]);

    expect(bounds).toEqual({ minLat: 49, maxLat: 51, minLon: 29, maxLon: 31 });
  });

  it("is null for an empty track", () => {
    expect(boundsOf([])).toBeNull();
  });
});
