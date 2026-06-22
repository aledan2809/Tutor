import { describe, it, expect } from "vitest";
import {
  isRestrictedDomainSlug,
  canSeeRestrictedDomains,
  canAccessDomain,
  RESTRICTED_DOMAIN_ALLOWLIST,
} from "@/lib/domain-access";

const RARES = RESTRICTED_DOMAIN_ALLOWLIST[0];

describe("domain access control", () => {
  describe("isRestrictedDomainSlug", () => {
    it("non-curriculum slugs are restricted", () => {
      expect(isRestrictedDomainSlug("aviation")).toBe(true);
      expect(isRestrictedDomainSlug("drept")).toBe(true);
    });
    it("curriculum slugs (exam-level) are NOT restricted", () => {
      expect(isRestrictedDomainSlug("matematica-v-viii")).toBe(false);
      expect(isRestrictedDomainSlug("romana-ix-xii")).toBe(false);
    });
  });

  describe("canSeeRestrictedDomains", () => {
    it("false for null / plain student", () => {
      expect(canSeeRestrictedDomains(null)).toBe(false);
      expect(
        canSeeRestrictedDomains({ email: "a@b.ro", isSuperAdmin: false, enrollments: [] })
      ).toBe(false);
    });
    it("true for superadmin", () => {
      expect(canSeeRestrictedDomains({ isSuperAdmin: true })).toBe(true);
    });
    it("true for an ADMIN-role enrollment", () => {
      expect(
        canSeeRestrictedDomains({ enrollments: [{ domainId: "d1", roles: ["ADMIN"] }] })
      ).toBe(true);
    });
    it("true for an allowlisted email", () => {
      expect(canSeeRestrictedDomains({ email: RARES })).toBe(true);
    });
    it("INSTRUCTOR role alone does NOT grant it", () => {
      expect(
        canSeeRestrictedDomains({ enrollments: [{ domainId: "d1", roles: ["INSTRUCTOR"] }] })
      ).toBe(false);
    });
  });

  describe("canAccessDomain", () => {
    const plain = { email: "x@y.ro", isSuperAdmin: false, enrollments: [] };

    it("curriculum domains are open to everyone (even plain students)", () => {
      expect(canAccessDomain(plain, "matematica-v-viii", "d-mate")).toBe(true);
      expect(canAccessDomain(null, "romana-ix-xii", "d-ro")).toBe(true);
    });

    it("restricted domain blocked for a non-enrolled plain student", () => {
      expect(canAccessDomain(plain, "aviation", "d-avi")).toBe(false);
      expect(canAccessDomain(null, "aviation", "d-avi")).toBe(false);
    });

    it("restricted domain allowed for the allowlisted user (Rares)", () => {
      expect(canAccessDomain({ email: RARES }, "aviation", "d-avi")).toBe(true);
    });

    it("restricted domain allowed for superadmin", () => {
      expect(canAccessDomain({ isSuperAdmin: true }, "aviation", "d-avi")).toBe(true);
    });

    it("restricted domain allowed for a user enrolled in THAT domain (no regression)", () => {
      expect(
        canAccessDomain(
          { email: "z@y.ro", enrollments: [{ domainId: "d-avi", roles: ["STUDENT"] }] },
          "aviation",
          "d-avi"
        )
      ).toBe(true);
    });

    it("enrollment in a DIFFERENT restricted domain does not grant access", () => {
      expect(
        canAccessDomain(
          { email: "z@y.ro", enrollments: [{ domainId: "d-other", roles: ["STUDENT"] }] },
          "aviation",
          "d-avi"
        )
      ).toBe(false);
    });
  });
});
