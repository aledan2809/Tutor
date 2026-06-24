import { describe, it, expect } from "vitest";
import { isReportDue } from "@/lib/escalation/watcher-reports";

const base = {
  cadence: "weekly" as const,
  dayOfWeek: 1, // Monday
  hour: 8,
  minute: 0,
  timezone: "Europe/Bucharest",
  lastSentOn: null as string | null,
};

// 2026-06-22 is a Monday. 08:00 Europe/Bucharest = 05:00 UTC (summer, +3).
const monday0800 = new Date("2026-06-22T05:00:00Z");
const monday0830 = new Date("2026-06-22T05:30:00Z");
const monday0930 = new Date("2026-06-22T06:30:00Z"); // past the 60-min window
const monday0759 = new Date("2026-06-22T04:59:00Z");
const tuesday0800 = new Date("2026-06-23T05:00:00Z");

describe("isReportDue", () => {
  it("fires at the scheduled minute on the scheduled weekday", () => {
    expect(isReportDue(base, monday0800).due).toBe(true);
  });

  it("fires within the 60-min catch-up window", () => {
    expect(isReportDue(base, monday0830).due).toBe(true);
  });

  it("does NOT fire past the window", () => {
    expect(isReportDue(base, monday0930).due).toBe(false);
  });

  it("does NOT fire before the scheduled time", () => {
    expect(isReportDue(base, monday0759).due).toBe(false);
  });

  it("weekly does NOT fire on the wrong weekday", () => {
    expect(isReportDue(base, tuesday0800).due).toBe(false);
  });

  it("does NOT re-fire when already sent today", () => {
    const r = isReportDue({ ...base, lastSentOn: "2026-06-22" }, monday0800);
    expect(r.due).toBe(false);
    expect(r.today).toBe("2026-06-22");
  });

  it("daily fires regardless of weekday", () => {
    const daily = { ...base, cadence: "daily" as const, dayOfWeek: null };
    expect(isReportDue(daily, tuesday0800).due).toBe(true);
  });
});
