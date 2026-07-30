import { describe, expect, it } from "vitest";
import { serializeForClient } from "./serialize";

describe("serializeForClient", () => {
  it("converts dates to ISO strings", () => {
    const result = serializeForClient({ date: new Date("2026-07-30T12:00:00Z") });

    expect(result.date).toBe("2026-07-30T12:00:00.000Z");
  });

  it("walks nested objects and arrays", () => {
    const result = serializeForClient({
      vehicle: { id: "v1", logs: [{ date: new Date("2026-01-01T00:00:00Z"), cost: 500 }] },
    });

    expect(result.vehicle.logs[0].date).toBe("2026-01-01T00:00:00.000Z");
    expect(result.vehicle.logs[0].cost).toBe(500);
  });

  it("stringifies bigints, which JSON.stringify throws on", () => {
    expect(serializeForClient({ id: 9_007_199_254_740_993n }).id).toBe("9007199254740993");
  });

  it("preserves nulls and undefined rather than dropping keys", () => {
    // JSON.stringify removes undefined values entirely, changing the object shape.
    const result = serializeForClient({ a: null, b: undefined, c: 0, d: false, e: "" });

    expect(result).toEqual({ a: null, b: undefined, c: 0, d: false, e: "" });
    expect("b" in result).toBe(true);
  });

  it("delegates to toJSON when an object provides one", () => {
    class Decimal {
      constructor(private readonly value: string) {}
      toJSON() {
        return this.value;
      }
    }

    expect(serializeForClient({ cost: new Decimal("12.34") }).cost).toBe("12.34");
  });

  it("passes primitives through untouched", () => {
    expect(serializeForClient("text")).toBe("text");
    expect(serializeForClient(42)).toBe(42);
    expect(serializeForClient(null)).toBeNull();
  });

  it("handles an array at the top level", () => {
    const result = serializeForClient([{ date: new Date("2026-07-30T00:00:00Z") }]);

    expect(result[0].date).toBe("2026-07-30T00:00:00.000Z");
  });
});
