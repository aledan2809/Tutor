import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// True E2E 2026-09-28: the reset link (token + email) went to the shared analytics server.
type Payload = { url?: string; referrer?: string; title?: string };
let scrub: (type: string, p: Payload) => Payload;

beforeAll(() => {
  const window: Record<string, unknown> = { location: { origin: "https://etutor.ro" } };
  runInNewContext(readFileSync("public/umami-scrub.js", "utf8"), { window, URL });
  scrub = window.etutorUmamiScrub as typeof scrub;
});

describe("umami-scrub", () => {
  it("drops the reset token and email, from the page and from the referrer", () => {
    const p = scrub("event", {
      url: "/ro/auth/reset-password?token=abc123&email=ana%40x.ro",
      referrer: "https://etutor.ro/ro/auth/reset-password?token=abc123&email=ana%40x.ro",
    });
    expect(p.url).toBe("/ro/auth/reset-password?token=_&email=_");
    expect(p.referrer).toBe("https://etutor.ro/ro/auth/reset-password?token=_&email=_");
  });
  it("hides invitation tokens and access codes in the path", () => {
    expect(scrub("event", { url: "/ro/family/accept/4cdd31c6" }).url).toBe("/ro/family/accept/_");
    expect(scrub("event", { url: "/acces/POSTA-7K2" }).url).toBe("/acces/_");
    expect(scrub("event", { url: "/ro/acord-parinte/abc123" }).url).toBe("/ro/acord-parinte/_");
  });
  it("hides a code carried inside callbackUrl, keeps campaign parameters", () => {
    const p = scrub("event", { url: "/ro/auth/signin?callbackUrl=%2Ffamily%2Fjoin%3Fcode%3DU92Y&utm_source=flyer&voucher=V126S" });
    expect(p.url).toBe("/ro/auth/signin?callbackUrl=_&utm_source=flyer&voucher=V126S");
  });
  it("leaves ordinary pages alone and never throws", () => {
    expect(scrub("event", { url: "/ro/preturi", referrer: "https://www.google.com/" })).toEqual({
      url: "/ro/preturi",
      referrer: "https://www.google.com/",
    });
    expect(scrub("event", { url: undefined }).url).toBeUndefined();
  });
});
