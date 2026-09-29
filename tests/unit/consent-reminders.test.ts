import { describe, it, expect } from "vitest";
import { dueConsentReminder, reminderEmail } from "@/lib/consent-reminders";

const day = 24 * 60 * 60 * 1000;
const asked = new Date("2026-09-01T10:00:00Z");
const at = (d: number) => new Date(asked.getTime() + d * day);
const none = new Set<never>();

describe("dueConsentReminder", () => {
  it("nothing in the first 7 days (the account still works)", () => {
    expect(dueConsentReminder(asked, at(6.9), none)).toBeNull();
  });
  it("day 7, day 30, day 35 — each once", () => {
    expect(dueConsentReminder(asked, at(7), none)).toBe("stopped");
    expect(dueConsentReminder(asked, at(20), new Set(["stopped"]))).toBeNull();
    expect(dueConsentReminder(asked, at(30), new Set(["stopped"]))).toBe("week_before");
    expect(dueConsentReminder(asked, at(35), new Set(["stopped", "week_before"]))).toBe("two_days_before");
    expect(dueConsentReminder(asked, at(36), new Set(["stopped", "week_before", "two_days_before"]))).toBeNull();
  });
  it("a late run sends the most relevant one, never an earlier one after a later", () => {
    expect(dueConsentReminder(asked, at(36), none)).toBe("two_days_before");
    expect(dueConsentReminder(asked, at(31), new Set(["two_days_before"]))).toBeNull();
  });
});

describe("reminderEmail", () => {
  it("asks only for the answer: the date, the link — no price, no offer, no name in the subject", () => {
    const e = reminderEmail("two_days_before", "Ana <b>", "ana@example.ro", "https://etutor.ro/ro/acord-parinte/x", at(37));
    expect(e.subject).toContain("se șterge pe 8 octombrie 2026");
    expect(e.subject).not.toContain("Ana");
    expect(e.html).toContain("Ana &lt;b&gt;");
    expect(e.html).toContain("ștergem contul și tot ce a lucrat");
    expect(e.html).toContain("https://etutor.ro/ro/acord-parinte/x");
    expect(e.html).not.toMatch(/lei|%|reducere|ofert|abonament|pre[țt]/i);
  });
  it("an account paid by card isn't called stopped: the subscription is stopped and the account erased at the end", () => {
    const e = reminderEmail("stopped", "Ana", "ana@example.ro", "https://etutor.ro/ro/acord-parinte/x", at(37), true);
    expect(e.html).toContain("merge în continuare");
    expect(e.html).not.toContain("e oprit");
    expect(e.html).toContain("oprim abonamentul și ștergem contul");
    expect(e.html).not.toMatch(/lei|%|reducere|ofert|pre[țt]/i);
  });
  it("every e-mail tells the parent any earlier link still works", () => {
    expect(reminderEmail("week_before", null, "a", "u", at(37)).html).toContain("linkul e același");
  });
});

describe("reminderEraseOn", () => {
  it("day 37 — the whole of that day in Bucharest — and never less than two days away", async () => {
    const { reminderEraseOn } = await import("@/lib/consent-reminders");
    // Day 37 is 8 October: the account goes only once that day is over (23:59:59 in Bucharest).
    expect(reminderEraseOn(asked, at(35)).toISOString()).toBe("2026-10-08T20:59:59.999Z");
    // A request that started long ago (a cover that ended): the parent still gets two days.
    expect(reminderEraseOn(asked, at(50)).toISOString()).toBe("2026-10-23T20:59:59.999Z");
    // Late evening: two days later is the day after next in Bucharest.
    expect(reminderEraseOn(asked, new Date("2026-10-20T22:30:00Z")).toISOString()).toBe("2026-10-23T20:59:59.999Z");
  });
});
