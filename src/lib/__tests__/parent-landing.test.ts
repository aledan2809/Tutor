import { describe, it, expect } from "vitest";
import { CASCADE_GRACE_MINUTES, ESCALATION_LEVELS } from "@/lib/escalation/config";
import { chainStepTiming } from "@/components/parinte/landing-copy";
import {
  FLYER_CAMPAIGN,
  familyLandingOffer,
  flyerVoucherCode,
  landingButtonHrefs,
  landingSignupHref,
  onlineVoucherCode,
  pickLandingCode,
  reminderChainForDisplay,
  resolveLandingChannel,
} from "@/lib/parent-landing";
import type { VoucherForCheckout } from "@/lib/voucher-checkout";

const codes = { flyerCode: "V126S", onlineCode: "ONV126S" };

describe("ce cod vede vizitatorul", () => {
  it("de pe flyer (linkul din QR): V126S", () => {
    expect(resolveLandingChannel({ ...codes, voucherParam: "V126S" })).toEqual({ channel: "flyer", code: "V126S" });
    expect(resolveLandingChannel({ ...codes, voucherParam: " v126s " })).toEqual({ channel: "flyer", code: "V126S" });
  });
  it("revine mai târziu fără cod în adresă, dar cu cookie-ul campaniei de pe flyer: tot V126S", () => {
    expect(resolveLandingChannel({ ...codes, campaign: FLYER_CAMPAIGN })).toEqual({ channel: "flyer", code: "V126S" });
  });
  it("oricine altcineva (site, reclame, alt cod în adresă): ONV126S", () => {
    expect(resolveLandingChannel({ ...codes })).toEqual({ channel: "site", code: "ONV126S" });
    expect(resolveLandingChannel({ ...codes, voucherParam: "ALTCEVA" })).toEqual({ channel: "site", code: "ONV126S" });
    expect(resolveLandingChannel({ ...codes, voucherParam: ["V126S", "X"] })).toEqual({ channel: "flyer", code: "V126S" });
    expect(resolveLandingChannel({ ...codes, campaign: "evaluare" })).toEqual({ channel: "site", code: "ONV126S" });
  });
  it("codurile se pot schimba din configurare, fără deploy; implicit V126S și ONV126S", () => {
    expect(flyerVoucherCode({})).toBe("V126S");
    expect(onlineVoucherCode({})).toBe("ONV126S");
    expect(flyerVoucherCode({ CAFEA_VOUCHER: "v227s" })).toBe("V227S");
    expect(onlineVoucherCode({ PARENT_ONLINE_VOUCHER: " onv227s" })).toBe("ONV227S");
  });
});

describe("ce cod vede un părinte deja logat", () => {
  it("codul păstrat pe cont câștigă: părintele de pe flyer rămâne pe V126S chiar dacă vine din meniul site-ului", () => {
    expect(pickLandingCode({ ...codes, channel: "site", pendingCode: "V126S" })).toEqual({ channel: "flyer", code: "V126S", swapped: false });
    expect(pickLandingCode({ ...codes, channel: "flyer", pendingCode: "onv126s" })).toEqual({ channel: "site", code: "ONV126S", swapped: false });
  });
  it("fără cod pe cont: cel al canalului prin care a venit", () => {
    expect(pickLandingCode({ ...codes, channel: "flyer" })).toEqual({ channel: "flyer", code: "V126S", swapped: false });
    expect(pickLandingCode({ ...codes, channel: "site", pendingCode: "ALTCOD" })).toEqual({ channel: "site", code: "ONV126S", swapped: false });
  });
  it("un cod folosit deja pe cont e înlocuit cu celălalt (aceeași ofertă); canalul rămâne cel prin care a venit", () => {
    expect(pickLandingCode({ ...codes, channel: "flyer", usedCodes: new Set(["V126S"]) })).toEqual({ channel: "flyer", code: "ONV126S", swapped: true });
    expect(pickLandingCode({ ...codes, channel: "site", pendingCode: "ONV126S", usedCodes: new Set(["ONV126S"]) })).toEqual({
      channel: "site",
      code: "V126S",
      swapped: true,
    });
  });
  it("ambele coduri folosite: niciun cod, prețul normal", () => {
    expect(pickLandingCode({ ...codes, channel: "flyer", usedCodes: new Set(["V126S", "ONV126S"]) })).toEqual({ channel: "flyer", code: null, swapped: false });
  });
});

