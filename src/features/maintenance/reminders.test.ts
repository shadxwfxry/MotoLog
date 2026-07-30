import { describe, expect, it } from "vitest";
import {
  URGENCY_HORIZON,
  calcUrgency,
  currentOdometerOf,
  hasOverdue,
  scoreReminders,
} from "./reminders";

const NOW = new Date("2026-07-30T12:00:00Z").getTime();
const inDays = (n: number) => new Date(NOW + n * 24 * 60 * 60 * 1000);
const detail = URGENCY_HORIZON.detail; // 500 km / 7 days

describe("calcUrgency — odometer target", () => {
  it("is overdue once the odometer reaches the target", () => {
    expect(calcUrgency({ targetOdometer: 10_000 }, 10_000, detail, NOW)).toBe("overdue");
    expect(calcUrgency({ targetOdometer: 10_000 }, 12_000, detail, NOW)).toBe("overdue");
  });

  it("is soon inside the horizon and ok outside it", () => {
    expect(calcUrgency({ targetOdometer: 10_000 }, 9_600, detail, NOW)).toBe("soon");
    expect(calcUrgency({ targetOdometer: 10_000 }, 9_500, detail, NOW)).toBe("soon"); // boundary
    expect(calcUrgency({ targetOdometer: 10_000 }, 9_499, detail, NOW)).toBe("ok");
  });

  it("uses the wider horizon on the overview", () => {
    expect(calcUrgency({ targetOdometer: 10_000 }, 9_200, detail, NOW)).toBe("ok");
    expect(calcUrgency({ targetOdometer: 10_000 }, 9_200, URGENCY_HORIZON.overview, NOW)).toBe("soon");
  });

  it("does not fire when the odometer is still unknown", () => {
    expect(calcUrgency({ targetOdometer: 10_000 }, 0, detail, NOW)).toBe("ok");
  });
});

describe("calcUrgency — date target", () => {
  it("is overdue on and after the target date", () => {
    expect(calcUrgency({ targetDate: inDays(0) }, 0, detail, NOW)).toBe("overdue");
    expect(calcUrgency({ targetDate: inDays(-3) }, 0, detail, NOW)).toBe("overdue");
  });

  it("is soon inside the horizon and ok outside it", () => {
    expect(calcUrgency({ targetDate: inDays(3) }, 0, detail, NOW)).toBe("soon");
    expect(calcUrgency({ targetDate: inDays(8) }, 0, detail, NOW)).toBe("ok");
  });

  it("accepts ISO strings, as they arrive from the offline cache", () => {
    expect(calcUrgency({ targetDate: inDays(-1).toISOString() }, 0, detail, NOW)).toBe("overdue");
  });

  it("ignores an unparseable date rather than throwing", () => {
    expect(calcUrgency({ targetDate: "not a date" }, 0, detail, NOW)).toBe("ok");
  });
});

describe("calcUrgency — both targets", () => {
  it("takes the more urgent of the two signals", () => {
    // 400 km out (soon) but a month past the date (overdue). The old vehicle-page
    // implementation returned early on the odometer branch and reported "soon".
    const reminder = { targetOdometer: 10_000, targetDate: inDays(-30) };

    expect(calcUrgency(reminder, 9_600, detail, NOW)).toBe("overdue");
  });

  it("is ok only when neither signal fires", () => {
    expect(calcUrgency({ targetOdometer: 20_000, targetDate: inDays(90) }, 1_000, detail, NOW)).toBe("ok");
  });
});

describe("calcUrgency — no targets", () => {
  it("is ok when the reminder has neither target", () => {
    expect(calcUrgency({}, 5_000, detail, NOW)).toBe("ok");
    expect(calcUrgency({ targetOdometer: null, targetDate: null }, 5_000, detail, NOW)).toBe("ok");
  });
});

describe("scoreReminders", () => {
  const reminders = [
    { id: "ok", targetOdometer: 50_000 },
    { id: "overdue", targetOdometer: 9_000 },
    { id: "soon", targetOdometer: 10_200 },
  ];

  it("orders most urgent first", () => {
    const scored = scoreReminders(reminders, 10_000, detail, NOW);

    expect(scored.map((r) => r.id)).toEqual(["overdue", "soon", "ok"]);
    expect(scored[0].urgency).toBe("overdue");
  });

  it("drops completed reminders", () => {
    const scored = scoreReminders(
      [...reminders, { id: "done", targetOdometer: 1, isCompleted: true }],
      10_000,
      detail,
      NOW,
    );

    expect(scored.map((r) => r.id)).not.toContain("done");
  });

  it("preserves the original fields", () => {
    const scored = scoreReminders([{ id: "x", type: "Oil Change", targetOdometer: 1 }], 10_000, detail, NOW);

    expect(scored[0]).toMatchObject({ id: "x", type: "Oil Change", urgency: "overdue" });
  });
});

describe("hasOverdue", () => {
  it("detects an overdue reminder in the set", () => {
    expect(hasOverdue([{ urgency: "ok" }, { urgency: "overdue" }])).toBe(true);
    expect(hasOverdue([{ urgency: "ok" }, { urgency: "soon" }])).toBe(false);
    expect(hasOverdue([])).toBe(false);
  });
});

describe("currentOdometerOf", () => {
  it("takes the highest reading across both log types", () => {
    const odo = currentOdometerOf({
      refuelingLogs: [{ odometer: 12_000 }],
      maintenanceLogs: [{ odometer: 12_500 }],
    });

    expect(odo).toBe(12_500);
  });

  it("handles missing or empty logs", () => {
    expect(currentOdometerOf({})).toBe(0);
    expect(currentOdometerOf({ refuelingLogs: [], maintenanceLogs: null })).toBe(0);
  });
});
