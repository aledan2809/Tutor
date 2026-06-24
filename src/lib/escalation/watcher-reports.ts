/**
 * Scheduled Watcher reports (cron). On a schedule's day/time it builds a KPI
 * report for the parent's child(ren) and delivers it on the chosen channels
 * (email / push / Telegram). `lastSentOn` prevents same-day re-send.
 */

import { prisma } from "@/lib/prisma";
import { getLinkedChildIds } from "@/lib/guardian";
import { webPushToUser, telegramAlertToUser } from "@/lib/notifications/service";
import { sendAppEmail } from "@/lib/email";
import {
  buildChildReport,
  renderReportHtml,
  renderReportText,
  ALL_SECTIONS,
  type ChildReport,
  type ReportSection,
} from "@/lib/watcher-report";

// Cron runs ~every 15 min; a report fires at-or-after its time within this
// window so a missed tick doesn't skip the day.
const FIRE_WINDOW_MIN = 60;

interface ScheduleLike {
  cadence: string;
  dayOfWeek: number | null;
  hour: number;
  minute: number;
  timezone: string;
  lastSentOn: string | null;
}

function tzParts(now: Date, timezone: string): { weekday: number; minutesOfDay: number; today: string } {
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
  const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return {
    weekday,
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
    today: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/** Pure: is this schedule due now? Also returns today's tz-local date string. */
export function isReportDue(s: ScheduleLike, now: Date): { due: boolean; today: string } {
  const { weekday, minutesOfDay, today } = tzParts(now, s.timezone);
  if (s.lastSentOn === today) return { due: false, today };
  if (s.cadence === "weekly" && s.dayOfWeek != null && s.dayOfWeek !== weekday)
    return { due: false, today };
  const scheduled = s.hour * 60 + s.minute;
  const due = minutesOfDay >= scheduled && minutesOfDay < scheduled + FIRE_WINDOW_MIN;
  return { due, today };
}

function sanitizeSections(arr: string[]): ReportSection[] {
  const out = arr.filter((x): x is ReportSection => (ALL_SECTIONS as string[]).includes(x));
  return out.length ? out : ALL_SECTIONS;
}

/** Build all child reports for a schedule (childId, or all linked children). */
export async function buildReportsForSchedule(
  schedule: { parentId: string; childId: string | null; cadence: string; sections: string[] },
  now: Date = new Date()
): Promise<{ reports: ChildReport[]; sections: ReportSection[]; periodLabel: string }> {
  const sections = sanitizeSections(schedule.sections);
  const isDaily = schedule.cadence === "daily";
  const since = new Date(now.getTime() - (isDaily ? 24 : 7 * 24) * 3_600_000);
  const periodLabel = isDaily ? "ultimele 24h" : "ultimele 7 zile";

  let childIds: string[];
  if (schedule.childId) {
    // Re-verify the link still holds (guard against a removed Guardian row).
    const linked = await getLinkedChildIds(schedule.parentId);
    childIds = linked.includes(schedule.childId) ? [schedule.childId] : [];
  } else {
    childIds = await getLinkedChildIds(schedule.parentId);
  }

  const reports = await Promise.all(
    childIds.map((id) => buildChildReport(id, since, periodLabel, sections))
  );
  return { reports, sections, periodLabel };
}

/** Deliver a built report to the parent on the requested channels. */
export async function deliverReport(
  parentId: string,
  reports: ChildReport[],
  sections: ReportSection[],
  channels: string[],
  periodLabel: string
): Promise<{ email: boolean; push: number; telegram: boolean }> {
  const result = { email: false, push: 0, telegram: false };
  if (reports.length === 0) return result;

  const url = `${(process.env.AUTH_URL ?? "https://etutor.ro").replace(/\/$/, "")}/dashboard/watcher`;
  const subject = `eTutor — raport ${periodLabel}`;

  if (channels.includes("EMAIL")) {
    const parent = await prisma.user.findUnique({ where: { id: parentId }, select: { email: true } });
    if (parent?.email) {
      result.email = await sendAppEmail({
        to: parent.email,
        subject,
        html: renderReportHtml(reports, sections),
      });
    }
  }
  if (channels.includes("PUSH")) {
    result.push = await webPushToUser(parentId, {
      title: subject,
      body: renderReportText(reports, sections).slice(0, 280),
      url: "/dashboard/watcher",
    });
  }
  if (channels.includes("TELEGRAM")) {
    result.telegram = await telegramAlertToUser(parentId, {
      text: `📊 ${subject}\n\n${renderReportText(reports, sections)}`,
      url,
      buttonLabel: "Vezi panoul",
    });
  }
  return result;
}

/** Build + deliver a single schedule immediately (used by the "send now" API). */
export async function sendScheduleNow(scheduleId: string, now: Date = new Date()) {
  const s = await prisma.watcherReportSchedule.findUnique({ where: { id: scheduleId } });
  if (!s) return { ok: false as const, error: "not_found" };
  const { reports, sections, periodLabel } = await buildReportsForSchedule(s, now);
  const delivery = await deliverReport(s.parentId, reports, sections, s.channels, periodLabel);
  return { ok: true as const, children: reports.length, delivery };
}

/** Fire all due schedules (called from the cron). Returns how many sent. */
export async function runWatcherReports(now: Date = new Date()): Promise<number> {
  const schedules = await prisma.watcherReportSchedule.findMany({ where: { isActive: true } });
  let sent = 0;
  for (const s of schedules) {
    const { due, today } = isReportDue(s, now);
    if (!due) continue;
    try {
      const { reports, sections, periodLabel } = await buildReportsForSchedule(s, now);
      if (reports.length > 0) {
        await deliverReport(s.parentId, reports, sections, s.channels, periodLabel);
        sent++;
      }
      // Stamp lastSentOn even with 0 children so we don't retry all day.
      await prisma.watcherReportSchedule.update({
        where: { id: s.id },
        data: { lastSentOn: today },
      });
    } catch (e) {
      console.error("runWatcherReports error:", e);
    }
  }
  return sent;
}
