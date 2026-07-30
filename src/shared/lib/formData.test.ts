import { describe, expect, it } from "vitest";
import {
  booleanField,
  floatField,
  intField,
  optionalDateField,
  optionalNumberField,
  optionalTextField,
} from "./formData";

describe("intField", () => {
  const schema = intField(0);

  it("parses numeric strings", () => {
    expect(schema.parse("12345")).toBe(12345);
    expect(schema.parse(" 42 ")).toBe(42);
  });

  it("rejects blanks and junk instead of producing NaN", () => {
    // The old preprocess passed NaN straight into z.number(), whose error message
    // ("expected number, received nan") then surfaced to the user.
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("abc").success).toBe(false);
  });

  it("enforces the minimum", () => {
    expect(schema.safeParse("-1").success).toBe(false);
  });
});

describe("floatField", () => {
  it("parses decimals and rejects blanks", () => {
    expect(floatField(0).parse("12.5")).toBe(12.5);
    expect(floatField(0).safeParse("").success).toBe(false);
  });

  it("rejects values below the minimum", () => {
    expect(floatField(0.01).safeParse("0").success).toBe(false);
  });
});

describe("optionalNumberField", () => {
  it("turns blank input into null, not NaN", () => {
    expect(optionalNumberField().parse("")).toBeNull();
    expect(optionalNumberField().parse("   ")).toBeNull();
    expect(optionalNumberField().parse(null)).toBeNull();
    expect(optionalNumberField().parse(undefined)).toBeNull();
  });

  it("parses values that are present", () => {
    expect(optionalNumberField().parse("58.5")).toBe(58.5);
    expect(optionalNumberField("int").parse("650")).toBe(650);
  });

  it("truncates to an integer when asked", () => {
    expect(optionalNumberField("int").parse("650.9")).toBe(650);
  });

  it("nulls unparseable text rather than failing the whole form", () => {
    expect(optionalNumberField().parse("abc")).toBeNull();
  });
});

describe("optionalTextField", () => {
  it("trims and nulls blank strings", () => {
    expect(optionalTextField().parse("  WOG ")).toBe("WOG");
    expect(optionalTextField().parse("   ")).toBeNull();
    expect(optionalTextField().parse("")).toBeNull();
  });
});

describe("optionalDateField", () => {
  it("parses dates and nulls blanks", () => {
    expect(optionalDateField().parse("2026-07-30")).toEqual(new Date("2026-07-30"));
    expect(optionalDateField().parse("")).toBeNull();
    expect(optionalDateField().parse(null)).toBeNull();
  });

  it("nulls unparseable dates", () => {
    expect(optionalDateField().parse("not a date")).toBeNull();
  });
});

describe("booleanField", () => {
  it("accepts the shapes a checkbox actually sends", () => {
    expect(booleanField().parse("on")).toBe(true);
    expect(booleanField().parse("true")).toBe(true);
    expect(booleanField().parse(true)).toBe(true);
  });

  it("treats an absent checkbox as false", () => {
    expect(booleanField().parse(undefined)).toBe(false);
    expect(booleanField().parse("off")).toBe(false);
  });
});
