import { describe, it, expect } from "vitest";
import {
  checkJoinCode,
  isJoinCodeUsable,
  usesLeft,
  expiryFromDays,
  DEFAULT_EXPIRY_DAYS,
  MAX_EXPIRY_DAYS,
} from "@/lib/join-code-policy";

const NOW = new Date("2026-09-07T12:00:00Z");
const later = (min: number) => new Date(NOW.getTime() + min * 60_000);

describe("checkJoinCode — un cod nu mai are voie să fie o cheie eternă", () => {
  it("un cod fără termen și fără limită rămâne bun", () => {
    expect(checkJoinCode({ expiresAt: null, maxUses: null, uses: 999 }, NOW)).toBe("ok");
  });

  it("expirat înseamnă expirat, inclusiv fix la secunda termenului", () => {
    expect(checkJoinCode({ expiresAt: later(-1), maxUses: null, uses: 0 }, NOW)).toBe("expired");
    expect(checkJoinCode({ expiresAt: NOW, maxUses: null, uses: 0 }, NOW)).toBe("expired");
    expect(checkJoinCode({ expiresAt: later(1), maxUses: null, uses: 0 }, NOW)).toBe("ok");
  });

  it("epuizat la fix numărul de folosiri, nu după", () => {
    expect(checkJoinCode({ expiresAt: null, maxUses: 3, uses: 2 }, NOW)).toBe("ok");
    expect(checkJoinCode({ expiresAt: null, maxUses: 3, uses: 3 }, NOW)).toBe("exhausted");
    expect(checkJoinCode({ expiresAt: null, maxUses: 3, uses: 4 }, NOW)).toBe("exhausted");
  });

  it("un cod cu 0 folosiri permise e mort din start", () => {
    expect(checkJoinCode({ expiresAt: null, maxUses: 0, uses: 0 }, NOW)).toBe("exhausted");
  });

  it("expirarea se verifică înaintea epuizării — un cod expirat nu e „epuizat”", () => {
    expect(checkJoinCode({ expiresAt: later(-1), maxUses: 1, uses: 5 }, NOW)).toBe("expired");
  });

  it("isJoinCodeUsable e doar verdictul „ok”", () => {
    expect(isJoinCodeUsable({ expiresAt: later(10), maxUses: 5, uses: 1 }, NOW)).toBe(true);
    expect(isJoinCodeUsable({ expiresAt: later(-10), maxUses: 5, uses: 1 }, NOW)).toBe(false);
  });
});

describe("expiryFromDays", () => {
  it("null înseamnă explicit fără termen", () => {
    expect(expiryFromDays(null, NOW)).toBeNull();
  });

  it("adaugă zilele cerute", () => {
    const d = expiryFromDays(30, NOW)!;
    expect(Math.round((d.getTime() - NOW.getTime()) / 86_400_000)).toBe(30);
  });

  it("nu lasă un termen sub o zi și nici peste plafon", () => {
    expect(expiryFromDays(0, NOW)!.getTime()).toBe(expiryFromDays(1, NOW)!.getTime());
    expect(expiryFromDays(-5, NOW)!.getTime()).toBe(expiryFromDays(1, NOW)!.getTime());
    expect(expiryFromDays(99_999, NOW)!.getTime()).toBe(expiryFromDays(MAX_EXPIRY_DAYS, NOW)!.getTime());
  });

  it("implicitul e o lună, nu „pentru totdeauna”", () => {
    expect(DEFAULT_EXPIRY_DAYS).toBe(30);
  });
});

describe("usesLeft — ce vede adminul", () => {
  it("nelimitat rămâne nelimitat", () => {
    expect(usesLeft({ expiresAt: null, maxUses: null, uses: 7 })).toBeNull();
  });
  it("scade, dar nu sub zero", () => {
    expect(usesLeft({ expiresAt: null, maxUses: 10, uses: 3 })).toBe(7);
    expect(usesLeft({ expiresAt: null, maxUses: 10, uses: 12 })).toBe(0);
  });
});
