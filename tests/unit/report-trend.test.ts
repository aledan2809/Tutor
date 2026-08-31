import { describe, it, expect } from "vitest";
import {
  MIN_PERIODS_FOR_TREND,
  compareReports,
  concludeTrend,
  periodWindows,
  sectionMetrics,
} from "@/lib/report-trend";
import type { ChildReport } from "@/lib/watcher-report";

const report = (over: Partial<ChildReport> = {}): ChildReport => ({
  childId: "c1",
  childName: "Rareș",
  periodLabel: "Azi",
  hasActivity: true,
  sessions: { total: 4, completed: 3, avgScore: 80 },
  discipline: { onTime: 3, late: 1, ignored: 0 },
  weaknesses: [],
  results: [{ domainName: "Aviație", correct: 8, total: 10, accuracy: 80 }],
  feedback: "",
  ...over,
});

describe("period windows", () => {
  const now = new Date(2026, 7, 27, 14, 37); // 27 Aug, mid-afternoon

  it("opens on the period still in progress", () => {
    const [first] = periodWindows("daily", 6, now);
    expect(first.current).toBe(true);
    expect(first.label).toContain("în curs");
    // …whose report has not been sent — the whole reason this page exists.
    expect(first.until.getTime()).toBe(now.getTime());
  });

  it("anchors on whole days, so a comparison is not skewed by the clock", () => {
    // A "yesterday" running to 14:37 because that is when the page was opened
    // would make every delta meaningless.
    const [, yesterday] = periodWindows("daily", 6, now);
    expect(yesterday.since.getHours()).toBe(0);
    expect(yesterday.until.getHours()).toBe(0);
    expect(yesterday.until.getTime() - yesterday.since.getTime()).toBe(86_400_000);
  });

  it("returns six windows for today plus the last five", () => {
    expect(periodWindows("daily", 6, now)).toHaveLength(6);
    expect(periodWindows("weekly", 6, now)).toHaveLength(6);
  });

  it("does not overlap consecutive windows", () => {
    const w = periodWindows("daily", 4, now);
    for (let i = 1; i < w.length; i++) {
      expect(w[i].until.getTime()).toBeLessThanOrEqual(w[i - 1].since.getTime());
    }
  });

  it("never returns an empty list", () => {
    expect(periodWindows("daily", 0, now).length).toBeGreaterThan(0);
  });
});

describe("per-chapter numbers", () => {
  it("reports nothing rather than zero when there is no evidence", () => {
    const m = sectionMetrics(report({ results: [], discipline: { onTime: 0, late: 0, ignored: 0 } }));
    expect(m.find((x) => x.section === "results")?.value).toBe(null);
    expect(m.find((x) => x.section === "discipline")?.display).toBe("—");
  });

  it("knows that fewer weak chapters is the better outcome", () => {
    const weak = sectionMetrics(report()).find((x) => x.section === "weaknesses");
    expect(weak?.higherIsBetter).toBe(false);
  });
});

describe("variation against the previous period", () => {
  it("calls a drop in accuracy worse, and a drop in weak chapters better", () => {
    const now = report({ results: [{ domainName: "A", correct: 6, total: 10, accuracy: 60 }], weaknesses: [] });
    const before = report({
      results: [{ domainName: "A", correct: 9, total: 10, accuracy: 90 }],
      weaknesses: [{ subject: "Fizică", topic: "Vectori", wrong: 4, total: 6 }],
    });
    const d = compareReports(now, before);
    expect(d.find((x) => x.section === "results")?.direction).toBe("worse");
    expect(d.find((x) => x.section === "weaknesses")?.direction).toBe("better");
  });

  it("says unknown instead of inventing a delta against an empty period", () => {
    const d = compareReports(report(), report({ results: [] }));
    expect(d.find((x) => x.section === "results")?.direction).toBe("unknown");
    expect(d.find((x) => x.section === "results")?.delta).toBe(null);
  });

  it("works with no previous period at all", () => {
    expect(compareReports(report()).every((x) => x.direction === "unknown")).toBe(true);
  });
});

describe("the conclusion", () => {
  it("refuses to call two points a trend", () => {
    const txt = concludeTrend([report(), report()]);
    expect(txt).toContain("prea puțin");
    expect(MIN_PERIODS_FOR_TREND).toBe(3);
  });

  it("says plainly when there is no activity at all", () => {
    expect(concludeTrend([report({ hasActivity: false })])).toContain("Nicio activitate");
  });

  it("reports a decline as plainly as an improvement", () => {
    const worse = concludeTrend([
      report({ results: [{ domainName: "A", correct: 5, total: 10, accuracy: 50 }] }),
      report({ results: [{ domainName: "A", correct: 7, total: 10, accuracy: 70 }] }),
      report({ results: [{ domainName: "A", correct: 9, total: 10, accuracy: 90 }] }),
    ]);
    // Newest first in, so oldest 90 → newest 50: a decline, and it must say so.
    expect(worse).toContain("a scăzut");
  });

  it("names a weakness only when it persists across the periods", () => {
    const w = { subject: "Fizică", topic: "Vectori", wrong: 4, total: 6 };
    const persistent = concludeTrend([report({ weaknesses: [w] }), report({ weaknesses: [w] }), report({ weaknesses: [w] })]);
    expect(persistent).toContain("Vectori");
    const oneOff = concludeTrend([report({ weaknesses: [w] }), report(), report()]);
    expect(oneOff).not.toContain("Vectori");
  });

  it("does not claim a change when the numbers barely moved", () => {
    const flat = concludeTrend([
      report({ results: [{ domainName: "A", correct: 8, total: 10, accuracy: 80 }] }),
      report({ results: [{ domainName: "A", correct: 8, total: 10, accuracy: 80 }] }),
      report({ results: [{ domainName: "A", correct: 8, total: 10, accuracy: 80 }] }),
    ]);
    expect(flat).toContain("stă pe loc");
  });
});
