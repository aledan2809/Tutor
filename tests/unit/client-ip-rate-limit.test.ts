import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { clientIp } from "@/lib/client-ip";

// The locale middleware is irrelevant here (API paths return before it) and its ESM build
// doesn't load under vitest.
vi.mock("next-intl/middleware", () => ({ default: () => () => new Response(null) }));
process.env.AUTH_SECRET = "test-secret-for-rate-limit-0123456789abcdef";
const { default: middleware } = await import("@/middleware");
const { encode } = await import("next-auth/jwt");

const COOKIE = "authjs.session-token";
/** A session cookie the app itself would issue — signed with the secret. */
const realSession = async (userId: string) =>
  `${COOKIE}=${await encode({ token: { id: userId, sub: userId }, secret: process.env.AUTH_SECRET!, salt: COOKIE })}`;

// True E2E 2026-09-26: the address was the FIRST X-Forwarded-For entry (whatever the client
// sent), and a made-up session cookie opened a fresh budget — together, unlimited password
// and recovery-code attempts.

describe("clientIp", () => {
  it("prefers X-Real-IP, which nginx sets from the connection", () => {
    const h = new Headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.1.1.1, 203.0.113.7" });
    expect(clientIp(h)).toBe("203.0.113.7");
  });
  it("without X-Real-IP takes the LAST hop (the one our proxy appended), not the client's claim", () => {
    const h = new Headers({ "x-forwarded-for": "6.6.6.6, 198.51.100.4" });
    expect(clientIp(h)).toBe("198.51.100.4");
  });
  it("no headers → one shared key, never a fresh one", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

let seq = 0;
const post = (path: string, headers: Record<string, string>) =>
  middleware(new NextRequest(`http://localhost${path}`, { method: "POST", headers }));

describe("middleware rate limit cannot be dodged", () => {
  it("sign-in: a spoofed X-Forwarded-For per request does not reset the budget", async () => {
    const real = `192.0.2.${++seq}`;
    const codes: number[] = [];
    for (let i = 0; i < 25; i++) {
      const r = await post("/api/auth/callback/credentials", { "x-real-ip": real, "x-forwarded-for": `10.9.${i}.1, ${real}` });
      codes.push(r.status);
    }
    expect(codes.slice(0, 20).every((c) => c !== 429)).toBe(true);
    expect(codes.slice(20).every((c) => c === 429)).toBe(true);
  });

  it("sign-in: a made-up session cookie per request does not reset the budget", async () => {
    const real = `192.0.2.${++seq}`;
    let blocked = 0;
    for (let i = 0; i < 25; i++) {
      const r = await post("/api/auth/recuperare/schimba", {
        "x-real-ip": real,
        cookie: `__Secure-authjs.session-token=${"x".repeat(30)}-fake-${i}`,
      });
      if (r.status === 429) blocked++;
    }
    expect(blocked).toBe(5);
  });

  it("other API routes: made-up cookies don't open budgets — they all count against the address", async () => {
    const real = `192.0.2.${++seq}`;
    let blocked = 0;
    for (let i = 0; i < 100; i++) {
      const r = await post("/api/magic-quiz", { "x-real-ip": real, cookie: `${COOKIE}=${"y".repeat(30)}-fake-${i}` });
      if (r.status === 429) blocked++;
    }
    expect(blocked).toBe(40);
  });

  it("a real class: 20 students behind one address, each with a real session, are not blocked", async () => {
    const real = `192.0.2.${++seq}`;
    let blocked = 0;
    for (let s = 0; s < 20; s++) {
      const cookie = await realSession(`student-${seq}-${s}`);
      for (let i = 0; i < 30; i++) {
        const r = await post("/api/magic-quiz", { "x-real-ip": real, cookie });
        if (r.status === 429) blocked++;
      }
    }
    expect(blocked).toBe(0);
  });

  it("one real session still has its own limit (60 a minute on a bucket)", async () => {
    const cookie = await realSession(`busy-${++seq}`);
    let blocked = 0;
    for (let i = 0; i < 70; i++) {
      const r = await post("/api/magic-quiz", { "x-real-ip": `198.51.100.${i}`, cookie });
      if (r.status === 429) blocked++;
    }
    expect(blocked).toBe(10);
  });
});

describe("second review (2026-09-27)", () => {
  it("sign-out isn't counted with the sign-ins: a classroom that used up its sign-in budget can still sign out", async () => {
    const real = `192.0.2.${++seq}`;
    for (let i = 0; i < 25; i++) await post("/api/auth/callback/credentials", { "x-real-ip": real });
    const blocked = await post("/api/auth/callback/credentials", { "x-real-ip": real });
    expect(blocked.status).toBe(429);
    const codes: number[] = [];
    for (let i = 0; i < 10; i++) codes.push((await post("/api/auth/signout", { "x-real-ip": real })).status);
    expect(codes.includes(429)).toBe(false);
  });

  it("a flood of junk paths can't push an address's sign-in counter out of memory", async () => {
    const real = `192.0.2.${++seq}`;
    for (let i = 0; i < 25; i++) await post("/api/auth/recuperare/schimba", { "x-real-ip": real });
    expect((await post("/api/auth/recuperare/schimba", { "x-real-ip": real })).status).toBe(429);
    // More distinct keys than the general store holds (10 000), from other addresses.
    for (let i = 0; i < 10_500; i++) {
      await post(`/api/junk-${i}`, { "x-real-ip": `203.0.${Math.floor(i / 250)}.${i % 250}` });
    }
    expect((await post("/api/auth/recuperare/schimba", { "x-real-ip": real })).status).toBe(429);
  }, 60_000);
});

describe("third review (2026-09-28)", () => {
  const postWith = (path: string, headers: Record<string, string>) =>
    middleware(new NextRequest(`http://localhost${path}`, { method: "POST", headers }));

  it("spelling a subject slug differently doesn't open a new budget", async () => {
    const cookie = await realSession(`slug-${++seq}`);
    const real = `192.0.2.${++seq}`;
    const paths = ["/api/bac/progress", "/api/%62ac/progress", "/api/b%61c/progress", "/api/matematica/progress"];
    let blocked = 0;
    for (let i = 0; i < 64; i++) {
      if ((await postWith(paths[i % paths.length], { "x-real-ip": real, cookie })).status === 429) blocked++;
    }
    expect(blocked).toBe(4);
  });

  it("code guesses count per address, whatever the number of accounts", async () => {
    const real = `192.0.2.${++seq}`;
    let blocked = 0;
    for (let i = 0; i < 65; i++) {
      const cookie = await realSession(`farm-${seq}-${i}`);
      if ((await postWith("/api/activate", { "x-real-ip": real, cookie })).status === 429) blocked++;
    }
    expect(blocked).toBe(5);
  });

  it("spelling a code route differently (/api/%61ctivate) still counts against the same address budget", async () => {
    const real = `192.0.2.${++seq}`;
    let blocked = 0;
    for (let i = 0; i < 65; i++) {
      const cookie = await realSession(`farm2-${seq}-${i}`);
      const path = i % 2 ? "/api/%61ctivate" : "/api/activate";
      if ((await postWith(path, { "x-real-ip": real, cookie })).status === 429) blocked++;
    }
    expect(blocked).toBe(5);
  });

  it("a session ended by a password change can't spend the owner's new session budget", async () => {
    const id = `owner-${++seq}`;
    const COOKIE_NAME = "authjs.session-token";
    const tok = async (sv: number) =>
      `${COOKIE_NAME}=${await encode({ token: { id, sub: id, sv }, secret: process.env.AUTH_SECRET!, salt: COOKIE_NAME })}`;
    const stale = await tok(0);
    for (let i = 0; i < 70; i++) await postWith("/api/student/x", { "x-real-ip": `198.51.100.${i}`, cookie: stale });
    const owner = await postWith("/api/student/x", { "x-real-ip": "203.0.113.200", cookie: await tok(1) });
    expect(owner.status).not.toBe(429);
  });

  it("a malformed escape in an API path is refused with 400", async () => {
    expect((await postWith("/api/%E0%A4%A/x", { "x-real-ip": `192.0.2.${++seq}` })).status).toBe(400);
  });

  it("Google sign-ins of a whole class don't spend the password budget", async () => {
    const real = `192.0.2.${++seq}`;
    for (let i = 0; i < 60; i++) await postWith("/api/auth/callback/google", { "x-real-ip": real });
    expect((await postWith("/api/auth/callback/credentials", { "x-real-ip": real })).status).not.toBe(429);
  });
});
