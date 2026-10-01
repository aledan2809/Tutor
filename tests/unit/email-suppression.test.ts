import { describe, it, expect } from "vitest";
import { createHash, createHmac } from "crypto";
import {
  addressHash,
  changeFromEvent,
  declaredTooLarge,
  normalizeAddress,
  plausibleWebhookHeaders,
  stillSuppressed,
  verifyResendSignature,
  WEBHOOK_MAX_BYTES,
  WEBHOOK_TOLERANCE_SEC,
} from "@/lib/email-suppression";

// A Svix-style secret: „whsec_” + base64 key.
const KEY = Buffer.from("cheie-de-test-pentru-webhook-resend");
const SECRET = `whsec_${KEY.toString("base64")}`;
const sign = (id: string, ts: string, body: string, key = KEY) =>
  `v1,${createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64")}`;
const NOW = 1_790_000_000_000;
const TS = String(NOW / 1000);
const BODY = JSON.stringify({ type: "email.bounced", data: { to: ["a@b.ro"] } });

describe("verifyResendSignature (Svix, as Resend signs its webhooks)", () => {
  it("matches Svix's published example", () => {
    // From docs.svix.com („Verifying payloads”): the same secret, id, timestamp, body and signature.
    const body = '{"test": 2432232314}';
    expect(
      verifyResendSignature({
        id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
        timestamp: "1614265330",
        signatureHeader: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
        body,
        secret: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
        nowMs: 1614265330 * 1000,
      }),
    ).toBe(true);
  });

  it("accepts a correct signature, also among several (secret rotation)", () => {
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: sign("msg_1", TS, BODY), body: BODY, secret: SECRET, nowMs: NOW })).toBe(true);
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: `v1,AAAA ${sign("msg_1", TS, BODY)}`, body: BODY, secret: SECRET, nowMs: NOW })).toBe(true);
  });

  it("refuses a changed body, id or timestamp", () => {
    const header = sign("msg_1", TS, BODY);
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: header, body: BODY + " ", secret: SECRET, nowMs: NOW })).toBe(false);
    expect(verifyResendSignature({ id: "msg_2", timestamp: TS, signatureHeader: header, body: BODY, secret: SECRET, nowMs: NOW })).toBe(false);
    expect(verifyResendSignature({ id: "msg_1", timestamp: String(Number(TS) + 1), signatureHeader: header, body: BODY, secret: SECRET, nowMs: NOW })).toBe(false);
  });

  it("refuses another key, a missing header, an empty or non-base64 secret, another version", () => {
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: sign("msg_1", TS, BODY, Buffer.from("alta")), body: BODY, secret: SECRET, nowMs: NOW })).toBe(false);
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: null, body: BODY, secret: SECRET, nowMs: NOW })).toBe(false);
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: sign("msg_1", TS, BODY), body: BODY, secret: "", nowMs: NOW })).toBe(false);
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: sign("msg_1", TS, BODY), body: BODY, secret: "whsec_!!!", nowMs: NOW })).toBe(false);
    expect(verifyResendSignature({ id: "msg_1", timestamp: TS, signatureHeader: sign("msg_1", TS, BODY).replace("v1,", "v2,"), body: BODY, secret: SECRET, nowMs: NOW })).toBe(false);
  });

  it("refuses a replay older (or newer) than the tolerance", () => {
    const old = String(NOW / 1000 - WEBHOOK_TOLERANCE_SEC - 1);
    expect(verifyResendSignature({ id: "msg_1", timestamp: old, signatureHeader: sign("msg_1", old, BODY), body: BODY, secret: SECRET, nowMs: NOW })).toBe(false);
    const future = String(NOW / 1000 + WEBHOOK_TOLERANCE_SEC + 1);
    expect(verifyResendSignature({ id: "msg_1", timestamp: future, signatureHeader: sign("msg_1", future, BODY), body: BODY, secret: SECRET, nowMs: NOW })).toBe(false);
  });
});

