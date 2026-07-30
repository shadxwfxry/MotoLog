import { describe, expect, it } from "vitest";
import {
  calcConsumption,
  calcFleetConsumption,
  calcFuelTotals,
  groupByStation,
  type RefuelSample,
} from "./consumption";

const refuel = (odometer: number, liters: number, extra: Partial<RefuelSample> = {}): RefuelSample => ({
  odometer,
  liters,
  cost: liters * 50,
  ...extra,
});

describe("calcConsumption", () => {
  it("attributes distance to every tank except the first", () => {
    // 1000 km covered, 60 L poured after the first tank → 6 L/100km.
    const result = calcConsumption([refuel(10_000, 20), refuel(10_500, 30), refuel(11_000, 30)]);

    expect(result.distance).toBe(1000);
    expect(result.liters).toBe(60);
    expect(result.per100).toBeCloseTo(6, 10);
  });

  it("sorts by odometer, so back-filled logs give the same answer", () => {
    const ordered = [refuel(10_000, 20), refuel(10_500, 30), refuel(11_000, 30)];
    const shuffled = [ordered[2], ordered[0], ordered[1]];

    expect(calcConsumption(shuffled)).toEqual(calcConsumption(ordered));
  });

  it("does not mutate the caller's array", () => {
    const input = [refuel(11_000, 30), refuel(10_000, 20)];
    calcConsumption(input);

    expect(input[0].odometer).toBe(11_000);
  });

  it("ignores the zero-litre seed row created when a vehicle is added", () => {
    // addVehicle writes an "Initial Odometer" row with liters: 0.
    const result = calcConsumption([refuel(10_000, 0), refuel(10_400, 20)]);

    expect(result.distance).toBe(400);
    expect(result.liters).toBe(20);
    expect(result.per100).toBeCloseTo(5, 10);
  });

  it("returns null for a single refuel", () => {
    expect(calcConsumption([refuel(10_000, 20)]).per100).toBeNull();
  });

  it("returns null for no refuels", () => {
    expect(calcConsumption([]).per100).toBeNull();
  });

  it("returns null when the odometer never moved", () => {
    expect(calcConsumption([refuel(10_000, 20), refuel(10_000, 15)]).per100).toBeNull();
  });

  it("returns null when only the first tank had litres", () => {
    expect(calcConsumption([refuel(10_000, 20), refuel(10_500, 0)]).per100).toBeNull();
  });
});

describe("calcFleetConsumption", () => {
  it("pools distance and litres so mileage weighs the average", () => {
    const thirsty = [refuel(0, 0), refuel(1000, 100)]; // 10 L/100km over 1000 km
    const frugal = [refuel(0, 0), refuel(100, 2)]; //      2 L/100km over 100 km

    const result = calcFleetConsumption([thirsty, frugal]);

    // 102 L over 1100 km ≈ 9.27, not the naive mean of 6.
    expect(result.distance).toBe(1100);
    expect(result.liters).toBe(102);
    expect(result.per100).toBeCloseTo(9.2727, 3);
  });

  it("skips vehicles that cannot be measured yet", () => {
    const measurable = [refuel(0, 0), refuel(1000, 50)];
    const singleLog = [refuel(5000, 20)];

    expect(calcFleetConsumption([measurable, singleLog])).toEqual(calcConsumption(measurable));
  });

  it("returns null when nothing is measurable", () => {
    expect(calcFleetConsumption([[refuel(10_000, 20)], []]).per100).toBeNull();
  });
});

describe("calcFuelTotals", () => {
  it("weights average price by volume, not by refuel count", () => {
    const totals = calcFuelTotals([
      { odometer: 0, liters: 10, cost: 500 }, //  50 / L
      { odometer: 100, liters: 40, cost: 2400 }, // 60 / L
    ]);

    expect(totals.totalCost).toBe(2900);
    expect(totals.totalLiters).toBe(50);
    expect(totals.avgPricePerLiter).toBeCloseTo(58, 10); // not 55
  });

  it("returns null average when no fuel was poured", () => {
    expect(calcFuelTotals([]).avgPricePerLiter).toBeNull();
    expect(calcFuelTotals([{ odometer: 0, liters: 0, cost: 0 }]).avgPricePerLiter).toBeNull();
  });
});

describe("groupByStation", () => {
  it("aggregates per station, busiest first", () => {
    const rows = groupByStation(
      [
        refuel(0, 10, { stationName: "WOG" }),
        refuel(100, 10, { stationName: "OKKO" }),
        refuel(200, 10, { stationName: "WOG" }),
      ],
      "Unknown",
    );

    expect(rows[0]).toMatchObject({ station: "WOG", count: 2, liters: 20 });
    expect(rows[1]).toMatchObject({ station: "OKKO", count: 1, liters: 10 });
  });

  it("buckets blank and missing names under the supplied label", () => {
    const rows = groupByStation(
      [refuel(0, 10, { stationName: null }), refuel(100, 10, { stationName: "   " })],
      "Unknown",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ station: "Unknown", count: 2 });
  });
});
