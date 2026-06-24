/**
 * Schedule-aware streak: the study streak counts SCHEDULED study days, not raw
 * calendar days. A gap over a weekend / vacation (days with no scheduled session)
 * must NOT break the streak — only a missed *scheduled* day does.
 */
import { prisma } from "@/lib/prisma";

const ymdLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ymdUTC = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

/**
 * Was a SCHEDULED study day missed strictly between `lastDay` and `today`
 * (both local-midnight Dates)? A day counts as scheduled if its weekday is in any
 * active StudyReminder and it isn't inside a StudyBreak. If the user has no
 * schedule at all, we fall back to the legacy calendar rule (any gap = miss).
 */
export async function wasScheduledDayMissed(
  userId: string,
  lastDay: Date,
  today: Date
): Promise<boolean> {
  const reminders = await prisma.studyReminder.findMany({
    where: { userId, isActive: true },
    select: { daysOfWeek: true },
  });
  if (reminders.length === 0) return true; // no schedule → legacy behavior
  const scheduled = new Set<number>(reminders.flatMap((r) => r.daysOfWeek));
  const breaks = await prisma.studyBreak.findMany({
    where: { userId },
    select: { startDate: true, endDate: true },
  });
  const inBreak = (ymd: string) =>
    breaks.some((b) => ymd >= ymdUTC(b.startDate) && ymd <= ymdUTC(b.endDate));

  const cur = new Date(lastDay.getTime());
  cur.setDate(cur.getDate() + 1);
  let guard = 0;
  while (cur < today && guard++ < 400) {
    if (scheduled.has(cur.getDay()) && !inBreak(ymdLocal(cur))) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}
