import { describe, it, expect, vi, beforeEach } from "vitest";

// The gate reads the domain and, for private ones, the enrollment. Stub both so
// the rule is exercised without a database.
const findDomain = vi.fn();
const findEnrollment = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    domain: { findUnique: (...a: unknown[]) => findDomain(...a) },
    enrollment: { findUnique: (...a: unknown[]) => findEnrollment(...a) },
  },
}));

import { resolveDomainOrForbid } from "@/lib/domain-gate";

const PUBLIC = { id: "d-pub", slug: "matematica-v-viii", name: "Mate", visibility: "PUBLIC", isActive: true };
const PRIVATE = { id: "d-avi", slug: "aptitudini-aviatie", name: "Aviație", visibility: "PRIVATE", isActive: true };
const OFF = { ...PUBLIC, id: "d-off", slug: "off", isActive: false };

const stranger = { id: "u-stranger", email: "x@y.ro", enrollments: [] };
const superadmin = { id: "u-admin", isSuperAdmin: true };
// Enrolled per the SESSION — the gate must not trust this for private domains.
const claimsEnrolled = { id: "u-claim", enrollments: [{ domainId: "d-avi", roles: ["STUDENT"] }] };

async function statusOf(r: Awaited<ReturnType<typeof resolveDomainOrForbid>>) {
  if (r.ok) return "ok";
  return `${r.response.status} ${JSON.stringify(await r.response.json())}`;
}

beforeEach(() => {
  findDomain.mockReset();
  findEnrollment.mockReset();
});

describe("resolveDomainOrForbid", () => {
  it("unknown slug → 404", async () => {
    findDomain.mockResolvedValue(null);
    expect(await statusOf(await resolveDomainOrForbid("nope", stranger))).toMatch(/^404/);
  });

  it("PUBLIC domain → ok for anyone, even signed out, without touching enrollments", async () => {
    findDomain.mockResolvedValue(PUBLIC);
    expect((await resolveDomainOrForbid("matematica-v-viii", null)).ok).toBe(true);
    expect((await resolveDomainOrForbid("matematica-v-viii", stranger)).ok).toBe(true);
    expect(findEnrollment).not.toHaveBeenCalled();
  });

  it("PRIVATE domain → 404 for a stranger, and the 404 is IDENTICAL to a missing domain", async () => {
    findDomain.mockResolvedValue(null);
    const missing = await statusOf(await resolveDomainOrForbid("nope", stranger));

    findDomain.mockResolvedValue(PRIVATE);
    findEnrollment.mockResolvedValue(null);
    const hidden = await statusOf(await resolveDomainOrForbid("aptitudini-aviatie", stranger));

    expect(hidden).toBe(missing); // a private subject must not confirm it exists
  });

  it("PRIVATE domain → 404 when signed out", async () => {
    findDomain.mockResolvedValue(PRIVATE);
    expect(await statusOf(await resolveDomainOrForbid("aptitudini-aviatie", null))).toMatch(/^404/);
    expect(findEnrollment).not.toHaveBeenCalled();
  });

  it("PRIVATE domain → re-reads the enrollment from the DB; the session's claim is not enough", async () => {
    findDomain.mockResolvedValue(PRIVATE);
    findEnrollment.mockResolvedValue(null); // revoked since the token was minted
    const r = await resolveDomainOrForbid("aptitudini-aviatie", claimsEnrolled);
    expect(r.ok).toBe(false);
    expect(findEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_domainId: { userId: "u-claim", domainId: "d-avi" } } })
    );
  });

  it("PRIVATE domain → 404 on an INACTIVE enrollment", async () => {
    findDomain.mockResolvedValue(PRIVATE);
    findEnrollment.mockResolvedValue({ isActive: false });
    expect((await resolveDomainOrForbid("aptitudini-aviatie", claimsEnrolled)).ok).toBe(false);
  });

  it("PRIVATE domain → ok on an ACTIVE enrollment", async () => {
    findDomain.mockResolvedValue(PRIVATE);
    findEnrollment.mockResolvedValue({ isActive: true });
    const r = await resolveDomainOrForbid("aptitudini-aviatie", claimsEnrolled);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.domain.id).toBe("d-avi");
  });

  it("admins pass every domain — private, and even switched off — without an enrollment query", async () => {
    findDomain.mockResolvedValue(PRIVATE);
    expect((await resolveDomainOrForbid("aptitudini-aviatie", superadmin)).ok).toBe(true);
    findDomain.mockResolvedValue(OFF);
    expect((await resolveDomainOrForbid("off", superadmin)).ok).toBe(true);
    expect(findEnrollment).not.toHaveBeenCalled();
  });

  it("a switched-off domain → 404 for everyone else, even when enrolled", async () => {
    findDomain.mockResolvedValue(OFF);
    findEnrollment.mockResolvedValue({ isActive: true });
    expect(await statusOf(await resolveDomainOrForbid("off", claimsEnrolled))).toMatch(/^404/);
  });

  it("selects only what it needs from the domain", async () => {
    findDomain.mockResolvedValue(PUBLIC);
    await resolveDomainOrForbid("matematica-v-viii", stranger);
    expect(findDomain).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, slug: true, name: true, visibility: true, isActive: true },
      })
    );
  });
});
