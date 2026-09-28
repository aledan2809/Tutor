import { describe, it, expect, beforeAll } from "vitest";

// The recovery code is kept as HMAC(secret, "<account>:<code>"), not a bare sha256: a million
// possible codes reverse instantly from a database read, and two accounts holding the same code
// collided on the unique token column (True E2E 2026-09-26).
beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-recuperare-0123456789abcdef";
});

describe("codul de recuperare", () => {
  it("același cod pe două conturi dă urme diferite", async () => {
    const { hashCod } = await import("@/lib/recuperare");
    expect(hashCod("cont-a", "123456")).not.toBe(hashCod("cont-b", "123456"));
  });

  it("urma nu e sha256-ul simplu al codului", async () => {
    const { hashCod } = await import("@/lib/recuperare");
    const { createHash } = await import("node:crypto");
    expect(hashCod("cont-a", "123456")).not.toBe(createHash("sha256").update("123456").digest("hex"));
  });

  it("codul bun se potrivește doar pe contul lui", async () => {
    const { hashCod, codePotrivit } = await import("@/lib/recuperare");
    const h = hashCod("cont-a", "654321");
    expect(codePotrivit("cont-a", "654321", h)).toBe(true);
    expect(codePotrivit("cont-a", "654320", h)).toBe(false);
    expect(codePotrivit("cont-b", "654321", h)).toBe(false);
  });

  it("fără cheia secretă nu păstrează codul deloc", async () => {
    const { hashCod } = await import("@/lib/recuperare");
    const saved = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    try {
      expect(() => hashCod("cont-a", "123456")).toThrow();
    } finally {
      process.env.AUTH_SECRET = saved;
    }
  });
});
