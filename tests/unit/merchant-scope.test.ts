import { describe, it, expect } from "vitest";
import { isPlatform, domainScopeWhere, ownsDomain, ownsUser, type AdminScope } from "@/lib/merchant-scope";

const PLATFORM: AdminScope = { kind: "PLATFORM", organizationId: null };
const ORG_A: AdminScope = { kind: "ORG", organizationId: "org-a" };
const ORG_B: AdminScope = { kind: "ORG", organizationId: "org-b" };

describe("domainScopeWhere — filtrul care ajunge in Prisma", () => {
  it("superadminul primeste un filtru GOL: interogarile lui raman identice cu inainte", () => {
    expect(domainScopeWhere(PLATFORM)).toEqual({});
  });
  it("un merchant admin primeste exact organizatia lui", () => {
    expect(domainScopeWhere(ORG_A)).toEqual({ organizationId: "org-a" });
  });
});

describe("ownsDomain", () => {
  const platformDomain = { organizationId: null };
  const aDomain = { organizationId: "org-a" };
  const bDomain = { organizationId: "org-b" };

  it("superadminul detine orice materie, inclusiv pe cele ale platformei", () => {
    expect(ownsDomain(PLATFORM, platformDomain)).toBe(true);
    expect(ownsDomain(PLATFORM, aDomain)).toBe(true);
  });
  it("un merchant admin detine doar materiile organizatiei lui", () => {
    expect(ownsDomain(ORG_A, aDomain)).toBe(true);
    expect(ownsDomain(ORG_A, bDomain)).toBe(false);
  });
  it("materiile platformei NU sunt ale niciunui merchant — nici macar ale primului venit", () => {
    expect(ownsDomain(ORG_A, platformDomain)).toBe(false);
    expect(ownsDomain(ORG_B, platformDomain)).toBe(false);
  });
  it("o materie inexistenta nu e a nimanui (null/undefined nu trec ca 'fara organizatie')", () => {
    expect(ownsDomain(ORG_A, null)).toBe(false);
    expect(ownsDomain(ORG_A, undefined)).toBe(false);
    expect(ownsDomain(PLATFORM, null)).toBe(false);
  });
});

describe("ownsUser — aceeasi regula pentru conturi", () => {
  it("merchantul isi vede doar oamenii lui; conturile platformei nu sunt ale lui", () => {
    expect(ownsUser(ORG_A, { organizationId: "org-a" })).toBe(true);
    expect(ownsUser(ORG_A, { organizationId: "org-b" })).toBe(false);
    expect(ownsUser(ORG_A, { organizationId: null })).toBe(false);
    expect(ownsUser(PLATFORM, { organizationId: null })).toBe(true);
  });
});

describe("isPlatform", () => {
  it("separa cele doua feluri de admin", () => {
    expect(isPlatform(PLATFORM)).toBe(true);
    expect(isPlatform(ORG_A)).toBe(false);
  });
});
