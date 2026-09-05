import { describe, it, expect } from "vitest";
import { canSeePrivateDomains, isEnrolledIn, canListDomain } from "@/lib/domain-access";

const PUBLIC = { id: "d-mate", visibility: "PUBLIC" as const, isActive: true };
const PRIVATE = { id: "d-avi", visibility: "PRIVATE" as const, isActive: true };
const OFF = { id: "d-off", visibility: "PUBLIC" as const, isActive: false };

const nobody = null;
const student = { email: "x@y.ro", isSuperAdmin: false, enrollments: [] };
const superadmin = { isSuperAdmin: true };
const domainAdmin = { enrollments: [{ domainId: "d-any", roles: ["ADMIN"] }] };
const instructor = { enrollments: [{ domainId: "d-any", roles: ["INSTRUCTOR"] }] };
// The one student the old email allowlist named. He must keep what he had
// through his ENROLLMENT, not through his address.
const rares = {
  email: "raresdanciulescu9@gmail.com",
  enrollments: [{ domainId: "d-avi", roles: ["STUDENT"] }],
};

describe("canSeePrivateDomains — who sees everything", () => {
  it("nobody and plain students do not", () => {
    expect(canSeePrivateDomains(nobody)).toBe(false);
    expect(canSeePrivateDomains(student)).toBe(false);
  });
  it("superadmin and a domain ADMIN do", () => {
    expect(canSeePrivateDomains(superadmin)).toBe(true);
    expect(canSeePrivateDomains(domainAdmin)).toBe(true);
  });
  it("INSTRUCTOR alone does not", () => {
    expect(canSeePrivateDomains(instructor)).toBe(false);
  });
  it("an email grants nothing on its own — the allowlist is gone", () => {
    expect(canSeePrivateDomains({ email: rares.email })).toBe(false);
  });
});

describe("isEnrolledIn", () => {
  it("reads the session enrollments, exact domain only", () => {
    expect(isEnrolledIn(rares, "d-avi")).toBe(true);
    expect(isEnrolledIn(rares, "d-other")).toBe(false);
    expect(isEnrolledIn(nobody, "d-avi")).toBe(false);
  });
});

describe("canListDomain — what a picker may show", () => {
  it("a PUBLIC domain is listed to everyone, signed in or not", () => {
    expect(canListDomain(nobody, PUBLIC)).toBe(true);
    expect(canListDomain(student, PUBLIC)).toBe(true);
  });

  it("a PRIVATE domain is invisible to a stranger", () => {
    expect(canListDomain(nobody, PRIVATE)).toBe(false);
    expect(canListDomain(student, PRIVATE)).toBe(false);
  });

  it("a PRIVATE domain is listed to someone enrolled in THAT domain", () => {
    expect(canListDomain(rares, PRIVATE)).toBe(true);
  });

  it("enrollment in a DIFFERENT domain does not open a private one", () => {
    const elsewhere = { enrollments: [{ domainId: "d-other", roles: ["STUDENT"] }] };
    expect(canListDomain(elsewhere, PRIVATE)).toBe(false);
  });

  it("admins see private and switched-off domains alike", () => {
    expect(canListDomain(superadmin, PRIVATE)).toBe(true);
    expect(canListDomain(domainAdmin, PRIVATE)).toBe(true);
    expect(canListDomain(superadmin, OFF)).toBe(true);
  });

  it("a switched-off domain is hidden from everyone else, even when enrolled", () => {
    const enrolledInOff = { enrollments: [{ domainId: "d-off", roles: ["STUDENT"] }] };
    expect(canListDomain(student, OFF)).toBe(false);
    expect(canListDomain(enrolledInOff, OFF)).toBe(false);
  });

  it("does not care what the domain is CALLED", () => {
    // The old rule keyed on the slug shape. Two domains with identical slugs
    // and different visibility must now be treated differently.
    const namedLikeSchool = { id: "d-x", visibility: "PRIVATE" as const, isActive: true };
    expect(canListDomain(student, namedLikeSchool)).toBe(false);
    const namedLikeVertical = { id: "d-y", visibility: "PUBLIC" as const, isActive: true };
    expect(canListDomain(student, namedLikeVertical)).toBe(true);
  });
});
