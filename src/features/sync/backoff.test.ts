import { describe, expect, it } from "vitest";
import {
  MAX_SYNC_ATTEMPTS,
  backoffDelayMs,
  hasAttemptsLeft,
  isDue,
  nextAttemptAt,
} from "./backoff";

describe("backoffDelayMs", () => {
  it("doubles with each attempt", () => {
    expect(backoffDelayMs(1)).toBe(5_000);
    expect(backoffDelayMs(2)).toBe(10_000);
    expect(backoffDelayMs(3)).toBe(20_000);
    expect(backoffDelayMs(4)).toBe(40_000);
  });

  it("caps the delay so a stuck item still retries occasionally", () => {
    expect(backoffDelayMs(20)).toBe(5 * 60_000);
  });

  it("does not delay the first attempt", () => {
    expect(backoffDelayMs(0)).toBe(0);
  });
});

describe("nextAttemptAt", () => {
  it("offsets from the supplied clock", () => {
    expect(nextAttemptAt(1, 1_000)).toBe(6_000);
    expect(nextAttemptAt(0, 1_000)).toBe(1_000);
  });
});

describe("hasAttemptsLeft", () => {
  it("gives up at the attempt ceiling", () => {
    expect(hasAttemptsLeft(MAX_SYNC_ATTEMPTS - 1)).toBe(true);
    expect(hasAttemptsLeft(MAX_SYNC_ATTEMPTS)).toBe(false);
  });
});

describe("isDue", () => {
  it("is due once the backoff window has passed", () => {
    expect(isDue({ status: "pending", nextAttemptAt: 500 }, 1_000)).toBe(true);
    expect(isDue({ status: "pending", nextAttemptAt: 1_000 }, 1_000)).toBe(true);
    expect(isDue({ status: "pending", nextAttemptAt: 1_500 }, 1_000)).toBe(false);
  });

  it("never retries an item that has been given up on", () => {
    expect(isDue({ status: "failed", nextAttemptAt: 0 }, 1_000)).toBe(false);
  });
});
