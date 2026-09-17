import { describe, it, expect } from "vitest";
import {
  checkVoucherForCheckout,
  discountedMinorUnits,
  normalizeVoucherCode,
  plausibleVoucherCode,
  previewAppliesToPlan,
  previewVoucher,
  type VoucherForCheckout,
} from "@/lib/voucher-checkout";

// V126S as decided for the flyer: 25%, every month, one use per account, Family only, until 30.11.2026 (RO).
const v126s: VoucherForCheckout = {
  id: "v1",
  discountPercent: 25,
  isActive: true,
  expiresAt: new Date("2026-11-30T23:59:59+02:00"),
  maxUses: null,
  usedCount: 0,
  recurring: true,
  oncePerUser: true,
  planKey: "FAMILY",
};
const beforeEnd = new Date("2026-10-01T12:00:00+03:00");
const family = { alreadyUsedByUser: false, planKey: "FAMILY", now: beforeEnd };

describe("voucherul flyerului (V126S)", () => {
  it("prima folosire pe cont, pe Family: reducere pe fiecare plată (forever)", () => {
    const r = checkVoucherForCheckout(v126s, family);
    expect(r).toEqual({ ok: true, coupon: { percentOff: 25, duration: "forever", metadata: { voucherId: "v1" } } });
  });
  it("același cont, a doua oară (a renunțat și revine): refuzat", () => {
    expect(checkVoucherForCheckout(v126s, { ...family, alreadyUsedByUser: true })).toMatchObject({
      ok: false,
      code: "VOUCHER_ALREADY_USED",
    });
  });
  it("pe alt plan decât Family (ex. Family Duo): refuzat, cu planul corect în răspuns", () => {
    expect(checkVoucherForCheckout(v126s, { ...family, planKey: "FAMILY_DUO" })).toMatchObject({
      ok: false,
      code: "VOUCHER_WRONG_PLAN",
      planKey: "FAMILY",
    });
    expect(checkVoucherForCheckout(v126s, { ...family, planKey: null })).toMatchObject({ ok: false, code: "VOUCHER_WRONG_PLAN" });
  });
  it("30 noiembrie, ultima secundă, încă merge; 1 decembrie nu", () => {
    expect(checkVoucherForCheckout(v126s, { ...family, now: new Date("2026-11-30T23:59:58+02:00") }).ok).toBe(true);
    expect(checkVoucherForCheckout(v126s, { ...family, now: new Date("2026-12-01T00:00:01+02:00") })).toMatchObject({
      ok: false,
      code: "VOUCHER_EXPIRED",
    });
  });
});

describe("voucherele fără setările noi se comportă ca înainte", () => {
  const plain: VoucherForCheckout = { ...v126s, recurring: false, oncePerUser: false, planKey: null, expiresAt: null };
  it("reducerea se aplică doar primei plăți (once), pe orice plan", () => {
    const r = checkVoucherForCheckout(plain, { alreadyUsedByUser: false, planKey: "TRIO" });
    expect(r.ok && r.coupon.duration).toBe("once");
  });
  it("folosirea anterioară a aceluiași cont nu contează", () => {
    expect(checkVoucherForCheckout(plain, { alreadyUsedByUser: true, planKey: "FAMILY" }).ok).toBe(true);
  });
  it("un cod de 100% nu devine niciodată gratuit pe viață, chiar bifat „la fiecare plată”", () => {
    const r = checkVoucherForCheckout({ ...plain, discountPercent: 100, recurring: true }, { alreadyUsedByUser: false, planKey: "FAMILY" });
    expect(r.ok && r.coupon.duration).toBe("once");
  });
});

describe("refuzuri", () => {
  it("cod inexistent sau dezactivat", () => {
    expect(checkVoucherForCheckout(null, family)).toMatchObject({ ok: false, code: "VOUCHER_INVALID" });
    expect(checkVoucherForCheckout({ ...v126s, isActive: false }, family)).toMatchObject({ ok: false, code: "VOUCHER_INVALID" });
  });
  it("limita globală de utilizări atinsă", () => {
    expect(checkVoucherForCheckout({ ...v126s, maxUses: 3, usedCount: 3 }, family)).toMatchObject({
      ok: false,
      code: "VOUCHER_LIMIT_REACHED",
    });
  });
});

