import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { enrollment: { findUnique: (...a: unknown[]) => findUnique(...a) } } }));

const { isOrgProvidedAccess } = await import("@/lib/org-entitlement");

describe("isOrgProvidedAccess — cine plătește pentru elev", () => {
  beforeEach(() => findUnique.mockReset());

  it("firma plătește: materie a unei organizații + înscriere activă", async () => {
    findUnique.mockResolvedValue({ isActive: true, domain: { organizationId: "org1" } });
    expect(await isOrgProvidedAccess("u1", "d1")).toBe(true);
  });

  it("materie fără organizație = elev de consum, poarta rămâne", async () => {
    findUnique.mockResolvedValue({ isActive: true, domain: { organizationId: null } });
    expect(await isOrgProvidedAccess("u1", "d1")).toBe(false);
  });

  it("înscriere dezactivată nu mai e plătită de nimeni", async () => {
    findUnique.mockResolvedValue({ isActive: false, domain: { organizationId: "org1" } });
    expect(await isOrgProvidedAccess("u1", "d1")).toBe(false);
  });

  it("neînscris = fals, nu excepție", async () => {
    findUnique.mockResolvedValue(null);
    expect(await isOrgProvidedAccess("u1", "d1")).toBe(false);
  });

  it("nu interoghează baza pe intrări goale", async () => {
    expect(await isOrgProvidedAccess("", "d1")).toBe(false);
    expect(await isOrgProvidedAccess("u1", "")).toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("caută exact perechea elev–materie, nu altceva", async () => {
    findUnique.mockResolvedValue({ isActive: true, domain: { organizationId: "org1" } });
    await isOrgProvidedAccess("u7", "d9");
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_domainId: { userId: "u7", domainId: "d9" } } }),
    );
  });
});
