import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFS,
  formatConsumption,
  formatCurrency,
  formatDate,
  formatDistance,
  formatDuration,
  formatPricePerVolume,
  formatSpeed,
  formatVolume,
  toUnitSystem,
  type FormatPrefs,
} from "./format";

const metric: FormatPrefs = { currency: "₴", unitSystem: "metric", locale: "en-GB" };
const imperial: FormatPrefs = { currency: "$", unitSystem: "imperial", locale: "en-US" };

/** Intl inserts non-breaking/narrow spaces; compare on plain spaces. */
const norm = (s: string) => s.replace(/[  ]/g, " ");

describe("toUnitSystem", () => {
  it("only recognises 'imperial', defaulting everything else to metric", () => {
    expect(toUnitSystem("imperial")).toBe("imperial");
    expect(toUnitSystem("metric")).toBe("metric");
    expect(toUnitSystem(null)).toBe("metric");
    expect(toUnitSystem("nonsense")).toBe("metric");
  });
});

describe("formatCurrency", () => {
  it("appends the user's symbol", () => {
    expect(norm(formatCurrency(1500, metric))).toBe("1,500 ₴");
    expect(norm(formatCurrency(1500, imperial))).toBe("1,500 $");
  });

  it("honours the requested precision", () => {
    expect(norm(formatCurrency(58.456, metric, 2))).toBe("58.46 ₴");
  });

  it("renders a dash for missing or non-finite values", () => {
    expect(formatCurrency(null, metric)).toBe("—");
    expect(formatCurrency(undefined, metric)).toBe("—");
    expect(formatCurrency(Number.NaN, metric)).toBe("—");
    expect(formatCurrency(Number.POSITIVE_INFINITY, metric)).toBe("—");
  });

  it("formats a genuine zero rather than dashing it", () => {
    expect(norm(formatCurrency(0, metric))).toBe("0 ₴");
  });
});

describe("formatDistance", () => {
  it("keeps kilometres for metric and converts to miles for imperial", () => {
    expect(norm(formatDistance(100, metric))).toBe("100 km");
    expect(norm(formatDistance(100, imperial))).toBe("62 mi");
  });
});

describe("formatVolume", () => {
  it("converts litres to US gallons for imperial", () => {
    expect(norm(formatVolume(10, metric))).toBe("10.0 L");
    expect(norm(formatVolume(10, imperial))).toBe("2.6 gal");
  });
});

describe("formatConsumption", () => {
  it("shows L/100km for metric", () => {
    expect(norm(formatConsumption(6.04, metric))).toBe("6.0 L/100km");
  });

  it("inverts to MPG for imperial, because higher becomes better", () => {
    // 6 L/100km ≈ 39.2 mpg
    expect(norm(formatConsumption(6, imperial))).toBe("39.2 mpg");
    // Half the consumption must double the mpg.
    expect(norm(formatConsumption(3, imperial))).toBe("78.4 mpg");
  });

  it("dashes non-computable economy instead of printing 0 or Infinity", () => {
    expect(formatConsumption(null, metric)).toBe("—");
    expect(formatConsumption(0, imperial)).toBe("—");
    expect(formatConsumption(-1, metric)).toBe("—");
  });
});

describe("formatPricePerVolume", () => {
  it("prices per litre for metric and per gallon for imperial", () => {
    expect(norm(formatPricePerVolume(58, metric))).toBe("58.00 ₴/L");
    // A gallon costs ~3.79× a litre.
    expect(norm(formatPricePerVolume(1, imperial))).toBe("3.79 $/gal");
  });
});

describe("formatSpeed", () => {
  it("converts km/h to mph for imperial", () => {
    expect(norm(formatSpeed(100, metric))).toBe("100 km/h");
    expect(norm(formatSpeed(100, imperial))).toBe("62 mph");
  });
});

describe("formatDate", () => {
  it("formats by locale", () => {
    expect(formatDate("2026-07-30T12:00:00Z", metric)).toBe("30/07/2026");
    expect(formatDate("2026-07-30T12:00:00Z", imperial)).toBe("07/30/2026");
  });

  it("returns an empty string for missing or invalid input", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("not a date")).toBe("");
  });

  it("defaults to en-GB when no prefs are supplied", () => {
    expect(formatDate("2026-07-30T12:00:00Z")).toBe(formatDate("2026-07-30T12:00:00Z", DEFAULT_PREFS));
  });
});

describe("formatDuration", () => {
  it("switches to hours past the hour mark", () => {
    expect(formatDuration(3900)).toBe("1h 05m");
    expect(formatDuration(750)).toBe("12m 30s");
    expect(formatDuration(0)).toBe("0m 00s");
  });

  it("dashes invalid input", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(-5)).toBe("—");
  });
});