describe("oferta din primul ecran", () => {
  const onv126s: VoucherForCheckout & { code: string } = {
    id: "v2",
    code: "ONV126S",
    discountPercent: 25,
    isActive: true,
    expiresAt: new Date("2026-11-30T23:59:59+02:00"),
    maxUses: null,
    usedCount: 0,
    recurring: true,
    oncePerUser: true,
    planKey: "FAMILY",
  };
  const now = new Date("2026-09-22T10:00:00+03:00");

  it("Family 33,20 lei cu codul: 24,90 lei pe lună, la fiecare plată", () => {
    expect(familyLandingOffer(onv126s, 3320, now)).toEqual({
      code: "ONV126S",
      percentOff: 25,
      recurring: true,
      expiresAt: onv126s.expiresAt,
      normalMinor: 3320,
      discountedMinor: 2490,
    });
  });
  it("după 30 noiembrie pagina nu mai promite reducerea (fără deploy)", () => {
    expect(familyLandingOffer(onv126s, 3320, new Date("2026-12-01T00:00:01+02:00"))).toBeNull();
  });
  it("cod lipsă, oprit, de 100% sau pentru alt plan: fără ofertă", () => {
    expect(familyLandingOffer(null, 3320, now)).toBeNull();
    expect(familyLandingOffer({ ...onv126s, isActive: false }, 3320, now)).toBeNull();
    expect(familyLandingOffer({ ...onv126s, discountPercent: 100 }, 3320, now)).toBeNull();
    expect(familyLandingOffer({ ...onv126s, planKey: "TRIO" }, 3320, now)).toBeNull();
  });
  it("fără plan Family activ: fără ofertă", () => {
    expect(familyLandingOffer(onv126s, null, now)).toBeNull();
  });
});

describe("unde duc butoanele", () => {
  it("plata: înscriere cu Family preselectat și codul pus", () => {
    expect(landingSignupHref("ro", { code: "V126S" })).toBe("/ro/auth/register?plan=FAMILY&voucher=V126S");
  });
  it("încercarea fără card: același cod, dar fără plată la final", () => {
    expect(landingSignupHref("en", { code: "ONV126S", start: "free" })).toBe(
      "/en/auth/register?plan=FAMILY&voucher=ONV126S&start=free",
    );
  });
  it("fără ofertă valabilă, butoanele nu mai poartă un cod expirat", () => {
    expect(landingSignupHref("ro", { code: null })).toBe("/ro/auth/register?plan=FAMILY");
  });
  it("vizitatorul fără cont: ambele butoane duc la înscriere", () => {
    expect(landingButtonHrefs("ro", { code: "V126S", signedIn: false })).toEqual({
      pay: "/ro/auth/register?plan=FAMILY&voucher=V126S",
      free: "/ro/auth/register?plan=FAMILY&voucher=V126S&start=free",
    });
  });
  it("cine e deja autentificat nu mai ajunge la înscriere: plata direct în Abonament, cu codul; încercarea la familie", () => {
    expect(landingButtonHrefs("ro", { code: "V126S", signedIn: true })).toEqual({
      pay: "/ro/dashboard/packages?plan=FAMILY&voucher=V126S",
      free: "/ro/dashboard/family",
    });
    expect(landingButtonHrefs("en", { code: null, signedIn: true }).pay).toBe("/en/dashboard/packages?plan=FAMILY");
  });
});

describe("lanțul de remindere, așa cum îl arată pagina", () => {
  const all = { telegram: true, email: true, whatsapp: true, sms: true };

  it("toate canalele pornite: aplicație → Telegram → email → WhatsApp → SMS", () => {
    const chain = reminderChainForDisplay(ESCALATION_LEVELS, all);
    expect(chain.map((s) => s.channel)).toEqual(["PUSH", "TELEGRAM", "EMAIL", "WHATSAPP", "SMS"]);
  });
  it("timpii arătați sunt cei ai reminderului de studiu: dimineața mai des, seara mai rar", () => {
    const chain = reminderChainForDisplay(ESCALATION_LEVELS, all);
    const grace = { morning: CASCADE_GRACE_MINUTES.morning, evening: CASCADE_GRACE_MINUTES.evening };
    const span = `${grace.morning}⁠–⁠${grace.evening}`;
    expect(chainStepTiming(chain[0], 0, "ro", grace)).toBe("imediat");
    expect(chainStepTiming(chain[1], 1, "ro", grace)).toBe(`după ${span} minute`);
    expect(chainStepTiming(chain[2], 2, "ro", grace)).toBe(`după încă ${span} minute`);
    expect(chainStepTiming(chain[4], 4, "en", grace)).toBe(`after another ${span} minutes · at most one a day`);
  });
  it("WhatsApp și SMS apar ca incluse în pachet, celelalte ca gratuite; SMS cel mult unul pe zi", () => {
    const chain = reminderChainForDisplay(ESCALATION_LEVELS, all);
    expect(chain.filter((s) => s.paid).map((s) => s.channel)).toEqual(["WHATSAPP", "SMS"]);
    expect(chain.find((s) => s.channel === "SMS")?.maxPerDay).toBe(1);
  });
  it("un canal oprit pe server nu apare deloc — pagina nu promite ce nu se trimite", () => {
    const chain = reminderChainForDisplay(ESCALATION_LEVELS, { ...all, sms: false, telegram: false });
    expect(chain.map((s) => s.channel)).toEqual(["PUSH", "EMAIL", "WHATSAPP"]);
  });
});
