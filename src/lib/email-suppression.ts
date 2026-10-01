/**
 * Addresses eTutor's automatic mail no longer goes to (01.10.2026, after the parent-alert loop).
 *
 * Resend keeps a suppression list per account: after a permanent bounce or a spam complaint it drops
 * every later message to that address, from any app on the account (eTutor shares it, and even sends
 * from the same techbiz.ae domain). So this list mirrors Resend's: /api/webhooks/resend records the
 * addresses Resend reports as bounced, complained about or suppressed, and sendAppEmail stops the
 * AUTOMATIC mail to them — an alert or a reminder then falls through to the next channel instead of
 * „succeeding” into nothing. Mail the person asks for (a sign-in link, a password reset) always goes to
 * Resend, which decides; this list never blocks it.
 *
 * Only a keyed hash of the address is kept: most rows belong to other apps' recipients. An address is
 * released when Resend reports a later delivery to it (it was removed from Resend's list, or fixed); the
 * release is kept, so an older report arriving late doesn't stop it again. A row with no news for a year
 * is dropped — Resend reports `email.suppressed` at the next send if the address is still on its list.
 *
 * Resend reports one outcome per message, not per recipient: an event about a message with several
 * recipients is ignored (eTutor writes to one person at a time; other apps' group messages would blame
 * everyone for one bounce). `email.suppressed` catches what that misses, at the next send.
 */
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type SuppressionReason = "bounced" | "complained" | "suppressed";

/** How far a webhook's own timestamp may be from ours (Svix's advice against replayed requests). */
export const WEBHOOK_TOLERANCE_SEC = 5 * 60;
/** Largest webhook body accepted (Resend's events are a few kilobytes). */
export const WEBHOOK_MAX_BYTES = 64 * 1024;
/** A row with no event for this long is dropped. */
export const SUPPRESSION_RETENTION_DAYS = 365;

const ADDRESS = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** The bare address, lowercased, also out of a display form („Ana <ana@x.ro>”); null when it isn't one. */
export function normalizeAddress(email: string | null | undefined): string | null {
  const raw = (email ?? "").trim();
  const inner = /<([^<>]+)>\s*$/.exec(raw)?.[1] ?? raw;
  const e = inner.trim().toLowerCase();
  return ADDRESS.test(e) ? e : null;
}

/**
 * The key the list is kept under: an HMAC of the normalized address with the server's own secret, so the
 * table can't be matched against a list of addresses elsewhere. A new secret simply starts a new list.
 */
export function addressHash(
  email: string | null | undefined,
  secret: string | undefined = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
): string | null {
  const e = normalizeAddress(email);
  if (!e) return null;
  return secret
    ? createHmac("sha256", `email-suppression:${secret}`).update(e).digest("hex")
    : createHash("sha256").update(e).digest("hex");
}

/** Whether the webhook's signature headers can be right, checked before the body is read. */
export function plausibleWebhookHeaders(
  h: { id: string | null; timestamp: string | null; signature: string | null },
  nowMs = Date.now(),
): boolean {
  if (!h.id || !h.timestamp || !h.signature) return false;
  const ts = Number(h.timestamp);
  return Number.isFinite(ts) && Math.abs(nowMs / 1000 - ts) <= WEBHOOK_TOLERANCE_SEC;
}

/** Whether a declared body size is over the limit (no declaration: decided after reading). */
export function declaredTooLarge(contentLength: string | null): boolean {
  return contentLength !== null && !(Number(contentLength) <= WEBHOOK_MAX_BYTES);
}

/**
 * Resend signs its webhooks with Svix: HMAC-SHA256 of `${id}.${timestamp}.${body}` with the secret's
 * base64 part (after „whsec_”), base64-encoded; the header lists one or more `v1,<signature>` entries.
 * Pure, so it is tested without a server.
 */
