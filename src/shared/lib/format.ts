/**
 * Locale-, currency- and unit-aware formatting.
 *
 * The schema has carried `User.currency` and `User.unitSystem` since the start,
 * but the UI hardcoded "₴", "km" and "L/100km" everywhere. Everything
 * user-visible goes through here so those preferences actually take effect.
 */

export type UnitSystem = "metric" | "imperial";

export interface FormatPrefs {
  /** Currency symbol as entered by the user (e.g. "₴", "$"), not an ISO code. */
  currency: string;
  unitSystem: UnitSystem;
  /** BCP 47 tag used for digit grouping and dates. */
  locale: string;
}

export const DEFAULT_PREFS: FormatPrefs = {
  currency: "₴",
  unitSystem: "metric",
  locale: "en-GB",
};

export function toUnitSystem(value: string | null | undefined): UnitSystem {
  return value === "imperial" ? "imperial" : "metric";
}

const MILES_PER_KM = 0.621371;
const US_GALLONS_PER_LITER = 0.264172;
/** L/100km × MPG = this constant; the two are reciprocal, not proportional. */
const MPG_FROM_L_PER_100KM = 235.215;

function formatNumber(value: number, locale: string, fractionDigits: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Money. The symbol trails the amount, which suits ₴/€ and stays readable for
 * $ — using Intl's `style: "currency"` is not an option because the stored
 * value is a free-text symbol rather than an ISO 4217 code.
 */
export function formatCurrency(
  value: number | null | undefined,
  prefs: FormatPrefs = DEFAULT_PREFS,
  fractionDigits = 0,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${formatNumber(value, prefs.locale, fractionDigits)} ${prefs.currency}`;
}

export function formatDistance(
  km: number | null | undefined,
  prefs: FormatPrefs = DEFAULT_PREFS,
  fractionDigits = 0,
): string {
  if (km == null || !Number.isFinite(km)) return "—";
  const imperial = prefs.unitSystem === "imperial";
  const value = imperial ? km * MILES_PER_KM : km;
  return `${formatNumber(value, prefs.locale, fractionDigits)} ${imperial ? "mi" : "km"}`;
}

export function formatVolume(
  liters: number | null | undefined,
  prefs: FormatPrefs = DEFAULT_PREFS,
  fractionDigits = 1,
): string {
  if (liters == null || !Number.isFinite(liters)) return "—";
  const imperial = prefs.unitSystem === "imperial";
  const value = imperial ? liters * US_GALLONS_PER_LITER : liters;
  return `${formatNumber(value, prefs.locale, fractionDigits)} ${imperial ? "gal" : "L"}`;
}

/**
 * Fuel economy. Input is always L/100km — the canonical unit used by
 * `features/fuel/consumption` — and is inverted to MPG for imperial users,
 * because "lower is better" flips to "higher is better".
 */
export function formatConsumption(
  lPer100km: number | null | undefined,
  prefs: FormatPrefs = DEFAULT_PREFS,
): string {
  if (lPer100km == null || !Number.isFinite(lPer100km) || lPer100km <= 0) return "—";

  if (prefs.unitSystem === "imperial") {
    return `${formatNumber(MPG_FROM_L_PER_100KM / lPer100km, prefs.locale, 1)} mpg`;
  }
  return `${formatNumber(lPer100km, prefs.locale, 1)} L/100km`;
}

/** Price per unit of volume, e.g. "58.00 ₴/L". */
export function formatPricePerVolume(
  pricePerLiter: number | null | undefined,
  prefs: FormatPrefs = DEFAULT_PREFS,
): string {
  if (pricePerLiter == null || !Number.isFinite(pricePerLiter)) return "—";
  const imperial = prefs.unitSystem === "imperial";
  const value = imperial ? pricePerLiter / US_GALLONS_PER_LITER : pricePerLiter;
  return `${formatNumber(value, prefs.locale, 2)} ${prefs.currency}/${imperial ? "gal" : "L"}`;
}

/**
 * Short date. Replaces the hardcoded en-GB formatter in `lib/utils`; invalid
 * input yields an empty string so a bad row never breaks a render.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  prefs: FormatPrefs = DEFAULT_PREFS,
): string {
  if (date == null) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat(prefs.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

/** Elapsed ride time as "1h 05m" / "12m 30s". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function formatSpeed(
  kph: number | null | undefined,
  prefs: FormatPrefs = DEFAULT_PREFS,
  fractionDigits = 0,
): string {
  if (kph == null || !Number.isFinite(kph)) return "—";
  const imperial = prefs.unitSystem === "imperial";
  const value = imperial ? kph * MILES_PER_KM : kph;
  return `${formatNumber(value, prefs.locale, fractionDigits)} ${imperial ? "mph" : "km/h"}`;
}
