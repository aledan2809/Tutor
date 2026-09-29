/**
 * The Legal Hub keeps the evidence of a parent's answer for a learner under 16 (Alex, 28.09.2026:
 * „Pune totul in Legal Hub”). eTutor keeps only what it needs to run the account (parentConsentAt /
 * parentConsentRefusedAt); what the parent was shown, when and from where lives in the Hub, in rows
 * nobody can change (Legal: GuardianConsent, POST /api/v1/guardian-consents).
 *
 * Server to server, signed: the Hub trusts the child's account id only with this app's key
 * (LEGAL_HMAC_KEY here = CONSUMER_HMAC_KEY_TUTOR there). Without the key nothing is recorded — and a
 * parent's answer that can't be recorded isn't applied either (answerConsent).
 */
import { createHash, createHmac, randomBytes } from "node:crypto";
import { logger } from "@/lib/logger";

const APP_SLUG = "tutor";
const TIMEOUT_MS = 8000;

export type GuardianEvent =
  | {
      event: "GIVEN" | "REFUSED";
      subjectRef: string;
      requestId: string;
      guardianEmail: string;
      documentVersionId: string;
      ipAddress?: string | null;
      userAgent?: string | null;
    }
  | {
      event: "SUBJECT_ERASED";
      subjectRef: string;
      requestId: string;
      reason: "GUARDIAN_REFUSED" | "NO_GUARDIAN_ANSWER" | "INACTIVE" | "OTHER";
    };

export type HubEvent = "GIVEN" | "REFUSED" | "SUBJECT_ERASED";

/**
 * What the Hub did. `event` is what it holds for this request: the one sent, or — when the same request
 * was recorded before, even with another answer — the one recorded first, which is the one that counts.
 */
export type RecordResult =
  | { ok: true; event: HubEvent }
  | {
      ok: false;
      why: "not-configured" | "rejected" | "unreachable" | "subject-erased" | "answer-exists";
      status?: number;
      /** answer-exists: the parent's answer the Hub already holds. */
      storedEvent?: HubEvent;
    };

/** The signed envelope the Hub checks (Legal src/lib/legal/hmac-verify.ts): order and encoding fixed. */
export function signLegalRequest(key: string, subjectRef: string, bodyText: string, now = Date.now()) {
  const timestamp = String(now);
  const nonce = randomBytes(12).toString("hex");
  const bodyHash = createHash("sha256").update(bodyText).digest("hex");
  const signature = createHmac("sha256", key)
    .update([APP_SLUG, timestamp, nonce, subjectRef, bodyHash].join("\n"))
    .digest("base64");
  return {
    "x-app-slug": APP_SLUG,
    "x-app-timestamp": timestamp,
    "x-app-nonce": nonce,
    "x-app-signature": signature,
    "x-user-id": subjectRef,
  };
}

/**
 * Idempotency keys. One per LINK, whatever the answer: a retry is recorded once, and a second answer
 * on the same link gets back the first one (so the Hub and eTutor can't end up with different answers
 * when a reply was lost on the way).
 */
export const answerRequestId = (token: string) => `tutor:answer:${createHash("sha256").update(token).digest("hex").slice(0, 40)}`;
export const erasureRequestId = (userId: string) => `tutor:erased:${userId}`;

export async function recordGuardianEvent(ev: GuardianEvent): Promise<RecordResult> {
  const base = process.env.LEGAL_API_URL?.replace(/\/$/, "");
  const key = process.env.LEGAL_HMAC_KEY?.trim();
  if (!base || !key || key.length < 32) {
    logger.error("Legal Hub not configured for parental consent (LEGAL_API_URL / LEGAL_HMAC_KEY)");
    return { ok: false, why: "not-configured" };
  }
  const payload =
    ev.event === "SUBJECT_ERASED"
      ? { event: ev.event, appSlug: APP_SLUG, subjectRef: ev.subjectRef, requestId: ev.requestId, reason: ev.reason }
      : {
          event: ev.event,
          appSlug: APP_SLUG,
          subjectRef: ev.subjectRef,
          requestId: ev.requestId,
          guardianEmail: ev.guardianEmail,
          documentVersionId: ev.documentVersionId,
          ...(ev.ipAddress ? { ipAddress: ev.ipAddress.slice(0, 45) } : {}),
          ...(ev.userAgent ? { userAgent: ev.userAgent.slice(0, 512) } : {}),
        };
  const body = JSON.stringify(payload);
  try {
    const res = await fetch(`${base}/api/v1/guardian-consents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...signLegalRequest(key, ev.subjectRef, body) },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const reply = (await res.json().catch(() => ({}))) as { event?: unknown; code?: unknown; storedEvent?: unknown };
    const asEvent = (v: unknown): HubEvent | undefined =>
      v === "GIVEN" || v === "REFUSED" || v === "SUBJECT_ERASED" ? v : undefined;
    // 201 recorded, 200 the same request recorded before (with what it holds).
    if (res.status === 201 || res.status === 200) return { ok: true, event: asEvent(reply.event) ?? ev.event };
    if (res.status === 409) {
      // The same link answered before, differently: the first answer is the one recorded.
      if (reply.code === "request-used" && asEvent(reply.storedEvent)) return { ok: true, event: asEvent(reply.storedEvent)! };
      if (reply.code === "subject-erased") return { ok: false, why: "subject-erased", status: 409 };
      if (reply.code === "answer-exists") return { ok: false, why: "answer-exists", status: 409, storedEvent: asEvent(reply.storedEvent) };
    }
    logger.error("Legal Hub refused a parental-consent event", undefined, { event: ev.event, status: res.status });
    return { ok: false, why: "rejected", status: res.status };
  } catch (err) {
    logger.error("Legal Hub unreachable for a parental-consent event", err, { event: ev.event });
    return { ok: false, why: "unreachable" };
  }
}
