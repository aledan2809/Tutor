import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { API_FOLDERS, rateLimitBucket, decodedApiPath } from "@/lib/rate-limit-rules";

// True E2E 2026-09-28 (third review): the bucket was the raw first two path segments, so every
// spelling of a subject slug (%62ac = bac) and every slug had its own budget.

describe("API_FOLDERS", () => {
  it("is exactly the static folders under src/app/api (a new one must be added here)", () => {
    const dir = "src/app/api";
    const folders = readdirSync(dir).filter((f) => statSync(join(dir, f)).isDirectory() && !f.startsWith("["));
    expect([...API_FOLDERS].sort()).toEqual(folders.sort());
  });
});

describe("rateLimitBucket", () => {
  const b = (p: string) => rateLimitBucket(decodedApiPath(p)!);
  it("every subject slug, however spelled, shares one bucket", () => {
    expect(b("/api/bac/session/start").bucket).toBe("/api/:domain");
    expect(b("/api/%62ac/session/start").bucket).toBe("/api/:domain");
    expect(b("/api/matematica-v-viii/progress").bucket).toBe("/api/:domain");
  });
  it("code routes are code attempts, counted per address, however spelled", () => {
    for (const p of ["/api/activate", "/api/%61ctivate", "/api/vouchers/pending"]) {
      expect(b(p)).toMatchObject({ bucket: "/api/codes", perAddress: true, strict: true });
    }
  });
  it("family and class codes are code attempts too", () => {
    for (const p of ["/api/family/invite/lookup", "/api/family/accept", "/api/domains/join", "/api/acces/activare"]) {
      expect(b(p).bucket).toBe("/api/codes");
    }
  });
  it("Google and email-link steps don't spend the password budget", () => {
    for (const p of ["/api/auth/callback/google", "/api/auth/signin/google", "/api/auth/callback/resend", "/api/auth/callback/google-one-tap"]) {
      expect(b(p)).toMatchObject({ bucket: "/api/auth:link", perAddress: true, strict: false });
    }
    expect(b("/api/auth/callback/credentials")).toMatchObject({ bucket: "/api/auth:write", strict: true });
    expect(b("/api/auth/callback/%63redentials").bucket).toBe("/api/auth:write");
    expect(b("/api/auth/signout").bucket).toBe("/api/auth:read");
  });
  it("static folders keep their own bucket", () => {
    expect(b("/api/student/dashboard").bucket).toBe("/api/student");
    expect(b("/api/magic-quiz").bucket).toBe("/api/magic-quiz");
    expect(b("/api/stripe/checkout").bucket).toBe("/api/stripe");
  });
  it("a malformed escape is refused, not guessed at", () => {
    expect(decodedApiPath("/api/%E0%A4%A")).toBeNull();
  });
});
