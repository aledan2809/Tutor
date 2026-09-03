import { describe, it, expect } from "vitest";
import { buildTelegramReminderText, buttonLabelFor } from "@/lib/notifications/service";
import { encouragementFor } from "@/lib/escalation/engine";

describe("buildTelegramReminderText", () => {
  // THE regression. Before the fix, the Telegram rung discarded the reminder's own
  // title/message and printed an English stats blob:
  //   "64 sessions this week | 3-day streak at risk | 6170 XP (Instructor) | 61 reminders sent"
  // The child was never told what to study.
  it("carries the reminder's own session copy", () => {
    const t = buildTelegramReminderText({
      userName: "Rares",
      title: "Sesiune rapidă · 14:00",
      message: "Sesiune rapidă programată la 14:00 — hai să începem.",
      encouragement: "🔥 3 zile la rând — nu rupe seria azi.",
    });
    expect(t).toContain("Sesiune rapidă · 14:00");
    expect(t).toContain("programată la 14:00");
    expect(t).toContain("🔥 3 zile la rând");
  });

  it("never leaks the internal nag counter or the level label", () => {
    const t = buildTelegramReminderText({
      userName: "Rares",
      title: "Sesiune rapidă · 14:00",
      message: "Sesiune rapidă programată la 14:00 — hai să începem.",
      encouragement: "🔥 3 zile la rând — nu rupe seria azi.",
    });
    expect(t).not.toMatch(/reminders sent/i);
    expect(t).not.toMatch(/\bXP\b/);
    expect(t).not.toMatch(/Instructor|Cadet/);
    expect(t).not.toMatch(/sessions this week|streak at risk|streak lost/i);
  });

  it("keeps a custom reminder label — a parent's own name for the slot", () => {
    const t = buildTelegramReminderText({
      userName: "Rares",
      title: "Matematică de seară",
      message: "Sesiune lungă programată la 21:00 — hai să începem.",
      encouragement: null,
    });
    expect(t).toContain("Matematică de seară");
  });

  it("falls back to generic copy when the cascade carries no reminder", () => {
    const t = buildTelegramReminderText({
      userName: "Rares", title: null, message: null, encouragement: null,
    });
    expect(t).toContain("quiz scurt");
    expect(t).toContain("Rares");
  });

  it("omits the encouragement block entirely when there is none", () => {
    const t = buildTelegramReminderText({
      userName: "Rares", title: null,
      message: "Sesiune rapidă programată la 14:00 — hai să începem.",
      encouragement: null,
    });
    expect(t.trimEnd()).toBe(t.trimEnd().replace(/\n\n$/, ""));
    expect(t).not.toContain("🔥");
  });

  it("does not double-escape — the caller escapes, the builder only assembles", () => {
    const t = buildTelegramReminderText({
      userName: "A &amp; B", title: null, message: "x &lt;b&gt;", encouragement: null,
    });
    expect(t).toContain("A &amp; B");
    expect(t).toContain("x &lt;b&gt;");
  });
});

describe("encouragementFor", () => {
  // A broken streak must stay SILENT. "streak lost" on a reminder is discouragement,
  // and this rung exists to get the child to start, not to score him.
  it("says nothing when the streak is broken", () => {
    expect(encouragementFor(0)).toBeNull();
    expect(encouragementFor(-3)).toBeNull();
    expect(encouragementFor(NaN)).toBeNull();
  });

  it("encourages a first day rather than counting it", () => {
    expect(encouragementFor(1)).toContain("Prima zi");
  });

  it("counts a real streak", () => {
    expect(encouragementFor(3)).toContain("3 zile la rând");
    expect(encouragementFor(30)).toContain("30 zile la rând");
  });

  it("is always positive — never mentions loss or risk", () => {
    for (const n of [1, 2, 5, 100]) {
      const line = encouragementFor(n)!;
      expect(line).not.toMatch(/pierdut|risc|rupt|at risk|lost/i);
    }
  });
});

describe("buttonLabelFor", () => {
  it("offers to START the session when the link opens one", () => {
    expect(buttonLabelFor("/dashboard/practice?start=quick&domain=mate")).toBe("Începe sesiunea");
  });

  it("falls back to opening the app for a plain link", () => {
    expect(buttonLabelFor("/dashboard/rapoarte")).toBe("Deschide eTutor");
    expect(buttonLabelFor(undefined)).toBe("Deschide eTutor");
  });

  it("is not fooled by 'start' appearing outside a query parameter", () => {
    expect(buttonLabelFor("/dashboard/start-here")).toBe("Deschide eTutor");
  });
});
