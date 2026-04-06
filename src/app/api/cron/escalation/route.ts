import { NextRequest, NextResponse } from "next/server";
import { detectMissedSessions, advancePendingEscalations } from "@/lib/escalation/engine";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * POST /api/cron/escalation — Cron job endpoint for escalation processing
 *
 * Protected by CRON_SECRET header.
 * Should be called every 15 minutes by an external cron service.
 *
 * Actions:
 * 1. Detect users with missed sessions → start escalation
 * 2. Advance pending escalation chains (check delays, send next level)
 */
async function _POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  // H04: Fail-safe - deny if no CRON_SECRET configured
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [missedUserIds, advancedCount] = await Promise.all([
    detectMissedSessions(),
    advancePendingEscalations(),
  ]);

  return NextResponse.json({
    success: true,
    missedSessions: missedUserIds.length,
    escalationsAdvanced: advancedCount,
    timestamp: new Date().toISOString(),
  });
}

export const POST = withErrorHandler(_POST);
