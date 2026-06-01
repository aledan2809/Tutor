import { describe, it, expect } from "vitest";
import {
  generateReferralCode,
  normalizeCode,
  commissionCents,
  payableAt,
  canAttribute,
  referralUrl,
  REFERRAL_COMMISSION_PCT,
  REFERRAL_HOLD_DAYS,
  REFERRAL_COOKIE_MAX_AGE,
} from "@/lib/referral";

describe("Referral — constants", () => {
  it("commission is 50% (matches public /creatori promise)", () => {
    expect(REFERRAL_COMMISSION_PCT).toBe(0.5);
  });
  it("hold window is 30 days", () => {
    expect(REFERRAL_HOLD_DAYS).toBe(30);
  });
  it("cookie lasts 90 days", () => {
    expect(REFERRAL_COOKIE_MAX_AGE).toBe(90 * 24 * 60 * 60);
  });
});

describe("generateReferralCode", () => {
  it("produces an 8-char uppercase code from the unambiguous alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(8);
      // No ambiguous chars: 0, O, 1, I, L
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });

  it("is effectively unique across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateReferralCode());
    // Collisions across 1000 draws from 31^8 space should be ~0
    expect(seen.size).toBeGreaterThan(995);
  });
});

describe("normalizeCode", () => {
  it("trims + uppercases valid codes", () => {
    expect(normalizeCode("  abc123  ")).toBe("ABC123");
  });
  it("rejects null/empty/too-short/too-long/invalid-chars", () => {
    expect(normalizeCode(null)).toBeNull();
    expect(normalizeCode("")).toBeNull();
    expect(normalizeCode("ab")).toBeNull(); // < 4
    expect(normalizeCode("a".repeat(17))).toBeNull(); // > 16
    expect(normalizeCode("abc-123")).toBeNull(); // hyphen
    expect(normalizeCode("abc 123")).toBeNull(); // space
  });
});

describe("commissionCents", () => {
  it("computes 50% of the amount", () => {
    expect(commissionCents(1000)).toBe(500);
    expect(commissionCents(2999)).toBe(1500); // round(1499.5) = 1500
  });
  it("honors a custom pct", () => {
    expect(commissionCents(1000, 0.2)).toBe(200);
  });
  it("returns 0 for non-positive / invalid inputs", () => {
    expect(commissionCents(0)).toBe(0);
    expect(commissionCents(-100)).toBe(0);
    expect(commissionCents(1000, 0)).toBe(0);
    expect(commissionCents(NaN)).toBe(0);
  });
});

describe("payableAt", () => {
  it("adds the 30-day hold by default", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const due = payableAt(from);
    expect(due.getTime() - from.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });
  it("honors a custom hold", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    expect(payableAt(from, 7).getTime() - from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("canAttribute — anti-fraud guards", () => {
  it("rejects when there is no promoter", () => {
    expect(
      canAttribute({ promoterId: null, referredUserId: "u1", referredAlreadyHasReferrer: false })
    ).toEqual({ ok: false, reason: "no_promoter" });
  });
  it("rejects self-referral", () => {
    expect(
      canAttribute({ promoterId: "u1", referredUserId: "u1", referredAlreadyHasReferrer: false })
    ).toEqual({ ok: false, reason: "self_referral" });
  });
  it("rejects a user who already has a referrer", () => {
    expect(
      canAttribute({ promoterId: "u2", referredUserId: "u1", referredAlreadyHasReferrer: true })
    ).toEqual({ ok: false, reason: "already_referred" });
  });
  it("allows a valid first attribution", () => {
    expect(
      canAttribute({ promoterId: "u2", referredUserId: "u1", referredAlreadyHasReferrer: false })
    ).toEqual({ ok: true });
  });
});

describe("referralUrl", () => {
  it("builds an absolute /r/<code> url", () => {
    expect(referralUrl("ABC123", "https://etutor.ro")).toBe("https://etutor.ro/r/ABC123");
  });
  it("strips a trailing slash from the base", () => {
    expect(referralUrl("ABC123", "https://etutor.ro/")).toBe("https://etutor.ro/r/ABC123");
  });
});
