import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// sendAppEmail's two guards that don't need a database: the Resend time limit, and the suppression list
// being skipped for mail the person asked for.
const suppressionFor = vi.fn();
vi.mock("@/lib/email-suppression", () => ({ suppressionFor: (e: string) => suppressionFor(e) }));
const createTransport = vi.fn();
vi.mock("nodemailer", () => ({ createTransport: (...a: unknown[]) => createTransport(...a), default: { createTransport: (...a: unknown[]) => createTransport(...a) } }));

import { sendAppEmail } from "@/lib/email";

describe("sendAppEmail limits", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.AUTH_RESEND_KEY = "re_test";
    process.env.SMTP_HOST = "smtp.example.test";
    suppressionFor.mockReset().mockResolvedValue(null);
    createTransport.mockReset().mockReturnValue({ sendMail: vi.fn().mockResolvedValue({}) });
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("gives up on a Resend that doesn't answer, and sends no second copy through SMTP", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init: { signal: AbortSignal }) => {
      expect(init.signal).toBeInstanceOf(AbortSignal);
      const e = new Error("The operation was aborted due to timeout");
      e.name = "TimeoutError";
      return Promise.reject(e);
    }));
    expect(await sendAppEmail({ to: "a@b.ro", subject: "s", html: "h" })).toBe(false);
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("still falls back to SMTP when Resend refuses the request outright", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    expect(await sendAppEmail({ to: "a@b.ro", subject: "s", html: "h" })).toBe(true);
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 }));
  });

  it("sends the idempotency key to Resend when one is given, and none otherwise", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetch);
    await sendAppEmail({ to: "a@b.ro", subject: "s", html: "h", idempotencyKey: "etutor:alert:renotify:ep1:2" });
    await sendAppEmail({ to: "a@b.ro", subject: "s", html: "h" });
    expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe("etutor:alert:renotify:ep1:2");
    expect(fetch.mock.calls[1][1].headers["Idempotency-Key"]).toBeUndefined();
  });

  it("automatic mail stops at a suppressed address; mail the person asked for isn't even checked", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetch);
    suppressionFor.mockResolvedValue("complained");
    expect(await sendAppEmail({ to: "a@b.ro", subject: "s", html: "h" })).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    suppressionFor.mockClear();
    expect(await sendAppEmail({ to: "a@b.ro", subject: "s", html: "h", requested: true })).toBe(true);
    expect(suppressionFor).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
