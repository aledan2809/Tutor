import { NextRequest, NextResponse } from "next/server";
import { detectMissedSessions, escalationDetectionEnabled } from "@/lib/escalation/engine";
import { runReminderChains } from "@/lib/escalation/chains-run";
import { runParentMonitoring } from "@/lib/escalation/parent-monitor";
import { runParentNudges } from "@/lib/escalation/parent-nudge";
import { runThresholdChecks } from "@/lib/escalation/threshold-monitor";
import { runFeedbackReview } from "@/lib/feedback-review";
import { runWatcherReports } from "@/lib/escalation/watcher-reports";
import { runAccessLifecycle } from "@/lib/access-lifecycle";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * POST /api/cron/escalation — Cron job endpoint for escalation processing
 *
 * Protected by CRON_SECRET header.
 * Should be called every 15 minutes by an external cron service. Reminders and chain steps also
 * run every minute from /api/cron/escalation/fast; a shared lease lets only one caller run them.
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

  // Scheduled reminders run first (they may start fresh chains), then advancement of all pending
  // chains, then detection. When the minute cron holds the lease, it is doing the first two and this
  // run skips them.
  const chains = await runReminderChains();
  const missedUserIds = await detectMissedSessions();
  // Parent monitoring runs after advancement so it sees the latest chain state.
  const parentMonitoring = await runParentMonitoring();
  // Parent on-demand nudges (custom message, repeat every N min until reaction).
  const parentNudges = await runParentNudges();
  // Auto-review of 👎 question feedback (fix/hide on private banks, flag curriculum).
  const feedbackReview = await runFeedbackReview();
  // Scheduled Watcher KPI reports (daily/weekly digest to parents).
  const watcherReports = await runWatcherReports();
  // Instructor escalation thresholds (streak / score / missed sessions).
  const thresholdAlerts = await runThresholdChecks();
  // The 7-day trial's messages to parents (launch, 3 days, last day, paused). Nothing while the
  // pause switch is off.
  const accessLifecycle = await runAccessLifecycle();

  return NextResponse.json({
    success: true,
    detectionEnabled: escalationDetectionEnabled(),
    remindersFired: chains.remindersFired,
    missedSessions: missedUserIds.length,
    escalationsAdvanced: chains.escalationsAdvanced,
    chainsRan: chains.ran,
    parentMonitoring,
    parentNudges,
    feedbackReview,
    watcherReports,
    thresholdAlerts,
    accessLifecycle,
    timestamp: new Date().toISOString(),
  });
}

export const POST = withErrorHandler(_POST);
