import { describe, it, expect, vi, afterEach } from "vitest";
import { signImpersonationToken, verifyImpersonationToken, IMPERSONATION_TTL_MS } from "@/lib/impersonation";

describe("Impersonation Tokens", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signImpersonationToken()", () => {
    it("should produce a two-part base64url token", () => {
      const token = signImpersonationToken({
        adminId: "admin-1",
        impersonatedUserId: "user-1",
        exp: Date.now() + IMPERSONATION_TTL_MS,
      });
      const parts = token.split(".");
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it("should encode the payload in the first segment", () => {
      const payload = {
        adminId: "admin-1",
        impersonatedUserId: "user-1",
        exp: Date.now() + IMPERSONATION_TTL_MS,
      };
      const token = signImpersonationToken(payload);
      const decoded = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      expect(decoded.adminId).toBe("admin-1");
      expect(decoded.impersonatedUserId).toBe("user-1");
    });
  });

  describe("verifyImpersonationToken()", () => {
    it("should verify a valid non-expired token", () => {
      const payload = {
        adminId: "admin-1",
        impersonatedUserId: "user-1",
        exp: Date.now() + IMPERSONATION_TTL_MS,
      };
      const token = signImpersonationToken(payload);
      const result = verifyImpersonationToken(token);
      expect(result).not.toBeNull();
      expect(result!.adminId).toBe("admin-1");
      expect(result!.impersonatedUserId).toBe("user-1");
    });

    it("should reject an expired token", () => {
      const payload = {
        adminId: "admin-1",
        impersonatedUserId: "user-1",
        exp: Date.now() - 1000, // expired 1s ago
      };
      const token = signImpersonationToken(payload);
      expect(verifyImpersonationToken(token)).toBeNull();
    });

    it("should reject a tampered token", () => {
      const token = signImpersonationToken({
        adminId: "admin-1",
        impersonatedUserId: "user-1",
        exp: Date.now() + IMPERSONATION_TTL_MS,
      });
      const tampered = token.slice(0, -3) + "abc";
      expect(verifyImpersonationToken(tampered)).toBeNull();
    });

    it("should reject token with wrong format", () => {
      expect(verifyImpersonationToken("invalid-token")).toBeNull();
      expect(verifyImpersonationToken("a.b.c")).toBeNull();
      expect(verifyImpersonationToken("")).toBeNull();
    });
  });

  describe("TTL constant", () => {
    it("should be 1 hour", () => {
      expect(IMPERSONATION_TTL_MS).toBe(60 * 60 * 1000);
    });
  });
});
