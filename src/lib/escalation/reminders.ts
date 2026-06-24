/**
 * Scheduled study reminders. On a reminder's days+time it starts an escalation
 * cascade (push → Telegram → email → WhatsApp) carrying a deep-link into the
 * right session. `window` (morning/evening) is encoded into the escalation
 * `reason` so the cascade grace resolves to the matching pace.
 */

import { prisma } from "@/lib/prisma";
import { startEscalation } from "./engine";
import { userIdsOnBreak } from "./breaks";

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

function tzParts(now: Date, timezone: string): {
  weekday: number;
  minutesOfDay: number;
  today: string;
} {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
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
 * Is a scheduled study session imminent for this user — about to fire within
 * `withinMin`, or already inside its fire window? Used by parent nudges so a
 * series doesn't overlap the child's next scheduled session.
 */
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
    // Imminent if it's just fired (within its window) or fires within `withinMin`.
    if (delta >= -FIRE_WINDOW_MIN && delta <= withinMin) return true;
  }
  return false;
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
  let fired = 0;
  for (const r of reminders) {
    if (onBreak.has(r.userId)) continue; // vacanță: nu trimitem remindere
    const { due, today } = isReminderDue(r, now);
    if (!due) continue;
    const { title, message } = reminderCopy(r);
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
      await prisma.studyReminder.update({
        where: { id: r.id },
        data: { lastFiredOn: today },
      });
      fired++;
    } catch {
      // Never let one bad reminder block the rest.
    }
  }
  return fired;
}
