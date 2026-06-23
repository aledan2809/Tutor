import { NextRequest, NextResponse } from "next/server";
import {
  detectMissedSessions,
  advancePendingEscalations,
  escalationDetectionEnabled,
} from "@/lib/escalation/engine";
import { runDueReminders } from "@/lib/escalation/reminders";
import { runParentMonitoring } from "@/lib/escalation/parent-monitor";
import { runParentNudges } from "@/lib/escalation/parent-nudge";
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

  // Scheduled reminders run first (they may start fresh chains), then detection,
  // then advancement of all pending chains.
  const remindersFired = await runDueReminders();
  const [missedUserIds, advancedCount] = await Promise.all([
    detectMissedSessions(),
    advancePendingEscalations(),
  ]);
  // Parent monitoring runs after advancement so it sees the latest chain state.
  const parentMonitoring = await runParentMonitoring();
  // Parent on-demand nudges (custom message, repeat every N min until reaction).
  const parentNudges = await runParentNudges();

  return NextResponse.json({
    success: true,
    detectionEnabled: escalationDetectionEnabled(),
    remindersFired,
    missedSessions: missedUserIds.length,
    escalationsAdvanced: advancedCount,
    parentMonitoring,
    parentNudges,
    timestamp: new Date().toISOString(),
  });
}

export const POST = withErrorHandler(_POST);
