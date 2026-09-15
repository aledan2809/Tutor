import { describe, it, expect } from "vitest";
import { checkVoucherForCheckout, normalizeVoucherCode, type VoucherForCheckout } from "@/lib/voucher-checkout";

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
