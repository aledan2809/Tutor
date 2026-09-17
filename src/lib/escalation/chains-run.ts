/**
 * The reminder part of the cron, run on its own every minute (/api/cron/escalation/fast) and also
 * from the 15-minute cron: due study reminders start their chain, and chains move to the next rung.
 *
 * Every minute because the parents' page promises minutes, not quarters of an hour: a 6-minute wait
 * in the morning, 18 in the evening, the first reminder at the time the child set. With a 15-minute
 * cron each of those was up to 15 minutes late (review 2 of delivery 1, 17.09.2026).
 *
 * The lease keeps the two callers from running it at the same time.
 */
import { withCronLease } from "@/lib/cron-lease";
import { advancePendingEscalations, closeStuckSends } from "@/lib/escalation/engine";
import { runDueReminders } from "@/lib/escalation/reminders";

/** Longer than any normal run; a run that dies frees the lease after this. */
const CHAINS_LEASE_MS = 10 * 60_000;

export type ChainsRun = { ran: boolean; stuckClosed: number; remindersFired: number; escalationsAdvanced: number };

export async function runReminderChains(): Promise<ChainsRun> {
  const run = await withCronLease("reminder-chains", CHAINS_LEASE_MS, async () => {
    // First: a rung a dead run left claimed would make today's reminder find its chain „active".
    const stuckClosed = await closeStuckSends();
    const remindersFired = await runDueReminders();
    const escalationsAdvanced = await advancePendingEscalations();
    return { stuckClosed, remindersFired, escalationsAdvanced };
  });
  return run.ran ? { ran: true, ...run.result } : { ran: false, stuckClosed: 0, remindersFired: 0, escalationsAdvanced: 0 };
}
