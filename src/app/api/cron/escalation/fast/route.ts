import { NextRequest, NextResponse } from "next/server";
import { runReminderChains } from "@/lib/escalation/chains-run";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * POST /api/cron/escalation/fast — every minute: due reminders and the next rung of each chain.
 * The rest of the escalation cron (parent alerts, nudges, reports) stays at 15 minutes.
 *
 * Protected by CRON_SECRET, like /api/cron/escalation.
 */
async function _POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chains = await runReminderChains();
  return NextResponse.json({ success: true, ...chains, timestamp: new Date().toISOString() });
}

export const POST = withErrorHandler(_POST);
