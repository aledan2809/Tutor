import { describe, it, expect } from "vitest";
import { isReminderDue, buildReminderUrl } from "@/lib/escalation/reminders";

// Fixed instant; weekday derived with the same UTC trick the impl uses so we
// never hardcode a calendar weekday. Timezone "UTC" keeps it DST-free.
const NOW = new Date("2026-06-22T08:05:00Z");
const TODAY = "2026-06-22";
const WD = new Date(Date.UTC(2026, 5, 22)).getUTCDay();

const base = {
  isActive: true,
  daysOfWeek: [WD],
  hour: 8,
  minute: 0,
  timezone: "UTC",
  lastFiredOn: null as string | null,
};

describe("isReminderDue", () => {
  it("is due at/after the scheduled time within the window, on a matching day", () => {
    const r = isReminderDue(base, NOW);
    expect(r.due).toBe(true);
    expect(r.today).toBe(TODAY);
  });

  it("is not due before the scheduled time", () => {
    expect(isReminderDue({ ...base, hour: 9 }, NOW).due).toBe(false);
  });

  it("is not due once past the 60-minute fire window", () => {
    // scheduled 07:00 → window ends 08:00; now is 08:05 → missed.
    expect(isReminderDue({ ...base, hour: 7 }, NOW).due).toBe(false);
  });

  it("is not due on a non-matching weekday", () => {
    expect(isReminderDue({ ...base, daysOfWeek: [(WD + 1) % 7] }, NOW).due).toBe(false);
  });

  it("is not due if already fired today", () => {
    expect(isReminderDue({ ...base, lastFiredOn: TODAY }, NOW).due).toBe(false);
  });

  it("is not due when inactive", () => {
    expect(isReminderDue({ ...base, isActive: false }, NOW).due).toBe(false);
  });
});

describe("buildReminderUrl", () => {
  it("encodes session type + optional domain as a deep-link", () => {
    expect(buildReminderUrl({ sessionType: "quick", domainSlug: "aviation" })).toBe(
      "/dashboard/practice?start=quick&domain=aviation"
    );
    expect(buildReminderUrl({ sessionType: "deep", domainSlug: null })).toBe(
      "/dashboard/practice?start=deep"
    );
  });
});
