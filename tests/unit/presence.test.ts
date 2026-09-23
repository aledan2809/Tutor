import { describe, it, expect } from "vitest";
import { clusterVisits, sumVisits, startOfRomanianDay, VISIT_GAP_MS, VISIT_TAIL_MS } from "@/lib/presence";

const MIN = 60_000;
const t0 = new Date("2026-09-20T10:00:00.000Z").getTime();
const at = (minutes: number) => t0 + minutes * MIN;

describe("clusterVisits — stays out of activity moments", () => {
  it("no activity is no visit, not a visit of zero length", () => {
    expect(clusterVisits([])).toEqual({ visits: 0, ms: 0 });
  });

  it("one trace is one visit, worth the tail (the person did not leave that same instant)", () => {
    expect(clusterVisits([at(0)])).toEqual({ visits: 1, ms: VISIT_TAIL_MS });
  });

  it("traces inside the gap stay one visit, and the time is the span plus the tail", () => {
    expect(clusterVisits([at(0), at(10), at(25)])).toEqual({ visits: 1, ms: 25 * MIN + VISIT_TAIL_MS });
  });

  it("a pause longer than the gap opens a second visit, each with its own tail", () => {
    const got = clusterVisits([at(0), at(5), at(50), at(60)]);
    expect(got.visits).toBe(2);
    expect(got.ms).toBe(5 * MIN + VISIT_TAIL_MS + (10 * MIN + VISIT_TAIL_MS));
  });

  it("exactly the gap is still the same visit — the rule is 'more than 30 minutes'", () => {
    expect(clusterVisits([at(0), at(30)]).visits).toBe(1);
    expect(clusterVisits([t0, t0 + VISIT_GAP_MS + 1]).visits).toBe(2);
  });

  it("a day of coming and going counts every stay", () => {
    // 09:00-09:20, 12:00-12:05, 19:00 (a single trace)
    const times = [at(0), at(10), at(20), at(180), at(185), at(540)];
    const got = clusterVisits(times);
    expect(got.visits).toBe(3);
    expect(got.ms).toBe(20 * MIN + 5 * MIN + 0 + 3 * VISIT_TAIL_MS);
  });
});

describe("sumVisits — recorded stays inside a period", () => {
  const row = (startMin: number, endMin: number) => ({
    startedAt: new Date(at(startMin)),
    lastSeenAt: new Date(at(endMin)),
  });

  it("adds each stay plus its tail", () => {
    expect(sumVisits([row(0, 20), row(60, 70)], new Date(at(-10)))).toEqual({
      visits: 2,
      ms: 20 * MIN + 10 * MIN + 2 * VISIT_TAIL_MS,
    });
  });

  it("a stay that began before the window counts only its part inside it", () => {
    // Started at 10:00, still there at 10:30; the window opens at 10:20 → 10 minutes, not 30.
    expect(sumVisits([row(0, 30)], new Date(at(20)))).toEqual({ visits: 1, ms: 10 * MIN + VISIT_TAIL_MS });
  });

  it("a stay that ended before the window is not counted at all", () => {
    expect(sumVisits([row(0, 10)], new Date(at(20)))).toEqual({ visits: 0, ms: 0 });
  });

  it("a stay of one signal is worth the tail, not zero", () => {
    expect(sumVisits([row(5, 5)], new Date(at(0)))).toEqual({ visits: 1, ms: VISIT_TAIL_MS });
  });
});

describe("startOfRomanianDay — „Azi” is a calendar day, not a rolling 24 hours", () => {
  it("in summer time the day opens at 21:00 UTC the evening before", () => {
    // 23 sept. 2026, 21:00 in Bucharest (EEST, +3) = 18:00 UTC
    const start = startOfRomanianDay(new Date("2026-09-23T18:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-09-22T21:00:00.000Z");
  });

  it("in winter time it opens at 22:00 UTC the evening before", () => {
    const start = startOfRomanianDay(new Date("2026-01-15T10:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-01-14T22:00:00.000Z");
  });

  it("the day that the clocks change still opens once, at its own midnight", () => {
    // The last Sunday of October 2026: 25.10, clocks go back at 04:00 local.
    const start = startOfRomanianDay(new Date("2026-10-25T12:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-10-24T21:00:00.000Z");
  });

  it("never returns a moment in the future, nor more than a day back", () => {
    const now = new Date("2026-05-07T00:30:00.000Z"); // 03:30 in Bucharest
    const start = startOfRomanianDay(now);
    expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(now.getTime() - start.getTime()).toBeLessThan(24 * 3600_000);
  });
});
