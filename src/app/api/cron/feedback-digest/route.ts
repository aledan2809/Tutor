import { NextRequest, NextResponse } from "next/server";
import { sendPendingFeedbackDigest } from "@/lib/feedback-digest";

/**
 * Once a day: every student complaint still waiting for a person, as a decision to take — not a
 * count. Nothing is sent when the queue is empty.
 *
 * Called by cron with the shared secret, like the other cron routes; unreachable from the internet
 * (the vhost answers 404 on /api/cron/).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendPendingFeedbackDigest();
  return NextResponse.json({ ok: true, ...result });
}
