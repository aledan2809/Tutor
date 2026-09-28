import { describe, it, expect } from "vitest";
import { signInLinkEmail } from "@/lib/sign-in-link-email";

// True E2E 2026-09-26: the email with the sign-in link used Auth.js's English default.
const link = (cb: string) =>
  `https://etutor.ro/api/auth/callback/resend?callbackUrl=${encodeURIComponent(cb)}&token=abc&email=a%40b.ro`;

describe("signInLinkEmail", () => {
  it("Romanian by default, with the link as the button", () => {
    const m = signInLinkEmail(link("https://etutor.ro/ro/dashboard"));
    expect(m.subject).toBe("Linkul tău de intrare pe eTutor.ro");
    expect(m.html).toContain("Intră pe eTutor.ro");
    expect(m.html).toContain('href="https://etutor.ro/api/auth/callback/resend?');
  });
  it("English when the person came from an /en page (absolute or relative callback)", () => {
    expect(signInLinkEmail(link("https://etutor.ro/en/dashboard")).subject).toMatch(/sign-in link/);
    expect(signInLinkEmail(link("/en/dashboard")).subject).toMatch(/sign-in link/);
  });
  it("a path that only starts with „en” is not English", () => {
    expect(signInLinkEmail(link("/english-course")).subject).toMatch(/intrare/);
  });
  it("no callback or a malformed link → Romanian, never a crash", () => {
    expect(signInLinkEmail("https://etutor.ro/api/auth/callback/resend?token=x").subject).toMatch(/intrare/);
    expect(signInLinkEmail("not a url").subject).toMatch(/intrare/);
  });
  it("a quote in the link can't close the attribute", () => {
    expect(signInLinkEmail('https://etutor.ro/x?a="><script>').html).not.toContain('"><script>');
  });
});
