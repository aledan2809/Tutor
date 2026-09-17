import { describe, it, expect, vi } from "vitest";

// The pure parts only; the senders stay out of the test.
vi.mock("@/lib/escalation/parent-monitor", () => ({ deliverParentAlert: vi.fn(), userInQuietHours: vi.fn() }));

import { dueLifecycleStage, lifecycleCopy, STOP_LINE, type LifecycleStage } from "@/lib/access-lifecycle";
import type { Access } from "@/lib/access";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-09-25T10:00:00Z");
const switchOn = new Date("2026-09-21T06:00:00Z");
const none = new Set<LifecycleStage>();
const trial = (daysLeft: number, via: "own" | "family" = "own"): Access => ({
  kind: "trial",
  daysLeft,
  via,
  endsAt: new Date(now.getTime() + daysLeft * DAY),
});

describe("ce mesaj din probă e scadent", () => {
  it("nimic cât timp comutatorul e oprit (n-ar fi adevărat că urmează pauza)", () => {
    expect(dueLifecycleStage({ access: trial(3), createdAt: now, pauseStartsAt: null, now, sent: none })).toBeNull();
  });

  it("contul mai vechi decât comutatorul primește anunțul de lansare, o singură dată", () => {
    const old = new Date("2026-05-01T00:00:00Z");
    expect(dueLifecycleStage({ access: trial(6), createdAt: old, pauseStartsAt: switchOn, now, sent: none })).toBe("launch");
    expect(dueLifecycleStage({ access: trial(6), createdAt: old, pauseStartsAt: switchOn, now, sent: new Set(["launch"]) })).toBeNull();
  });

  it("un cont nou (creat după comutator) nu primește anunțul de lansare", () => {
    const fresh = new Date("2026-09-24T08:00:00Z");
    expect(dueLifecycleStage({ access: trial(6), createdAt: fresh, pauseStartsAt: switchOn, now, sent: none })).toBeNull();
  });

  it("cu 3 zile înainte, apoi în ultima zi — fiecare o dată", () => {
    const at = { createdAt: switchOn, pauseStartsAt: switchOn, now };
    expect(dueLifecycleStage({ ...at, access: trial(3), sent: new Set(["launch"]) })).toBe("three_days");
    expect(dueLifecycleStage({ ...at, access: trial(3), sent: new Set(["launch", "three_days"]) })).toBeNull();
    expect(dueLifecycleStage({ ...at, access: trial(1), sent: new Set(["launch", "three_days"]) })).toBe("last_day");
    expect(dueLifecycleStage({ ...at, access: trial(1), sent: new Set(["last_day"]) })).toBeNull();
  });

  it("o rulare întârziată trimite doar mesajul cel mai potrivit, nu o rafală", () => {
    // Launch never went out and there's one day left: only the last-day message.
    expect(dueLifecycleStage({ access: trial(1), createdAt: switchOn, pauseStartsAt: switchOn, now, sent: none })).toBe("last_day");
    // The last-day message went out: no 3-day message after it.
    expect(dueLifecycleStage({ access: trial(2), createdAt: switchOn, pauseStartsAt: switchOn, now, sent: new Set(["last_day"]) })).toBeNull();
  });

  it("proba de familie a unui copil nu e a părintelui: fără mesaj pe contul copilului", () => {
    expect(dueLifecycleStage({ access: trial(3, "family"), createdAt: switchOn, pauseStartsAt: switchOn, now, sent: none })).toBeNull();
  });

  it("ziua 8: „contul e în pauză”, o dată, și nu pentru o pauză veche", () => {
    const paused = (sinceDaysAgo: number): Access => ({ kind: "paused", since: new Date(now.getTime() - sinceDaysAgo * DAY), payer: "self" });
    expect(dueLifecycleStage({ access: paused(0.2), createdAt: switchOn, pauseStartsAt: switchOn, now, sent: none })).toBe("paused");
    expect(dueLifecycleStage({ access: paused(0.2), createdAt: switchOn, pauseStartsAt: switchOn, now, sent: new Set(["paused"]) })).toBeNull();
    expect(dueLifecycleStage({ access: paused(5), createdAt: switchOn, pauseStartsAt: switchOn, now, sent: none })).toBeNull();
  });

  it("cine plătește sau e „Gratuit permanent” nu primește nimic", () => {
    const full: Access = { kind: "full", reason: "free_forever" };
    expect(dueLifecycleStage({ access: full, createdAt: switchOn, pauseStartsAt: switchOn, now, sent: none })).toBeNull();
  });
});

