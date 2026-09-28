import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const queryRaw = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique }, $queryRaw: queryRaw } }));
const { findUserIdByEmail } = await import("@/lib/email-lookup");

// True E2E 2026-09-26: accounts stored with capitals (made before emails were lowercased) could
// not sign in or reset their password — lookups used the lowercase spelling only.
describe("findUserIdByEmail", () => {
  beforeEach(() => {
    findUnique.mockReset();
    queryRaw.mockReset();
  });

  it("exact lowercase match first, whatever the person typed", async () => {
    findUnique.mockResolvedValue({ id: "u1" });
    expect(await findUserIdByEmail("  Ana.Pop@Gmail.com ")).toBe("u1");
    expect(findUnique).toHaveBeenCalledWith({ where: { email: "ana.pop@gmail.com" }, select: { id: true } });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("falls back to lower(email) for a row stored with capitals", async () => {
    findUnique.mockResolvedValue(null);
    queryRaw.mockResolvedValue([{ id: "u2" }]);
    expect(await findUserIdByEmail("miruna@gmail.com")).toBe("u2");
    // Parameterised, never ILIKE: "_" in an address must not act as a wildcard.
    const [sql, value] = queryRaw.mock.calls[0];
    expect(sql.join("?")).toContain("lower(email) = ?");
    expect(sql.join("?")).not.toMatch(/ilike/i);
    expect(value).toBe("miruna@gmail.com");
  });

  it("two rows differing only in capitals → nobody, never a guess", async () => {
    findUnique.mockResolvedValue(null);
    queryRaw.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    expect(await findUserIdByEmail("dup@x.ro")).toBeNull();
  });

  it("empty input doesn't touch the database", async () => {
    expect(await findUserIdByEmail("   ")).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
