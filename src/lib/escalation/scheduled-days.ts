/**
 * "Scheduled study day" gate for the nag machinery. Missed-session escalation and
 * parent alerts run off general inactivity, so without this they'd keep nudging on
 * days the student has nothing planned (weekends, off days) — which trains both the
 * child AND the parent to ignore everything. Vacation is handled separately
 * (StudyBreak / breaks.ts); this covers the regular "nothing scheduled today" case.
 *
 * A day counts as scheduled when an active reminder is set for today's weekday.
 * When the student has NO reminders at all, we fall back to the school week
 * (Mon–Fri) and never the weekend — so re-engagement still works without nagging
 * on Saturday/Sunday.
 */

import { prisma } from "@/lib/prisma";
import { bucharestDateUTC } from "./breaks";

/** Europe/Bucharest weekday of `now` (0=Sun … 6=Sat). */
export function bucharestWeekday(now: Date): number {
  // bucharestDateUTC anchors the Bucharest calendar date at UTC-midnight; the
  // weekday of a calendar date is timezone-independent.
  return bucharestDateUTC(now).getUTCDay();
}

/**
 * Pure decision: given today's weekday and each active reminder's `daysOfWeek`,
 * is today a scheduled study day? No reminders → default to the school week
 * (Mon–Fri), never the weekend.
 */
export function dayIsScheduled(weekday: number, reminderDays: number[][]): boolean {
  if (reminderDays.length === 0) return weekday >= 1 && weekday <= 5;
  return reminderDays.some((days) => days.includes(weekday));
}

/** Whether `now` is a scheduled study day for a single user. */
export async function isScheduledDay(userId: string, now: Date = new Date()): Promise<boolean> {
  const reminders = await prisma.studyReminder.findMany({
    where: { userId, isActive: true },
    select: { daysOfWeek: true },
  });
  return dayIsScheduled(bucharestWeekday(now), reminders.map((r) => r.daysOfWeek));
}

/**
 * Batch (one query): the subset of `userIds` whose today is a scheduled study day.
 * Used by the cron loops so each sweep makes a single reminders query, not one per
 * user.
 */
export async function scheduledTodayFilter(
  userIds: string[],
  now: Date = new Date(),
): Promise<Set<string>> {
  const scheduled = new Set<string>();
  if (userIds.length === 0) return scheduled;

  const weekday = bucharestWeekday(now);
  const reminders = await prisma.studyReminder.findMany({
    where: { userId: { in: userIds }, isActive: true },
    select: { userId: true, daysOfWeek: true },
  });

  const byUser = new Map<string, number[][]>();
  for (const r of reminders) {
    const list = byUser.get(r.userId) ?? [];
    list.push(r.daysOfWeek);
    byUser.set(r.userId, list);
  }

  for (const id of userIds) {
    if (dayIsScheduled(weekday, byUser.get(id) ?? [])) scheduled.add(id);
  }
  return scheduled;
}
