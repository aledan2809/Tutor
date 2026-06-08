import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * POST /api/escalation/ack — record that the user tapped the push notification
 * for an escalation event. Called by the service worker (public/sw-push.js) on
 * `notificationclick`. An acknowledged event is NOT escalated to the next (paid)
 * WhatsApp/SMS channel — the push-first cost gate (see escalation/engine.ts
 * advancePendingEscalations).
 *
 * No session required: this runs from the service-worker fetch context where a
 * session cookie may not be reliably attached. The escalationEventId is an
 * unguessable cuid and the only effect is suppressing a follow-up nudge, so an
 * unauthenticated call carries negligible risk.
 *
 * Body: { escalationEventId: string }
 */
async function _POST(req: NextRequest) {
  let escalationEventId: string | undefined;
  try {
    const body = await req.json();
    escalationEventId =
      typeof body?.escalationEventId === "string"
        ? body.escalationEventId
        : undefined;
  } catch {
    escalationEventId = undefined;
  }

  if (!escalationEventId) {
    return NextResponse.json(
      { error: "escalationEventId required" },
      { status: 400 }
    );
  }

  // Idempotent (acknowledgedAt: null guard) + no-throw on unknown id
  // (updateMany returns count 0 instead of P2025).
  const result = await prisma.escalationEvent.updateMany({
    where: { id: escalationEventId, acknowledgedAt: null },
    data: { acknowledgedAt: new Date() },
  });

  return NextResponse.json({ success: true, acknowledged: result.count });
}

export const POST = withErrorHandler(_POST);