describe("codul tastat de om", () => {
  it("litere mici și spații se potrivesc cu codul salvat", () => {
    expect(normalizeVoucherCode("  v126s ")).toBe("V126S");
  });
  it("orice altceva decât text devine gol (fără voucher)", () => {
    expect(normalizeVoucherCode(undefined)).toBe("");
    expect(normalizeVoucherCode(42)).toBe("");
  });
});

describe("înainte de plată: ce preț are voie pagina să arate", () => {
  const onv126s = { ...v126s, id: "v2", code: "ONV126S" };
  const opts = { alreadyUsedByUser: false, now: beforeEnd };

  it("codul online are aceleași condiții ca al flyerului: 25%, la fiecare plată, doar Family", () => {
    expect(previewVoucher(onv126s, opts)).toEqual({
      ok: true,
      preview: { code: "ONV126S", discountPercent: 25, recurring: true, planKey: "FAMILY", expiresAt: v126s.expiresAt },
    });
  });
  it("prețul redus e exact cel de pe pagina de plată: 33,20 lei minus 25% = 24,90 lei", () => {
    expect(discountedMinorUnits(3320, 25)).toBe(2490);
  });
  it("reducerea se arată doar pe planul pe care îl numește codul", () => {
    const r = previewVoucher(onv126s, opts);
    if (!r.ok) throw new Error("expected a preview");
    expect(previewAppliesToPlan(r.preview, "FAMILY")).toBe(true);
    expect(previewAppliesToPlan(r.preview, "FAMILY_DUO")).toBe(false);
    expect(previewAppliesToPlan({ ...r.preview, planKey: null }, "TRIO")).toBe(true);
  });
  it("un cod deja folosit pe cont, expirat sau oprit nu mai arată nicio reducere", () => {
    expect(previewVoucher(onv126s, { ...opts, alreadyUsedByUser: true })).toMatchObject({ ok: false, code: "VOUCHER_ALREADY_USED" });
    expect(previewVoucher(onv126s, { ...opts, now: new Date("2026-12-01T00:00:01+02:00") })).toMatchObject({
      ok: false,
      code: "VOUCHER_EXPIRED",
    });
    expect(previewVoucher({ ...onv126s, isActive: false }, opts)).toMatchObject({ ok: false, code: "VOUCHER_INVALID" });
    expect(previewVoucher(null, opts)).toMatchObject({ ok: false, code: "VOUCHER_INVALID" });
  });
  it("folosirea codului de pe flyer nu blochează codul online: fiecare se verifică separat", () => {
    // alreadyUsedByUser e calculat pe voucherul cerut, deci V126S folosit nu atinge ONV126S.
    expect(previewVoucher(onv126s, { ...opts, alreadyUsedByUser: false }).ok).toBe(true);
  });
  it("un cod de acces gratuit (100%) nu se afișează ca reducere: are pagina lui de activare", () => {
    expect(previewVoucher({ ...onv126s, discountPercent: 100 }, opts)).toMatchObject({ ok: false, code: "VOUCHER_FREE_ACCESS" });
  });
  it("aceeași ordine a refuzurilor ca la plată", () => {
    expect(checkVoucherForCheckout({ ...v126s, isActive: false, expiresAt: new Date("2020-01-01") }, family)).toMatchObject({
      code: "VOUCHER_INVALID",
    });
    expect(previewVoucher({ ...onv126s, isActive: false, expiresAt: new Date("2020-01-01") }, opts)).toMatchObject({
      code: "VOUCHER_INVALID",
    });
  });
});

describe("ce poate apărea ca „cod inclus” pe pagina de înscriere (review r6, S4)", () => {
  it("codurile noastre trec", () => {
    expect(plausibleVoucherCode(normalizeVoucherCode(" v126s "))).toBe(true);
    expect(plausibleVoucherCode("ONV126S")).toBe(true);
    expect(plausibleVoucherCode("BAC-2026_X")).toBe(true);
  });

  it("text oarecare dintr-un link nu trece: spații, prea scurt, prea lung", () => {
    expect(plausibleVoucherCode(normalizeVoucherCode("gratuit sunati la 0722000000"))).toBe(false);
    expect(plausibleVoucherCode("AB")).toBe(false);
    expect(plausibleVoucherCode("A".repeat(51))).toBe(false);
    expect(plausibleVoucherCode("")).toBe(false);
    expect(plausibleVoucherCode("<B>X</B>")).toBe(false);
  });
});
