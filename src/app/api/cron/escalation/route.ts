import { NextRequest, NextResponse } from "next/server";
import { detectMissedSessions, advancePendingEscalations } from "@/lib/escalation/engine";

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
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
  } catch (error) {
    console.error("Cron escalation error:", error);
    return NextResponse.json(
      { error: "Escalation processing failed" },
      { status: 500 }
    );
  }
}
