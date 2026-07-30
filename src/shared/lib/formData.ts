import { z } from "zod";

/**
 * FormData coercion helpers.
 *
 * Every value arriving from a `<form>` is a string, and empty inputs arrive as
 * "" rather than absent. The previous schemas repeated bespoke `preprocess`
 * calls per field, several of which turned "" into NaN instead of null.
 */

/** Required integer; rejects "", NaN and non-numeric text. */
export const intField = (min = 0) =>
  z.preprocess((value) => {
    if (typeof value !== "string" && typeof value !== "number") return undefined;
    const parsed = typeof value === "number" ? value : Number.parseInt(value.trim(), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, z.number().int().min(min));

/** Required float. */
export const floatField = (min = 0) =>
  z.preprocess((value) => {
    if (typeof value !== "string" && typeof value !== "number") return undefined;
    const parsed = typeof value === "number" ? value : Number.parseFloat(value.trim());
    return Number.isNaN(parsed) ? undefined : parsed;
  }, z.number().min(min));

/** Optional number; blank input becomes null rather than NaN. */
export const optionalNumberField = (parse: "int" | "float" = "float") =>
  z.preprocess((value) => {
    if (value == null) return null;
    if (typeof value === "number") return Number.isNaN(value) ? null : value;
    if (typeof value !== "string" || value.trim() === "") return null;
    const parsed =
      parse === "int" ? Number.parseInt(value.trim(), 10) : Number.parseFloat(value.trim());
    return Number.isNaN(parsed) ? null : parsed;
  }, z.number().nullable());

/** Optional text; blank input becomes null so it does not overwrite with "". */
export const optionalTextField = () =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value ?? null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().nullable());

/** Optional date; blank or unparseable input becomes null. */
export const optionalDateField = () =>
  z.preprocess((value) => {
    if (value == null || value === "") return null;
    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, z.date().nullable());

/** Checkbox. Unchecked boxes are absent from FormData entirely. */
export const booleanField = () =>
  z.preprocess(
    (value) => value === true || value === "true" || value === "on" || value === "1",
    z.boolean(),
  );
