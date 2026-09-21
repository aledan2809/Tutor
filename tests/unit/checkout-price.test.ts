import { describe, it, expect } from "vitest";
import {
  checkoutDiscount,
  childSeatMonthlyMinor,
  combinePercents,
  forInterval,
  lifetimeDiscount,
  planMonthlyMinor,
  subjectLines,
  subjectMonthlyMinor,
  totalMinor,
} from "@/lib/checkout-price";

const FAMILY = 3320; // 33,20 lei

describe("reducerea pe viață: cea mai mare dintre cod și probă, apoi Telegram", () => {
  it("proba (−30%) bate codul (−25%); fără nimic, nicio reducere", () => {
    expect(lifetimeDiscount({ trialActive: true, codePercent: 25, telegram: false })).toEqual({ base: "trial", basePercent: 30, telegram: false, percent: 30 });
    expect(lifetimeDiscount({ trialActive: false, codePercent: 25, telegram: false })).toEqual({ base: "code", basePercent: 25, telegram: false, percent: 25 });
    expect(lifetimeDiscount({ trialActive: false, codePercent: null, telegram: false })).toEqual({ base: null, basePercent: 0, telegram: false, percent: 0 });
  });

  it("Telegram vine peste, nu se adună: 30 apoi 10 = 37; 25 apoi 10 = 32,5; doar Telegram = 10", () => {
    expect(lifetimeDiscount({ trialActive: true, codePercent: null, telegram: true }).percent).toBe(37);
    expect(lifetimeDiscount({ trialActive: false, codePercent: 25, telegram: true }).percent).toBe(32.5);
    expect(lifetimeDiscount({ trialActive: false, codePercent: null, telegram: true })).toEqual({ base: null, basePercent: 0, telegram: true, percent: 10 });
    expect(combinePercents(30, 10)).toBe(37);
  });

  it("cifrele din decizie, pe Family: cod + Telegram 22,41 · probă + Telegram 20,92", () => {
    expect(subjectMonthlyMinor(FAMILY, 1, 32.5)).toBe(2241);
    expect(subjectMonthlyMinor(FAMILY, 1, 37)).toBe(2092);
    expect(subjectMonthlyMinor(FAMILY, 1, 25)).toBe(2490);
    expect(subjectMonthlyMinor(FAMILY, 1, 30)).toBe(2324);
  });
});

describe("cum pleacă reducerea la plată", () => {
  it("codul care se reînnoiește (V126S) intră în prețuri, pe viață, și e consumat", () => {
    expect(checkoutDiscount({ trialActive: false, code: { percent: 25, renews: true }, telegram: true })).toEqual({
      pricesPercent: 32.5,
      onceCouponPercent: null,
      codeUsed: true,
      base: "code",
      telegram: true,
      firstPaymentPercent: 32.5,
    });
  });

  it("în probă, proba câștigă și codul nu se consumă (rămâne pentru mai târziu)", () => {
    const d = checkoutDiscount({ trialActive: true, code: { percent: 25, renews: true }, telegram: false });
    expect(d).toMatchObject({ pricesPercent: 30, codeUsed: false, base: "trial", onceCouponPercent: null });
  });

  it("un cod care nu se reînnoiește (bun venit prin recomandare) doar la prima plată, și doar dacă bate proba", () => {
    expect(checkoutDiscount({ trialActive: false, code: { percent: 25, renews: false }, telegram: true })).toEqual({
      pricesPercent: 10,
      onceCouponPercent: 25,
      codeUsed: true,
      base: "code",
      telegram: true,
      firstPaymentPercent: 32.5,
    });
    expect(checkoutDiscount({ trialActive: true, code: { percent: 25, renews: false }, telegram: false })).toMatchObject({ pricesPercent: 30, onceCouponPercent: null, codeUsed: false });
  });

  it("un cod de 100% nu se folosește aici (se activează pe altă pagină)", () => {
    expect(checkoutDiscount({ trialActive: false, code: { percent: 100, renews: false }, telegram: false })).toMatchObject({ pricesPercent: 0, codeUsed: false });
  });
});

describe("materiile: a doua −15%, de la a treia −25%, din prețul normal; reducerea pe viață pe toate", () => {
  it("fără reducere: 33,20 · 28,22 · 24,90", () => {
    const lines = subjectLines({ planMonthlyMinor: FAMILY, subjects: 3, lifetimePercent: 0, interval: "MONTH" });
    expect(lines.map((l) => l.minor)).toEqual([3320, 2822, 2490]);
    expect(lines.map((l) => l.subjectPercent)).toEqual([0, 15, 25]);
  });

  it("probă + Telegram pe trei materii (varianta B din machetă): 20,92 + 17,78 + 15,69 = 54,39", () => {
    const lines = subjectLines({ planMonthlyMinor: FAMILY, subjects: 3, lifetimePercent: 37, interval: "MONTH" });
    expect(lines.map((l) => l.minor)).toEqual([2092, 1778, 1569]);
    expect(totalMinor(lines)).toBe(5439);
    expect(lines.map((l) => l.normalMinor)).toEqual([3320, 2822, 2490]);
  });

  it("cel puțin o materie se plătește", () => {
    expect(subjectLines({ planMonthlyMinor: FAMILY, subjects: 0, lifetimePercent: 0, interval: "MONTH" })).toHaveLength(1);
  });
});

describe("anual = 10 luni din prețul lunar cu reducere", () => {
  it("Family cu probă + Telegram: 209,20 lei/an; două materii: 387,00", () => {
    expect(forInterval(subjectMonthlyMinor(FAMILY, 1, 37), "YEAR")).toBe(20920);
    const two = subjectLines({ planMonthlyMinor: FAMILY, subjects: 2, lifetimePercent: 37, interval: "YEAR" });
    expect(totalMinor(two)).toBe(38700);
  });

  it("un rând anual e salvat la 10 luni: luna lui e o zecime", () => {
    expect(planMonthlyMinor({ price: 33200, interval: "YEAR" })).toBe(3320);
    expect(planMonthlyMinor({ price: 3320, interval: "MONTH" })).toBe(3320);
  });
});

describe("copilul în plus: −20% / −30%, apoi reducerea pe viață", () => {
  it("al doilea copil pe Family, cu probă + Telegram", () => {
    // 33,20 − 20% = 26,56 → − 37% = 16,73
    expect(childSeatMonthlyMinor(FAMILY, 2, 37)).toBe(1673);
    expect(childSeatMonthlyMinor(FAMILY, 3, 0)).toBe(2324);
  });
});
