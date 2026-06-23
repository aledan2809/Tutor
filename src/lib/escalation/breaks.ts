/**
 * Study breaks (vacanță). During a break [startDate, endDate] (inclusive, by
 * Europe/Bucharest calendar date) a student is fully exempt: no reminders fire,
 * no escalation chains advance, and no parent alerts are raised. The cron paths
 * consult these helpers before acting on a user.
 */
import { prisma } from "@/lib/prisma";

/** The Europe/Bucharest calendar date of `now`, as a UTC-midnight Date (matches @db.Date storage). */
export function bucharestDateUTC(now: Date): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** Set of userIds currently on a break — for the cron loops (one query). */
export async function userIdsOnBreak(now: Date = new Date()): Promise<Set<string>> {
  const d = bucharestDateUTC(now);
  const rows = await prisma.studyBreak.findMany({
    where: { startDate: { lte: d }, endDate: { gte: d } },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

/** Whether a single user is on a break today. */
export async function isUserOnBreak(userId: string, now: Date = new Date()): Promise<boolean> {
  const d = bucharestDateUTC(now);
  const c = await prisma.studyBreak.count({
    where: { userId, startDate: { lte: d }, endDate: { gte: d } },
  });
  return c > 0;
}