describe("textul mesajelor", () => {
  const offer = { planKey: "FAMILY" as const, normal: 33.2, price: 24.9, code: "V126S" };
  const andrei = { name: "Andrei", stats: { exercises: 31, practicedDays: 4, streak: 3, level: null, weakTopics: 2 } };

  it("cu 3 zile înainte: ce a lucrat copilul, prețul cu codul, fără presiune falsă", () => {
    const c = lifecycleCopy({ stage: "three_days", daysLeft: 3, kids: [andrei], offer });
    expect(c.title).toBe("Mai ai 3 zile din proba gratuită");
    expect(c.message).toContain("Andrei a exersat în 4 zile: 31 de exerciții.");
    expect(c.message).toContain("Greșește des la 2 capitole.");
    expect(c.message).toContain("24,90 lei/lună cu codul V126S");
    expect(c.message).toContain("Anulezi oricând.");
  });

  it("ultima zi: spune ce se oprește și ce rămâne", () => {
    // 10:00 UTC = 13:00 in Bucharest; the week ends tomorrow at 09:30 Bucharest time.
    const c = lifecycleCopy({ stage: "last_day", daysLeft: 1, kids: [andrei], offer, endsAt: new Date("2026-09-26T06:30:00Z"), now });
    expect(c.title).toBe("Proba gratuită se încheie mâine la 09:30");
    expect(c.message).toContain("Mâine la 09:30, fără abonament, contul intră în pauză: Andrei nu mai poate exersa");
    expect(c.message).toContain("rămâne salvat");
    expect(c.button).toBe("Păstrez accesul");
  });

  it("ultima zi, când săptămâna s-a pornit seara: pauza vine azi, nu „mâine”", () => {
    const c = lifecycleCopy({ stage: "last_day", daysLeft: 1, kids: [andrei], offer, endsAt: new Date("2026-09-25T18:30:00Z"), now });
    expect(c.title).toBe("Proba gratuită se încheie azi la 21:30");
    expect(c.message).not.toContain("mâine");
  });

  it("ultima zi: un copil cu săptămâna lui mai lungă nu e dat drept oprit; fără copil, nimic despre copii", () => {
    const later = { ...andrei, name: "Ioana", pausesWithParent: false };
    const c = lifecycleCopy({ stage: "last_day", daysLeft: 1, kids: [andrei, later], offer, endsAt: new Date("2026-09-26T06:30:00Z"), now });
    expect(c.message).toContain("Andrei nu mai poate exersa");
    expect(c.message).not.toContain("Ioana nu mai poate");
    expect(c.message).not.toContain("copiii nu mai pot");
    const none = lifecycleCopy({ stage: "last_day", daysLeft: 1, kids: [], offer, endsAt: new Date("2026-09-26T06:30:00Z"), now });
    expect(none.message).not.toMatch(/nu mai pot(ea)? exersa/);
    expect(none.message).toContain("contul intră în pauză: tu nu mai vezi progresul");
  });

  it("lansarea spune până când, nu „de azi”", () => {
    const c = lifecycleCopy({ stage: "launch", daysLeft: 7, kids: [], offer, endsAt: new Date("2026-09-28T19:00:00Z"), now });
    expect(c.message).toContain("Până pe 28 septembrie, la 22:00, ai tot pachetul Family");
  });

  it("exerciții fără nicio sesiune încheiată: fără „în 0 zile”", () => {
    const answeredOnly = { name: "Mara", stats: { exercises: 12, practicedDays: 0, streak: 0, level: null, weakTopics: 0 } };
    const c = lifecycleCopy({ stage: "three_days", daysLeft: 3, kids: [answeredOnly], offer });
    expect(c.message).toContain("Mara a rezolvat 12 exerciții în perioada de probă.");
    expect(c.message).not.toContain("0 zile");
  });

  it("forme corecte în română: într-o zi, un exercițiu, 20 de exerciții", () => {
    const one = { name: "Ioana", stats: { exercises: 1, practicedDays: 1, streak: 1, level: null, weakTopics: 1 } };
    expect(lifecycleCopy({ stage: "three_days", daysLeft: 2, kids: [one], offer: null }).message).toContain(
      "Ioana a exersat într-o zi: un exercițiu. Greșește des la un capitol.",
    );
    const twenty = { name: null, stats: { exercises: 20, practicedDays: 2, streak: 0, level: null, weakTopics: 0 } };
    expect(lifecycleCopy({ stage: "paused", daysLeft: 0, kids: [twenty], offer: null }).message).toContain("Copilul tău a exersat în 2 zile: 20 de exerciții.");
  });

  it("fără copil legat: îl trimite să-l lege, nu inventează cifre", () => {
    const c = lifecycleCopy({ stage: "three_days", daysLeft: 3, kids: [], offer });
    expect(c.message).toContain("Leagă-ți copilul");
  });

  it("fiecare mesaj spune la final cum se oprește (au preț și buton de plată)", () => {
    for (const stage of ["launch", "three_days", "last_day", "paused"] as const) {
      expect(lifecycleCopy({ stage, daysLeft: 3, kids: [andrei], offer, endsAt: new Date("2026-09-26T06:30:00Z"), now }).message.endsWith(STOP_LINE)).toBe(true);
    }
    expect(STOP_LINE).toContain("eTutor.ro/ro/dashboard/settings/notifications");
  });

  it("niciun text nu i se adresează copilului și niciunul nu spune „AI”", () => {
    for (const stage of ["launch", "three_days", "last_day", "paused"] as const) {
      const c = lifecycleCopy({ stage, daysLeft: 3, kids: [andrei], offer });
      const text = `${c.title} ${c.message} ${c.button}`;
      // Case-sensitive: Romanian „ai" (you have) is not the acronym.
      expect(text).not.toMatch(/\bAI\b/);
      expect(text).not.toMatch(/roagă-ți părinții|cere-le părinților|spune-le părinților/i);
    }
  });
});
