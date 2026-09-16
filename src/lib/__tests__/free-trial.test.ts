import { describe, it, expect } from "vitest";
import { FREE_TRIAL_DAYS, checkoutTrialDays, remainingFreeTrialDays } from "@/lib/free-trial";

const signup = new Date("2026-09-21T18:00:00+03:00");
const at = (days: number, hours = 0) => new Date(signup.getTime() + (days * 24 + hours) * 3600 * 1000);

describe("7 zile gratuite, o singură dată pe cont", () => {
  it("imediat după înscriere: toate cele 7 zile", () => {
    expect(FREE_TRIAL_DAYS).toBe(7);
    expect(remainingFreeTrialDays(signup, at(0))).toBe(7);
    expect(remainingFreeTrialDays(signup, at(0, 23))).toBe(7);
  });
  it("plătește în ziua 3 a contului gratuit: primește doar zilele rămase, nu încă o săptămână", () => {
    expect(remainingFreeTrialDays(signup, at(2, 20))).toBe(5);
    expect(remainingFreeTrialDays(signup, at(3))).toBe(4);
  });
  it("rotunjirea e în favoarea părintelui: niciodată mai puțin de 7×24 de ore în total", () => {
    for (const hoursIn of [1, 30, 71, 100, 160]) {
      const now = at(0, hoursIn);
      const owedDays = remainingFreeTrialDays(signup, now);
      const totalHours = hoursIn + owedDays * 24;
      if (owedDays > 0) expect(totalHours).toBeGreaterThanOrEqual(7 * 24);
    }
  });
  it("după o săptămână: nimic, iar un cont vechi nu primește zile noi", () => {
    expect(remainingFreeTrialDays(signup, at(7))).toBe(0);
    expect(remainingFreeTrialDays(signup, at(400))).toBe(0);
  });
  it("un ceas de server în urmă (înscriere „în viitor”) nu dă mai mult de 7 zile", () => {
    expect(remainingFreeTrialDays(signup, at(0, -5))).toBe(7);
  });
});

describe("zilele cerute paginii de plată", () => {
  it("planul permite 7, contul mai are 4: se cer 4", () => {
    expect(checkoutTrialDays(7, signup, at(3))).toBe(4);
  });
  it("planul vechi cu 14 zile nu mai dă 14: plafonat la ce e dator contul", () => {
    expect(checkoutTrialDays(14, signup, at(0))).toBe(7);
  });
  it("plan fără perioadă gratuită sau cont care și-a consumat săptămâna: 0 (plată imediată)", () => {
    expect(checkoutTrialDays(0, signup, at(0))).toBe(0);
    expect(checkoutTrialDays(null, signup, at(0))).toBe(0);
    expect(checkoutTrialDays(7, signup, at(9))).toBe(0);
  });
});