export function verifyResendSignature(input: {
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  body: string;
  secret: string;
  nowMs?: number;
}): boolean {
  const { id, timestamp, signatureHeader, body, secret } = input;
  if (!id || !timestamp || !signatureHeader || !secret) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = (input.nowMs ?? Date.now()) / 1000;
  if (Math.abs(now - ts) > WEBHOOK_TOLERANCE_SEC) return false;
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret, "base64");
  if (key.length === 0) return false;
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64"));
  return signatureHeader.split(" ").some((part) => {
    const [version, signature] = part.split(",", 2);
    if (version !== "v1" || !signature) return false;
    const given = Buffer.from(signature);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

type ResendEvent = {
  type?: unknown;
  created_at?: unknown;
  data?: { to?: unknown; bounce?: { type?: unknown; subType?: unknown } | null } | null;
};

export type SuppressionChange =
  | { kind: "suppress"; emails: string[]; reason: SuppressionReason; detail: string | null; at: Date }
  | { kind: "release"; emails: string[]; at: Date };

/**
 * What one Resend event changes, or null. A bounce counts only when Resend calls it permanent (or
 * doesn't say: `email.bounced` is documented as a permanent rejection); a delivery releases the address.
 */
export function changeFromEvent(event: ResendEvent, nowMs = Date.now()): SuppressionChange | null {
  const data = event.data ?? null;
  const to = Array.isArray(data?.to) ? data.to : typeof data?.to === "string" ? [data.to] : [];
  // One recipient only: the event doesn't say which of several bounced or got the message.
  if (to.length !== 1) return null;
  const emails = [...new Set(to.map((t) => normalizeAddress(typeof t === "string" ? t : null)).filter((e): e is string => !!e))];
  if (emails.length === 0) return null;
  const stamp = typeof event.created_at === "string" ? new Date(event.created_at) : null;
  const dated = stamp !== null && Number.isFinite(stamp.getTime());
  const at = dated ? stamp : new Date(nowMs);
  switch (event.type) {
    case "email.bounced": {
      const kindRaw = data?.bounce?.type;
      if (kindRaw !== undefined && kindRaw !== null && typeof kindRaw !== "string") return null;
      const kind = typeof kindRaw === "string" ? kindRaw : null;
      if (kind && kind.toLowerCase() !== "permanent") return null;
      const sub = typeof data?.bounce?.subType === "string" ? data.bounce.subType : null;
      return { kind: "suppress", emails, reason: "bounced", detail: [kind, sub].filter(Boolean).join(" / ") || null, at };
    }
    case "email.complained":
      return { kind: "suppress", emails, reason: "complained", detail: null, at };
    case "email.suppressed":
      return { kind: "suppress", emails, reason: "suppressed", detail: null, at };
    case "email.delivered":
      // A release needs Resend's own date: ours can't be compared with the suppression it would end.
      return dated ? { kind: "release", emails, at } : null;
    default:
      return null;
  }
}

/** Whether a row stops automatic mail: suppressed, and not released by a later delivery. */
export function stillSuppressed(row: { lastEventAt: Date; releasedAt: Date | null }): boolean {
  return row.releasedAt === null || row.lastEventAt.getTime() > row.releasedAt.getTime();
}

/**
 * Applies one change. A bounce is never downgraded. A release marks the row released when the delivery is
 * later than the latest suppression; a suppression older than a release (a late retry) changes nothing.
 * Dates are written in UTC whatever the database session's time zone.
 */
export async function applyChange(change: SuppressionChange): Promise<number> {
  const hashes = change.emails.map((e) => addressHash(e)).filter((h): h is string => !!h);
  if (hashes.length === 0) return 0;
  if (change.kind === "release") {
    return prisma.$executeRaw`
      UPDATE "EmailSuppression"
      SET "releasedAt" = GREATEST(COALESCE("releasedAt", (${change.at}::timestamptz AT TIME ZONE 'UTC')), (${change.at}::timestamptz AT TIME ZONE 'UTC')),
          "updatedAt" = (NOW() AT TIME ZONE 'UTC')
      WHERE "emailHash" IN (${Prisma.join(hashes)})
        AND "lastEventAt" < (${change.at}::timestamptz AT TIME ZONE 'UTC')`;
  }
  for (const h of hashes) {
    await prisma.$executeRaw`
      INSERT INTO "EmailSuppression" ("emailHash", "reason", "detail", "count", "lastEventAt", "createdAt", "updatedAt")
      VALUES (${h}, ${change.reason}, ${change.detail}, 1, (${change.at}::timestamptz AT TIME ZONE 'UTC'),
              (NOW() AT TIME ZONE 'UTC'), (NOW() AT TIME ZONE 'UTC'))
      ON CONFLICT ("emailHash") DO UPDATE SET
        "reason" = CASE WHEN "EmailSuppression"."reason" = 'bounced' THEN 'bounced' ELSE EXCLUDED."reason" END,
        "detail" = COALESCE(EXCLUDED."detail", "EmailSuppression"."detail"),
        "count" = "EmailSuppression"."count" + 1,
        "lastEventAt" = GREATEST("EmailSuppression"."lastEventAt", EXCLUDED."lastEventAt"),
        "updatedAt" = (NOW() AT TIME ZONE 'UTC')`;
  }
  return hashes.length;
}

/** Drops rows with no news for SUPPRESSION_RETENTION_DAYS. */
export async function purgeStaleSuppressions(nowMs = Date.now()): Promise<number> {
  const r = await prisma.emailSuppression.deleteMany({
    where: { updatedAt: { lt: new Date(nowMs - SUPPRESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
  });
  return r.count;
}

/** Why automatic mail must not go to an address, or null. A failed lookup answers null: the send goes ahead. */
export async function suppressionFor(email: string): Promise<SuppressionReason | null> {
  const key = addressHash(email);
  if (!key) return null;
  try {
    const row = await prisma.emailSuppression.findUnique({
      where: { emailHash: key },
      select: { reason: true, lastEventAt: true, releasedAt: true },
    });
    if (!row || !stillSuppressed(row)) return null;
    const reason = row.reason;
    return reason === "bounced" || reason === "complained" || reason === "suppressed" ? reason : null;
  } catch (err) {
    logger.warn("Suppression lookup failed; the email is sent", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