describe("changeFromEvent", () => {
  const at = "2026-10-01T10:00:00.000Z";

  it("a permanent bounce suppresses the recipient, lowercased, from any app", () => {
    const c = changeFromEvent({
      type: "email.bounced",
      created_at: at,
      data: { to: ["Ion <Ion@X.ro>"], bounce: { type: "Permanent", subType: "General" } },
    });
    expect(c).toEqual({ kind: "suppress", emails: ["ion@x.ro"], reason: "bounced", detail: "Permanent / General", at: new Date(at) });
  });

  it("ignores a message with several recipients: the event doesn't say which one bounced", () => {
    expect(changeFromEvent({ type: "email.bounced", created_at: at, data: { to: ["a@x.ro", "b@x.ro"] } })).toBeNull();
    expect(changeFromEvent({ type: "email.delivered", created_at: at, data: { to: ["a@x.ro", "b@x.ro"] } })).toBeNull();
  });

  it("a bounce with no type counts as permanent; a temporary one or a non-text type doesn't", () => {
    expect(changeFromEvent({ type: "email.bounced", data: { to: ["x@y.ro"] } })?.kind).toBe("suppress");
    expect(changeFromEvent({ type: "email.bounced", data: { to: ["x@y.ro"], bounce: { type: "Temporary" } } })).toBeNull();
    expect(changeFromEvent({ type: "email.bounced", data: { to: ["x@y.ro"], bounce: { type: 5 } } })).toBeNull();
  });

  it("a complaint and an address Resend already suppresses stop automatic mail, whichever app sent it", () => {
    expect(changeFromEvent({ type: "email.complained", data: { to: ["p@q.ro"] } })).toMatchObject({ kind: "suppress", reason: "complained" });
    expect(changeFromEvent({ type: "email.suppressed", data: { to: ["p@q.ro"] } })).toMatchObject({ kind: "suppress", reason: "suppressed" });
  });

  it("a delivery releases the address, dated by the event — never without Resend's own date", () => {
    expect(changeFromEvent({ type: "email.delivered", created_at: at, data: { to: ["p@q.ro"] } })).toEqual({ kind: "release", emails: ["p@q.ro"], at: new Date(at) });
    expect(changeFromEvent({ type: "email.delivered", data: { to: ["p@q.ro"] } })).toBeNull();
    expect(changeFromEvent({ type: "email.delivered", created_at: "nu e dată", data: { to: ["p@q.ro"] } })).toBeNull();
  });

  it("ignores other events, and recipients that aren't addresses", () => {
    expect(changeFromEvent({ type: "email.opened", data: { to: ["p@q.ro"] } })).toBeNull();
    expect(changeFromEvent({ type: "email.bounced", data: { to: ["x y@z.ro"] } })).toBeNull();
    expect(changeFromEvent({ type: "email.bounced", data: { to: ["@"] } })).toBeNull();
    expect(changeFromEvent({ type: "email.bounced" })).toBeNull();
  });
});

describe("normalizeAddress / addressHash", () => {
  it("takes the bare address, also out of a display form", () => {
    expect(normalizeAddress(" Ana <Ana@X.ro> ")).toBe("ana@x.ro");
    expect(normalizeAddress("ana@x.ro")).toBe("ana@x.ro");
    expect(normalizeAddress("nu e adresă")).toBeNull();
  });

  it("hashes the same address the same way, whatever its form; never the address itself", () => {
    const h = addressHash("Ana <ANA@x.ro>", "s1");
    expect(h).toBe(addressHash("ana@x.ro", "s1"));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(addressHash("nu e adresă", "s1")).toBeNull();
  });

  it("is keyed by the server secret: the table can't be matched against an address list elsewhere", () => {
    expect(addressHash("ana@x.ro", "s1")).not.toBe(addressHash("ana@x.ro", "s2"));
    expect(addressHash("ana@x.ro", "s1")).not.toBe(createHashHex("ana@x.ro"));
  });
});

describe("plausibleWebhookHeaders / declaredTooLarge / stillSuppressed", () => {
  it("refuses before reading the body when a header is missing or the date is off", () => {
    expect(plausibleWebhookHeaders({ id: "m", timestamp: TS, signature: "v1,x" }, NOW)).toBe(true);
    expect(plausibleWebhookHeaders({ id: null, timestamp: TS, signature: "v1,x" }, NOW)).toBe(false);
    expect(plausibleWebhookHeaders({ id: "m", timestamp: TS, signature: null }, NOW)).toBe(false);
    expect(plausibleWebhookHeaders({ id: "m", timestamp: String(NOW / 1000 - WEBHOOK_TOLERANCE_SEC - 1), signature: "v1,x" }, NOW)).toBe(false);
    expect(plausibleWebhookHeaders({ id: "m", timestamp: "ieri", signature: "v1,x" }, NOW)).toBe(false);
  });

  it("refuses a declared body over the limit", () => {
    expect(declaredTooLarge(null)).toBe(false);
    expect(declaredTooLarge(String(WEBHOOK_MAX_BYTES))).toBe(false);
    expect(declaredTooLarge(String(WEBHOOK_MAX_BYTES + 1))).toBe(true);
    expect(declaredTooLarge("mult")).toBe(true);
  });

  it("a release counts only until a later suppression", () => {
    const t = (iso: string) => new Date(iso);
    expect(stillSuppressed({ lastEventAt: t("2026-10-01T10:00Z"), releasedAt: null })).toBe(true);
    expect(stillSuppressed({ lastEventAt: t("2026-10-01T10:00Z"), releasedAt: t("2026-10-01T11:00Z") })).toBe(false);
    expect(stillSuppressed({ lastEventAt: t("2026-10-01T12:00Z"), releasedAt: t("2026-10-01T11:00Z") })).toBe(true);
  });
});

function createHashHex(s: string) {
  return createHash("sha256").update(s).digest("hex");
}
