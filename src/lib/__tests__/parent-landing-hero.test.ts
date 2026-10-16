import { describe, it, expect } from "vitest";
import { landingCopy, type LandingFacts } from "@/components/parinte/landing-copy";
import { checkoutDiscount, subjectMonthlyMinor } from "@/lib/checkout-price";
import { familyLandingOffer } from "@/lib/parent-landing";
import { nextPathAfterSignup, safeReturnTo } from "@/lib/signup-next-path";
import type { VoucherForCheckout } from "@/lib/voucher-checkout";

// The top of the parents' page (review 16.10.2026): the price it shows must be what checkout charges.

const facts: LandingFacts = {
  freeTrialDays: 7,
  trialTotalDays: 7,
  pauseOn: true,
  chain: [],
  graceMorningMin: 15,
  graceEveningMin: 10,
  quietStart: "22:00",
  quietEnd: "07:00",
  gentleEmailAfterMin: 60,
  standardStepMin: 30,
  insistentStepMin: 15,
  parentAlertAfterMin: 90,
  parentRenotifyMin: 60,
  nudgeMaxAgeHours: 4,
  nudgeMaxFires: 6,
  onTimeWindowMin: 30,
  secondChildPct: 20,
  thirdChildPct: 30,
  secondSubjectPct: 15,
  thirdSubjectPct: 25,
};

const v126s: VoucherForCheckout & { code: string } = {
  id: "v1",
  code: "V126S",
  discountPercent: 25,
  isActive: true,
  expiresAt: new Date("2026-11-30T23:59:59+02:00"),
  maxUses: null,
  usedCount: 0,
  recurring: true,
  oncePerUser: true,
  planKey: "FAMILY",
};
const now = new Date("2026-10-16T10:00:00+03:00");
const offer = familyLandingOffer(v126s, 3320, now);

/** What the page computes (parinte/page.tsx), with the same functions as checkout. */
const firstWeek = (o: typeof offer) =>
  subjectMonthlyMinor(3320, 1, checkoutDiscount({ trialActive: true, code: o ? { percent: o.percentOff, renews: o.recurring } : null, telegram: false }).pricesPercent);

const base = {
  facts,
  channel: "flyer" as const,
  familyNormalMinor: 3320,
  codesAlike: true,
  flyerCode: "V126S",
  onlineCode: "ONV126S",
  codeFamilyOnly: true,
  signedIn: false,
};

describe("prețul din capul paginii", () => {
  it("în probă, plata cere 23,24: −30% bate codul de −25%, nu se adună", () => {
    expect(firstWeek(offer)).toBe(2324);
  });

  it("vizitator nou cu V126S: sub 1 leu pe zi, 23,24 în probă, 24,90 după, Family spus", () => {
    const c = landingCopy("ro", { ...base, offer, trialOfferMinor: firstWeek(offer) });
    expect(c.hero.perDay).toBe("sub 1 leu pe zi");
    expect(c.hero.bigPrice).toBe("sub 1 leu pe zi");
    expect(c.hero.priceDetail).toContain("23,24 lei pe lună dacă plătești cât ține proba");
    expect(c.hero.priceDetail).toContain("24,90 lei cu codul V126S, în loc de 33,20");
    expect(c.hero.priceDetail).toContain("Family: 1 părinte, 1 copil, o materie.");
  });

  it("butonul de plată spune suma pe care o cere plata: 23,24 în probă", () => {
    const c = landingCopy("ro", { ...base, offer, trialOfferMinor: firstWeek(offer) });
    expect(c.hero.ctaPay).toBe("Începe cu 23,24 lei/lună");
  });

  it("cont fără probă rămasă: 24,90 cu codul, fără 23,24", () => {
    const c = landingCopy("ro", { ...base, offer, signedIn: true, facts: { ...facts, freeTrialDays: 0 }, trialOfferMinor: null });
    expect(c.hero.priceDetail).not.toContain("23,24");
    expect(c.hero.priceDetail.startsWith("24,90 lei pe lună cu codul V126S")).toBe(true);
    expect(c.hero.ctaPay).toBe("Începe cu 24,90 lei/lună");
    expect(c.hero.after).toBeNull();
  });

  it("fără cod și fără probă: 33,20 nu e sub 1 leu pe zi, deci se arată prețul lunar", () => {
    const c = landingCopy("ro", { ...base, offer: null, signedIn: true, facts: { ...facts, freeTrialDays: 0 }, trialOfferMinor: null });
    expect(c.hero.perDay).toBeNull();
    expect(c.hero.bigPrice).toBe("33,20 lei / lună");
  });

  it("un preț din probă care nu e mai mic decât cel cu codul nu se arată", () => {
    const c = landingCopy("ro", { ...base, offer, trialOfferMinor: 2490 });
    expect(c.hero.priceDetail).not.toContain("dacă plătești cât ține proba");
  });

  it("cont logat (probă sau revenire): spune data până la care ține prețul, nu „cât ține proba”", () => {
    const c = landingCopy("ro", { ...base, offer, signedIn: true, trialOfferMinor: firstWeek(offer), trialOfferUntil: new Date("2026-10-21T09:23:00+03:00") });
    expect(c.hero.priceDetail).toContain("23,24 lei pe lună dacă plătești până pe 21 octombrie");
    expect(c.hero.priceDetail).not.toContain("cât ține proba");
  });

  it("în engleză, aceleași sume", () => {
    const c = landingCopy("en", { ...base, offer, trialOfferMinor: firstWeek(offer) });
    expect(c.hero.perDay).toBe("under 1 leu a day");
    expect(c.hero.priceDetail).toContain("23.24");
  });
});

describe("unde ajunge un cont nou (formular și Google)", () => {
  it("proba fără card duce la „Familia mea”", () => {
    expect(nextPathAfterSignup({ plan: "FAMILY", voucherCode: "V126S", voucherApplied: false, start: "free" })).toBe("/dashboard/family");
  });
  it("plata acum duce la Abonament cu planul și codul", () => {
    expect(nextPathAfterSignup({ plan: "FAMILY", voucherCode: "V126S", voucherApplied: false, start: null })).toBe(
      "/dashboard/packages?plan=FAMILY&voucher=V126S",
    );
  });
  it("un cod neverificat încă duce tot la Abonament, unde se verifică", () => {
    expect(nextPathAfterSignup({ plan: "FAMILY", voucherCode: "V126S", voucherApplied: false, start: "free", voucherDeferred: true })).toBe(
      "/dashboard/packages?plan=FAMILY&voucher=V126S",
    );
  });
  it("întoarcerea merge doar spre o pagină a site-ului", () => {
    expect(safeReturnTo("/familie/invitatie/abc")).toBe("/familie/invitatie/abc");
    expect(safeReturnTo("//evil.example")).toBeNull();
    expect(safeReturnTo("/\\evil.example")).toBeNull();
    expect(safeReturnTo("https://evil.example")).toBeNull();
    expect(safeReturnTo(null)).toBeNull();
  });
});
