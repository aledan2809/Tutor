/**
 * Scheduled study reminders. On a reminder's days+time it starts an escalation
 * cascade (push → Telegram → email → WhatsApp) carrying a deep-link into the
 * right session. `window` (morning/evening) is encoded into the escalation
 * `reason` so the cascade grace resolves to the matching pace.
 */

import { prisma } from "@/lib/prisma";
import { startEscalation } from "./engine";
import { userIdsOnBreak } from "./breaks";
import { pausedUserIds } from "@/lib/access-server";

export interface ReminderLike {
  isActive: boolean;
  daysOfWeek: number[];
  hour: number;
  minute: number;
  timezone: string;
  lastFiredOn: string | null;
}

// A reminder fires at-or-after its time, within this window — covers a missed
// cron tick without firing hours late. lastFiredOn prevents same-day re-fire.
const FIRE_WINDOW_MIN = 60;

/**
 * One formatter per time zone: building an Intl.DateTimeFormat costs ten times formatting with one,
 * and every active reminder is checked every minute (review r6, F7).
 */
const formatters = new Map<string, Intl.DateTimeFormat>();
function formatterFor(timezone: string): Intl.DateTimeFormat {
  let f = formatters.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timezone, f);
  }
  return f;
}

function tzParts(now: Date, timezone: string): {
  weekday: number;
  minutesOfDay: number;
  today: string;
} {
  const parts = Object.fromEntries(
    formatterFor(timezone)
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const y = Number(parts.year);
  const mo = Number(parts.month);
  const d = Number(parts.day);
  // Weekday for a calendar date is timezone-independent → compute via UTC.
  const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return {
    weekday,
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
    today: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/** Pure: is this reminder due now? Also returns today's date string (tz-local). */
export function isReminderDue(
  reminder: ReminderLike,
  now: Date
): { due: boolean; today: string } {
  const { weekday, minutesOfDay, today } = tzParts(now, reminder.timezone);
  if (!reminder.isActive) return { due: false, today };
  if (!reminder.daysOfWeek.includes(weekday)) return { due: false, today };
  if (reminder.lastFiredOn === today) return { due: false, today };
  const scheduled = reminder.hour * 60 + reminder.minute;
  const due = minutesOfDay >= scheduled && minutesOfDay < scheduled + FIRE_WINDOW_MIN;
  return { due, today };
}

/**
 * Is a scheduled study session imminent for this user — i.e. about to fire
 * within `withinMin` minutes (or in the last few minutes)? Used by parent nudges
 * so a repeating SERIES doesn't overlap the child's NEXT scheduled session.
 *
 * Forward-looking by design: a reminder that already fired a while ago (e.g. an
 * ignored 14:45 session viewed at 15:20) is NOT imminent — the parent must be
 * able to send a memento for it. Only a small backward grace covers a reminder
 * that fired in the last few minutes (its cascade is still actively running).
 */
const IMMINENT_BACK_GRACE_MIN = 10;
export async function reminderImminent(
  userId: string,
  now: Date,
  withinMin: number
): Promise<boolean> {
  const reminders = await prisma.studyReminder.findMany({
    where: { userId, isActive: true },
  });
  for (const r of reminders) {
    const { weekday, minutesOfDay } = tzParts(now, r.timezone);
    if (!r.daysOfWeek.includes(weekday)) continue;
    const scheduled = r.hour * 60 + r.minute;
    const delta = scheduled - minutesOfDay; // minutes until scheduled time today
    if (delta >= -IMMINENT_BACK_GRACE_MIN && delta <= withinMin) return true;
  }
  return false;
}

export interface UpcomingReminder {
  id: string;
  label: string | null;
  sessionType: string;
  window: string;
  domainSlug: string | null;
  hour: number;
  minute: number;
  inMin: number;
}

/** Active reminders scheduled to fire within the next `withinMin` minutes today. */
export async function upcomingReminders(
  userId: string,
  now: Date,
  withinMin: number
): Promise<UpcomingReminder[]> {
  const reminders = await prisma.studyReminder.findMany({ where: { userId, isActive: true } });
  const out: UpcomingReminder[] = [];
  for (const r of reminders) {
    const { weekday, minutesOfDay } = tzParts(now, r.timezone);
    if (!r.daysOfWeek.includes(weekday)) continue;
    const delta = r.hour * 60 + r.minute - minutesOfDay;
    if (delta > 0 && delta <= withinMin) {
      out.push({
        id: r.id,
        label: r.label,
        sessionType: r.sessionType,
        window: r.window,
        domainSlug: r.domainSlug,
        hour: r.hour,
        minute: r.minute,
        inMin: delta,
      });
    }
  }
  return out.sort((a, b) => a.inMin - b.inMin);
}

/** Deep-link that auto-starts the reminder's session type (+ optional subject). */
export function buildReminderUrl(r: { sessionType: string; domainSlug: string | null }): string {
  const q = new URLSearchParams({ start: r.sessionType });
  if (r.domainSlug) q.set("domain", r.domainSlug);
  return `/dashboard/practice?${q.toString()}`;
}

const SESSION_TYPE_RO: Record<string, string> = {
  micro: "Sesiune micro",
  quick: "Sesiune rapidă",
  deep: "Sesiune lungă",
  repair: "Sesiune de remediere",
  recovery: "Sesiune de recuperare",
  intensive: "Sesiune intensivă",
};

// Each scheduled session gets its OWN, identifiable notification (type + time),
// so multiple sessions in the same window aren't vague/indistinguishable.
function reminderCopy(r: {
  window: string;
  label: string | null;
  sessionType: string;
  hour: number;
  minute: number;
}): { title: string; message: string } {
  const time = `${String(r.hour).padStart(2, "0")}:${String(r.minute).padStart(2, "0")}`;
  const typeLabel = SESSION_TYPE_RO[r.sessionType] ?? r.sessionType;
  const title = r.label?.trim() || `${typeLabel} · ${time}`;
  return { title, message: `${typeLabel} programată la ${time} — hai să începem.` };
}

/**
 * Fire all due reminders (called from the cron). Starts an escalation cascade
 * per due reminder and stamps lastFiredOn to prevent same-day re-fire. Returns
 * how many fired.
 */
export async function runDueReminders(now: Date = new Date()): Promise<number> {
  const reminders = await prisma.studyReminder.findMany({ where: { isActive: true } });
  const onBreak = await userIdsOnBreak(now);
  // vacanță: nu trimitem remindere. Each reminder's due check once per run.
  const due = reminders
    .filter((r) => !onBreak.has(r.userId))
    .map((r) => ({ r, ...isReminderDue(r, now) }))
    .filter((x) => x.due);
  // Only the reminders due now need the (per-account) pause check.
  const paused = await pausedUserIds(due.map(({ r }) => r.userId), now);
  let fired = 0;
  for (const { r, today } of due) {
    if (paused.has(r.userId)) {
      // Proba gratuită s-a încheiat fără plată: contul e în pauză. Marked as done for today, so the
      // account isn't checked again on every minute of the reminder's hour.
      await prisma.studyReminder.update({ where: { id: r.id }, data: { lastFiredOn: today } }).catch(() => {});
      continue;
    }
    const { title, message } = reminderCopy(r);
    // Marked as fired before its chain starts, and only by the run that marks it: two runs at once
    // (one that outlived its lease) would otherwise both start a chain for the same reminder.
    const claimed = await prisma.studyReminder.updateMany({
      where: { id: r.id, OR: [{ lastFiredOn: null }, { lastFiredOn: { not: today } }] },
      data: { lastFiredOn: today },
    });
    if (claimed.count === 0) continue;
    try {
      await startEscalation({
        userId: r.userId,
        reason: `${r.window}_${r.sessionType}`,
        metadata: {
          url: buildReminderUrl(r),
          title,
          message,
          sessionType: r.sessionType,
          reminderId: r.id,
        },
      });
      fired++;
    } catch {
      // Never let one bad reminder block the rest; the next minute tries it again.
      await prisma.studyReminder
        .updateMany({ where: { id: r.id, lastFiredOn: today }, data: { lastFiredOn: r.lastFiredOn } })
        .catch(() => {});
    }
  }
  return fired;
}
