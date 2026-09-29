import { NextRequest, NextResponse } from "next/server";
import { runConsentReminders } from "@/lib/consent-reminders";
import { eraseLapsedConsentAccounts, flushErasureReports, purgeConsentCounters, sweepOrphanFiles } from "@/lib/account-erasure";
import { runInactiveAccounts } from "@/lib/inactive-accounts";
import { logger } from "@/lib/logger";

/**
 * What must not be kept, and the warnings before it goes (Alex, 28–29.09.2026), hourly:
 *  1. reminders to a parent who hasn't answered for a learner under 16 (days 7, 30, 35);
 *  2. erasures: accounts a parent refused whose erasure didn't finish, and accounts no parent answered
 *     for, once the last reminder's date has passed;
 *  3. accounts 12 months in the pause with nobody signing in: warnings 30/7/1 days ahead, then erased;
 *  4. housekeeping: the Legal Hub told of erasures it hasn't heard of yet, the day-long limits on
 *     consent e-mails dropped once expired (they hold the addresses a learner typed), and files of
 *     erased accounts that couldn't be removed at the time.
 * Messages only between 9:00 and 20:00 (Bucharest); erasures at any hour.
 *
 * Called by cron with the shared secret, like the other cron routes; unreachable from the internet
 * (the vhost answers 404 on /api/cron/).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const reminders = await runConsentReminders(now);
  const consent = await eraseLapsedConsentAccounts(now);
  const inactive = await runInactiveAccounts(now);
  const reports = await flushErasureReports();
  const purged = await purgeConsentCounters(now);
  const orphanFiles = await sweepOrphanFiles(now);
  if (reminders.failed || consent.failed || consent.heldForPayments || inactive.failed || reports.pending) {
    logger.warn("Account retention left accounts for a person or a retry", { reminders, consent, inactive, reports });
  }
  return NextResponse.json({ ok: true, reminders, consent, inactive, reports, purged, orphanFiles });
}
