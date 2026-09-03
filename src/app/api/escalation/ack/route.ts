import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { safeRedirectPath } from "@/lib/escalation/tap-link";

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

/**
 * GET /api/escalation/ack?e=<escalationEventId>&to=<relative path>
 *
 * The Telegram (and any future link-only channel) equivalent of the push tap.
 * A push carries `escalationEventId` into the service worker, which POSTs here;
 * a Telegram inline button is just a URL, so a tap left `acknowledgedAt` null and
 * the cascade escalated to the next rung ANYWAY — the student answered on the free
 * channel and still got the paid/next nudge. This route closes that gap: it records
 * the acknowledgement, then redirects on to the session the button promised.
 *
 * Same auth posture as POST above, and for the same reasons (unguessable cuid, the
 * only effect is suppressing a follow-up nudge). Redirects even when the ack fails,
 * so a stale link never strands the student on an error page.
 */
async function _GET(req: NextRequest) {
  const url = new URL(req.url);
  const escalationEventId = url.searchParams.get("e");
  const to = safeRedirectPath(url.searchParams.get("to"));

  if (escalationEventId) {
    try {
      await prisma.escalationEvent.updateMany({
        where: { id: escalationEventId, acknowledgedAt: null },
        data: { acknowledgedAt: new Date() },
      });
    } catch {
      // Getting the student into the session matters more than the bookkeeping.
    }
  }

  // Location RELATIV, dinadins. `new URL(to, url.origin)` pare corect și e greșit în
  // producție: în spatele nginx `url.origin` e originea INTERNĂ (https://localhost:3013),
  // deci butonul din Telegram trimitea telefonul elevului către localhost. O cale
  // relativă o rezolvă browserul față de originea publică, oricare ar fi ea — și e
  // sigură fiindcă `safeRedirectPath` a garantat deja un singur slash inițial.
  return new NextResponse(null, { status: 302, headers: { Location: to } });
}

export const GET = withErrorHandler(_GET);
