import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  describe("checkRateLimit()", () => {
    it("should allow first request", () => {
      const result = checkRateLimit("test-ip-1", RATE_LIMITS.api);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.api.maxRequests - 1);
    });

    it("should track remaining requests", () => {
      const identifier = "test-ip-2";
      checkRateLimit(identifier, RATE_LIMITS.auth);
      checkRateLimit(identifier, RATE_LIMITS.auth);
      const result = checkRateLimit(identifier, RATE_LIMITS.auth);
      expect(result.remaining).toBe(RATE_LIMITS.auth.maxRequests - 3);
    });

    it("should block after exceeding limit", () => {
      const identifier = "test-ip-3";
      const config = { maxRequests: 3, windowMs: 60000 };
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      const result = checkRateLimit(identifier, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("RATE_LIMITS", () => {
    it("should have auth limit of 5 req/min", () => {
      expect(RATE_LIMITS.auth.maxRequests).toBe(5);
      expect(RATE_LIMITS.auth.windowMs).toBe(60000);
    });

    it("should have payment limit of 3 req/min", () => {
      expect(RATE_LIMITS.payment.maxRequests).toBe(3);
    });

    it("should have general API limit of 60 req/min", () => {
      expect(RATE_LIMITS.api.maxRequests).toBe(60);
    });
  });

  describe("getRateLimitHeaders()", () => {
    it("should return correct headers", () => {
      const resetAt = Date.now() + 60000;
      const headers = getRateLimitHeaders(5, resetAt, 10);
      expect(headers["X-RateLimit-Limit"]).toBe("10");
      expect(headers["X-RateLimit-Remaining"]).toBe("5");
      expect(headers["X-RateLimit-Reset"]).toBeTruthy();
    });
  });
});
