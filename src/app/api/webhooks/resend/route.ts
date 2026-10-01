import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  applyChange,
  changeFromEvent,
  declaredTooLarge,
  plausibleWebhookHeaders,
  purgeStaleSuppressions,
  verifyResendSignature,
  WEBHOOK_MAX_BYTES,
} from "@/lib/email-suppression";

export const dynamic = "force-dynamic";

/**
 * Resend webhook → the suppression list sendAppEmail reads (email-suppression.ts): email.bounced,
 * email.complained and email.suppressed add an address, email.delivered releases it.
 *
 * Fail-closed on the signature: without RESEND_WEBHOOK_SECRET nothing is accepted, and an unsigned
 * or stale request is refused — before its body is even read when the headers can't be right, and a
 * body over WEBHOOK_MAX_BYTES is refused too (this route has no per-address limit). Every verified
 * event gets a 200, including the ones that change nothing, so Resend doesn't retry them; only a
 * database error answers 500, and then Resend's retry is what we want.
 */
async function _POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const headers = {
    id: req.headers.get("svix-id"),
    timestamp: req.headers.get("svix-timestamp"),
    signature: req.headers.get("svix-signature"),
  };
  if (!plausibleWebhookHeaders(headers)) return NextResponse.json({ ok: false }, { status: 401 });
  if (declaredTooLarge(req.headers.get("content-length"))) return NextResponse.json({ ok: false }, { status: 413 });

  const body = await req.text();
  if (Buffer.byteLength(body) > WEBHOOK_MAX_BYTES) return NextResponse.json({ ok: false }, { status: 413 });
  const verified = verifyResendSignature({
    id: headers.id,
    timestamp: headers.timestamp,
    signatureHeader: headers.signature,
    body,
    secret,
  });
  if (!verified) return NextResponse.json({ ok: false }, { status: 401 });

  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!event || typeof event !== "object") return NextResponse.json({ ok: false }, { status: 400 });

  // Rows with no news for a year go (best effort: it never fails the event).
  await purgeStaleSuppressions().catch((err) => logger.warn("Suppression purge failed", { error: String(err) }));

  const change = changeFromEvent(event as Parameters<typeof changeFromEvent>[0]);
  if (!change) return NextResponse.json({ ok: true, changed: 0 });
  const changed = await applyChange(change);
  // The addresses are personal data: the log keeps the count and the reason only.
  if (change.kind === "suppress") {
    logger.warn("Email addresses suppressed after a Resend report", { reason: change.reason, count: changed });
  }
  return NextResponse.json({ ok: true, kind: change.kind, changed });
}

export const POST = withErrorHandler(_POST);
