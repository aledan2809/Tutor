import { describe, it, expect, vi, afterEach } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { answerRequestId, erasureRequestId, recordGuardianEvent, signLegalRequest } from "@/lib/legal/guardian";
import { consentEraseAt } from "@/lib/parent-consent";

const KEY = "k".repeat(40);

describe("signLegalRequest", () => {
  it("signs exactly what the Legal Hub checks (appSlug, time, nonce, subject, body hash)", () => {
    const body = JSON.stringify({ a: 1 });
    const h = signLegalRequest(KEY, "cmchild1", body, 1_700_000_000_000);
    expect(h["x-app-slug"]).toBe("tutor");
    expect(h["x-user-id"]).toBe("cmchild1");
    expect(h["x-app-timestamp"]).toBe("1700000000000");
    const expected = createHmac("sha256", KEY)
      .update(["tutor", h["x-app-timestamp"], h["x-app-nonce"], "cmchild1", createHash("sha256").update(body).digest("hex")].join("\n"))
      .digest("base64");
    expect(h["x-app-signature"]).toBe(expected);
    expect(h["x-app-signature"]).toHaveLength(44);
  });
  it("a fresh nonce every time: a captured request can't be replayed as a new one", () => {
    expect(signLegalRequest(KEY, "c", "{}")["x-app-nonce"]).not.toBe(signLegalRequest(KEY, "c", "{}")["x-app-nonce"]);
  });
});

describe("idempotency keys", () => {
  it("one key per link, whatever the answer; another link is another key; the link itself isn't in it", () => {
    const t = "a".repeat(64);
    expect(answerRequestId(t)).toBe(answerRequestId(t));
    expect(answerRequestId(t)).not.toBe(answerRequestId("b".repeat(64)));
    expect(answerRequestId(t)).not.toContain(t);
    expect(answerRequestId(t)).toMatch(/^[A-Za-z0-9:_.-]{16,128}$/);
    expect(erasureRequestId("cmchild1")).toBe("tutor:erased:cmchild1");
  });
});

describe("consentEraseAt", () => {
  it("7 days of use, then 30 stopped — to the end of that day in Bucharest", () => {
    const at = new Date("2026-09-01T10:00:00Z");
    expect(consentEraseAt(at).toISOString()).toBe("2026-10-08T20:59:59.999Z");
  });
});

describe("recordGuardianEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const answer = {
    event: "REFUSED" as const,
    subjectRef: "cmchild1",
    requestId: "tutor:answer:0123456789abcdef:REFUSED",
    guardianEmail: "mama@example.ro",
    documentVersionId: "cmver1",
    ipAddress: "10.0.0.1",
    userAgent: "UA",
  };

  it("without the Hub's address or key nothing is sent — and it says so", async () => {
    vi.stubEnv("LEGAL_API_URL", "");
    vi.stubEnv("LEGAL_HMAC_KEY", KEY);
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await recordGuardianEvent(answer)).toEqual({ ok: false, why: "not-configured" });
    vi.stubEnv("LEGAL_API_URL", "https://legal.test");
    vi.stubEnv("LEGAL_HMAC_KEY", "short");
    expect(await recordGuardianEvent(answer)).toEqual({ ok: false, why: "not-configured" });
    expect(f).not.toHaveBeenCalled();
  });

  it("sends a signed body naming the same child; 201 and 200 both count as recorded", async () => {
    vi.stubEnv("LEGAL_API_URL", "https://legal.test/");
    vi.stubEnv("LEGAL_HMAC_KEY", KEY);
    const f = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", f);
    expect(await recordGuardianEvent(answer)).toEqual({ ok: true, event: "REFUSED" });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://legal.test/api/v1/guardian-consents");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ event: "REFUSED", appSlug: "tutor", subjectRef: "cmchild1", guardianEmail: "mama@example.ro" });
    expect(init.headers["x-user-id"]).toBe("cmchild1");
    f.mockResolvedValue(new Response(JSON.stringify({ event: "REFUSED", duplicate: true }), { status: 200 }));
    expect(await recordGuardianEvent(answer)).toEqual({ ok: true, event: "REFUSED" });
  });

  it("the same link answered before, differently: the first answer is the one that counts", async () => {
    vi.stubEnv("LEGAL_API_URL", "https://legal.test");
    vi.stubEnv("LEGAL_HMAC_KEY", KEY);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "request-used", storedEvent: "GIVEN" }), { status: 409 })));
    expect(await recordGuardianEvent(answer)).toEqual({ ok: true, event: "GIVEN" });
  });

  it("an erased child and a parent who did answer come back as such, not as a failure", async () => {
    vi.stubEnv("LEGAL_API_URL", "https://legal.test");
    vi.stubEnv("LEGAL_HMAC_KEY", KEY);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "subject-erased" }), { status: 409 })));
    expect(await recordGuardianEvent(answer)).toEqual({ ok: false, why: "subject-erased", status: 409 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "answer-exists", storedEvent: "GIVEN" }), { status: 409 })));
    expect(
      await recordGuardianEvent({ event: "SUBJECT_ERASED", subjectRef: "cmchild1", requestId: erasureRequestId("cmchild1"), reason: "NO_GUARDIAN_ANSWER" }),
    ).toEqual({ ok: false, why: "answer-exists", status: 409, storedEvent: "GIVEN" });
  });

  it("an erasure marker carries nothing about the parent", async () => {
    vi.stubEnv("LEGAL_API_URL", "https://legal.test");
    vi.stubEnv("LEGAL_HMAC_KEY", KEY);
    const f = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", f);
    await recordGuardianEvent({ event: "SUBJECT_ERASED", subjectRef: "cmchild1", requestId: erasureRequestId("cmchild1"), reason: "GUARDIAN_REFUSED" });
    expect(Object.keys(JSON.parse(f.mock.calls[0][1].body)).sort()).toEqual(["appSlug", "event", "reason", "requestId", "subjectRef"]);
  });

  it("a refusal from the Hub or no answer at all is not a recording", async () => {
    vi.stubEnv("LEGAL_API_URL", "https://legal.test");
    vi.stubEnv("LEGAL_HMAC_KEY", KEY);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 422 })));
    expect(await recordGuardianEvent(answer)).toEqual({ ok: false, why: "rejected", status: 422 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    expect(await recordGuardianEvent(answer)).toEqual({ ok: false, why: "unreachable" });
  });
});
