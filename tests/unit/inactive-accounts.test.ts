import { describe, it, expect } from "vitest";
import { dueInactiveWarning, inactiveEraseAt, warningCycle, warningEmail, warningEraseOn } from "@/lib/inactive-accounts";

const day = 24 * 60 * 60 * 1000;
const last = new Date("2025-10-01T10:00:00Z");
const eraseAt = inactiveEraseAt(last);
const before = (d: number) => new Date(eraseAt.getTime() - d * day);
const none = new Set<never>();

describe("inactiveEraseAt", () => {
  it("12 calendar months after the last sign of life, to the end of that day in Bucharest", () => {
    expect(eraseAt.toISOString()).toBe("2026-10-01T20:59:59.999Z");
  });
  it("a leap year never makes it a day short", () => {
    // 1 March 2027 + 12 months = 1 March 2028 (365 days would land on 29 February).
    expect(inactiveEraseAt(new Date("2027-03-01T10:00:00Z")).toISOString()).toBe("2028-03-01T21:59:59.999Z");
    // 29 February 2028 + 12 months: 1 March 2029, never 28 February.
    expect(inactiveEraseAt(new Date("2028-02-29T10:00:00Z")).toISOString()).toBe("2029-03-01T21:59:59.999Z");
  });
});

describe("dueInactiveWarning", () => {
  it("nothing earlier than 30 days before", () => {
    expect(dueInactiveWarning(eraseAt, before(31), none)).toBeNull();
  });
  it("30, 7 and 1 day before — each once", () => {
    expect(dueInactiveWarning(eraseAt, before(30), none)).toBe("month");
    expect(dueInactiveWarning(eraseAt, before(20), new Set(["month"]))).toBeNull();
    expect(dueInactiveWarning(eraseAt, before(7), new Set(["month"]))).toBe("week");
    expect(dueInactiveWarning(eraseAt, before(1), new Set(["month", "week"]))).toBe("day");
    expect(dueInactiveWarning(eraseAt, before(0.5), new Set(["month", "week", "day"]))).toBeNull();
  });
  it("a late run: the latest one only", () => {
    expect(dueInactiveWarning(eraseAt, before(0.5), none)).toBe("day");
    expect(dueInactiveWarning(eraseAt, before(5), new Set(["day"]))).toBeNull();
  });
  it("past the date without the last warning: that one is due, never an erasure without it", () => {
    expect(dueInactiveWarning(eraseAt, before(-1), none)).toBe("day");
    expect(dueInactiveWarning(eraseAt, before(-40), new Set(["month"]))).toBe("day");
    expect(dueInactiveWarning(eraseAt, before(-1), new Set(["day"]))).toBeNull();
  });
});

describe("warningCycle", () => {
  const rec = (stage: string, on: number) => ({ identifier: `inactive-warning:u1:${stage}`, token: `inactive:u1:${stage}:${on}` });
  it("no last warning yet: nothing to wait for, so no erasure", () => {
    const c = warningCycle([rec("month", eraseAt.getTime()), rec("week", eraseAt.getTime())], "u1", eraseAt);
    expect(c.finalOn).toBeNull();
    expect([...c.sent].sort()).toEqual(["month", "week"]);
  });
  it("the last warning's date, the latest if there are two", () => {
    const later = eraseAt.getTime() + 3 * day;
    const c = warningCycle([rec("day", eraseAt.getTime()), rec("day", later)], "u1", eraseAt);
    expect(c.finalOn).toBe(later);
    expect(c.sent.has("day")).toBe(true);
  });
  it("warnings from before a sign-in don't count: a new cycle warns again", () => {
    const moved = new Date(eraseAt.getTime() + 200 * day);
    const c = warningCycle([rec("day", eraseAt.getTime()), rec("month", eraseAt.getTime())], "u1", moved);
    expect(c.finalOn).toBeNull();
    expect(c.sent.size).toBe(0);
  });
  it("another account's records are ignored", () => {
    const c = warningCycle([{ identifier: "inactive-warning:u2:day", token: `inactive:u2:day:${eraseAt.getTime()}` }], "u1", eraseAt);
    expect(c.finalOn).toBeNull();
  });
});

describe("warningEraseOn", () => {
  it("the erasure day, or a day after the warning when that is later", () => {
    expect(warningEraseOn(eraseAt, before(7)).getTime()).toBe(eraseAt.getTime());
    // 12 hours before: the next day, to its end.
    expect(warningEraseOn(eraseAt, before(0.5)).toISOString()).toBe("2026-10-02T20:59:59.999Z");
    // A late sweep, three days past: the day after it.
    expect(warningEraseOn(eraseAt, before(-3)).toISOString()).toBe("2026-10-05T20:59:59.999Z");
  });
});

describe("warningEmail", () => {
  it("an adult: the date, how to keep it, and the −30% until that date", () => {
    const e = warningEmail({ stage: "week", eraseAt, adult: true, children: ["Ana <i>"], baseUrl: "https://etutor.ro" });
    expect(e.subject).toBe("Contul tău de pe eTutor.ro se șterge pe 1 octombrie 2026");
    expect(e.html).toContain("e de ajuns să intri în cont");
    expect(e.html).toContain("−30% cât timp rămâi abonat, dacă activezi până pe 1 octombrie 2026");
    expect(e.html).toContain("contul copilului: Ana &lt;i&gt;");
    expect(e.html).toContain("/ro/dashboard/packages?plan=FAMILY");
    // An offer by e-mail says how to stop offers.
    expect(e.html).toContain("Nu mai vrei oferte de la noi?");
    expect(e.html).toContain("/ro/dashboard/settings/notifications");
  });
  it("an adult who learns: the offer leads to Elev", () => {
    const e = warningEmail({ stage: "month", eraseAt, adult: true, children: [], baseUrl: "https://etutor.ro", plan: "ELEV" });
    expect(e.html).toContain("/ro/dashboard/packages?plan=ELEV");
  });
  it("someone who may be a child: no price, no offer, no sales link", () => {
    const e = warningEmail({ stage: "day", eraseAt, adult: false, children: [], baseUrl: "https://etutor.ro" });
    expect(e.subject).toBe("Ultima zi: contul tău de pe eTutor.ro se șterge pe 1 octombrie 2026");
    expect(e.html).not.toMatch(/%|lei|abonat|packages|reactivez/i);
    expect(e.html).toContain("/ro/auth/signin");
  });
});
