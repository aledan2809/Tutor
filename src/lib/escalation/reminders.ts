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

/** Deep-link that auto-starts the reminder's session type (+ optional subject). */
export function buildReminderUrl(r: { sessionType: string; domainSlug: string | null }): string {
  const q = new URLSearchParams({ start: r.sessionType });
  if (r.domainSlug) q.set("domain", r.domainSlug);
  return `/dashboard/practice?${q.toString()}`;
}

function reminderCopy(r: { window: string; label: string | null }): { title: string; message: string } {
  if (r.label) return { title: r.label, message: "E timpul pentru sesiunea ta de studiu." };
  if (r.window === "morning") {
    return {
      title: "Quiz de 10–15 min?",
      message: "Un quiz scurt acum — păstrează-ți seria de studiu.",
    };
  }
  return {
    title: "Sesiune de seară",
    message: "E timpul pentru o sesiune mai amplă. Hai să recuperăm materia.",
  };
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
