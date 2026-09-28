import { describe, it, expect } from "vitest";
import { withoutSessionCookies, expireLeftoverSessionCookies } from "@/lib/session-cookie";

// True E2E 2026-09-28: the Google callback linked the Google account to whoever the session cookie
// named — even a session a password reset had ended.
describe("withoutSessionCookies", () => {
  const make = (url: string, init: RequestInit) => new Request(url, init);
  it("drops every session cookie (chunks included) and keeps the OAuth ones", () => {
    const req = new Request("https://etutor.ro/api/auth/callback/google?code=x&state=y", {
      headers: {
        cookie:
          "__Secure-authjs.session-token=aaa; __Secure-authjs.session-token.0=b; authjs.session-token=c; " +
          "__Secure-authjs.state=st; __Secure-authjs.pkce.code_verifier=pk; __Host-authjs.csrf-token=cs; NEXT_LOCALE=ro",
      },
    });
    const out = withoutSessionCookies(req, make);
    expect(out.headers.get("cookie")).toBe(
      "__Secure-authjs.state=st; __Secure-authjs.pkce.code_verifier=pk; __Host-authjs.csrf-token=cs; NEXT_LOCALE=ro",
    );
    expect(out.url).toBe(req.url);
    expect(out.method).toBe("GET");
  });
  it("a renamed session cookie is dropped too — Auth.js reads every name that starts with the session name", async () => {
    const req = new Request("https://etutor.ro/api/auth/callback/google?code=x&state=y", {
      headers: {
        cookie: "__Secure-authjs.session-tokenX=revoked; authjs.session-token-0=revoked; authjs.session-token_=r; __Secure-authjs.state=st",
      },
    });
    const out = withoutSessionCookies(req, make);
    expect(out.headers.get("cookie")).toBe("__Secure-authjs.state=st");
    // The same check Auth.js makes when it looks for a session on this request.
    const { SessionStore } = await import("../../node_modules/@auth/core/lib/utils/cookie.js");
    const { parse } = await import("../../node_modules/@auth/core/lib/vendored/cookie.js");
    for (const name of ["__Secure-authjs.session-token", "authjs.session-token"]) {
      const before = new SessionStore({ name, options: {} }, parse(req.headers.get("cookie") ?? ""), console);
      const after = new SessionStore({ name, options: {} }, parse(out.headers.get("cookie") ?? ""), console);
      expect(before.value).toBeTruthy();
      expect(after.value).toBeFalsy();
    }
  });
  it("no cookies left → no cookie header at all", () => {
    const req = new Request("https://etutor.ro/api/auth/callback/google", { headers: { cookie: "authjs.session-token=c" } });
    expect(withoutSessionCookies(req, make).headers.get("cookie")).toBeNull();
  });
  it("a POST keeps its body", async () => {
    const req = new Request("https://etutor.ro/api/auth/callback/google", { method: "POST", body: "code=x", headers: { cookie: "authjs.session-token=c" } });
    expect(await withoutSessionCookies(req, make).text()).toBe("code=x");
  });
});

describe("expireLeftoverSessionCookies", () => {
  const withCookies = (cookies: string[]) => {
    const h = new Headers({ location: "https://etutor.ro/ro/dashboard" });
    for (const c of cookies) h.append("Set-Cookie", c);
    return new Response(null, { status: 302, headers: h });
  };
  const stripped = ["__Secure-authjs.session-token.0", "__Secure-authjs.session-token.1"];

  it("after a sign-in, the old session's chunks the response doesn't set are expired", () => {
    const res = expireLeftoverSessionCookies(
      withCookies(["__Secure-authjs.session-token=new; Path=/; HttpOnly; Secure; SameSite=Lax"]),
      stripped,
    );
    const set = res.headers.getSetCookie();
    expect(set[0]).toMatch(/^__Secure-authjs\.session-token=new/);
    expect(set.filter((c) => /Max-Age=0/.test(c)).map((c) => c.split("=")[0])).toEqual(stripped);
    expect(set.every((c) => !/Max-Age=0/.test(c) || /Secure/.test(c))).toBe(true);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://etutor.ro/ro/dashboard");
  });
  it("a failed sign-in (no new session) leaves the old session alone", () => {
    const res = expireLeftoverSessionCookies(withCookies(["__Secure-authjs.callback-url=x; Path=/"]), stripped);
    expect(res.headers.getSetCookie()).toEqual(["__Secure-authjs.callback-url=x; Path=/"]);
  });
  it("a cookie the response sets itself isn't expired again", () => {
    const res = expireLeftoverSessionCookies(
      withCookies(["__Secure-authjs.session-token.0=a; Path=/", "__Secure-authjs.session-token.1=b; Path=/"]),
      stripped,
    );
    expect(res.headers.getSetCookie().filter((c) => /Max-Age=0/.test(c))).toEqual([]);
  });
});
