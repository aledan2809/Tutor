/**
 * Instructor threshold evaluation — makes the "Praguri de escaladare" the tutor
 * configures actually fire. Runs from the escalation cron.
 *
 * Metrics (matching the settings UI semantics):
 * - streak          → current streak (UserGamification.streak) for student+domain
 * - score           → accuracy % over the student's last 7 days of attempts in the
 *                     domain (skipped when there are no attempts — no signal ≠ 0%)
 * - session_missed  → consecutive days without a completed session in the domain
 *                     (days since last endedAt, capped at 30; 30 when never studied)
 *
 * A breached threshold notifies the instructor (in-app row + real-time delivery on
 * the instructor's OWN ordered channels), and with action=notify_watcher also the
 * child's PARENT guardians. Dedup: fires at most once per calendar day per threshold.
 */

import { prisma } from "@/lib/prisma";
import { resolveUserAlertChannels, userInQuietHours } from "./parent-monitor";
import { webPushToUser, telegramAlertToUser } from "@/lib/notifications/service";
import { sendAppEmail } from "@/lib/email";

const METRIC_RO: Record<string, string> = {
  streak: "seria",
  score: "scorul",
  session_missed: "zilele fără sesiune",
};
const OP_RO: Record<string, string> = { lt: "sub", gt: "peste", eq: "exact" };

/**
 * Same calendar day in Romania (Europe/Bucharest) — the audience's day, NOT UTC.
 * UTC would roll over at 02:00/03:00 RO (inside default quiet hours), letting a
 * persistent breach re-fire in the middle of the night and even twice per RO day.
 */
function sameRoDay(a: Date, b: Date): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" });
  return fmt.format(a) === fmt.format(b);
}

function compare(value: number, operator: string, target: number): boolean {
  if (operator === "lt") return value < target;
  if (operator === "gt") return value > target;
  return value === target;
}

/** Current metric value for a student in a domain, or null when there's no signal. */
async function computeMetric(
  metric: string,
  studentId: string,
  domainId: string,
  now: Date
): Promise<number | null> {
  if (metric === "streak") {
    const g = await prisma.userGamification.findUnique({
      where: { userId_domainId: { userId: studentId, domainId } },
      select: { streak: true },
    });
    return g?.streak ?? 0;
  }
  if (metric === "score") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: studentId,
        createdAt: { gte: weekAgo },
        session: { domainId },
      },
      select: { isCorrect: true },
    });
    if (attempts.length === 0) return null; // no recent activity = no score signal
    const correct = attempts.filter((a) => a.isCorrect).length;
    return Math.round((correct / attempts.length) * 100);
  }
  if (metric === "session_missed") {
    const last = await prisma.session.findFirst({
      where: { userId: studentId, domainId, endedAt: { not: null } },
      orderBy: { endedAt: "desc" },
      select: { endedAt: true },
    });
    if (!last?.endedAt) return 30; // never completed a session
    const days = Math.floor((now.getTime() - last.endedAt.getTime()) / (24 * 60 * 60 * 1000));
    return Math.min(days, 30);
  }
  return null;
}

/**
 * In-app row + real-time delivery on the user's preferred channel (with fallback).
 * `dest` points the recipient at a page THEY can open (instructor → roster,
 * parent → watcher view) with a matching button label.
 */
async function deliverThresholdAlert(
  userId: string,
  title: string,
  message: string,
  metadata: Record<string, unknown>,
  dest: { url: string; label: string }
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type: "threshold_alert", title, message, metadata },
    });
    if (await userInQuietHours(userId)) return;
    for (const channel of await resolveUserAlertChannels(userId)) {
      let ok = false;
      if (channel === "PUSH") {
        ok = (await webPushToUser(userId, { title, body: message, url: dest.url })) > 0;
      } else if (channel === "TELEGRAM") {
        ok = await telegramAlertToUser(userId, {
          text: `${title}\n${message}`,
          url: dest.url,
          buttonLabel: dest.label,
        });
      } else if (channel === "EMAIL") {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          const base = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
          // Propagate provider failure so the cascade can try the next channel.
          ok = await sendAppEmail({
            to: user.email,
            subject: title,
            html: `<p>${message}</p><p><a href="${base}${dest.url}">${dest.label}</a></p>`,
          });
        }
      }
      // WHATSAPP is intentionally not sent for threshold alerts (single informative
      // alert/day — the free channels cover it; keeps the metered path off this cron).
      if (ok) return;
    }
  } catch (e) {
    console.error("deliverThresholdAlert error:", e);
  }
}

/**
 * Evaluate all active instructor thresholds. Returns how many alerts fired.
 * Called from the escalation cron.
 */
export async function runThresholdChecks(now: Date = new Date()): Promise<number> {
  const thresholds = await prisma.escalationThreshold.findMany({
    where: { isActive: true },
    include: {
      student: { select: { name: true, email: true } },
      domain: { select: { name: true } },
    },
  });

  let fired = 0;
  for (const th of thresholds) {
    if (th.lastFiredOn && sameRoDay(th.lastFiredOn, now)) continue; // once per RO day
    // During the instructor's quiet hours skip the whole threshold WITHOUT
    // consuming lastFiredOn — it re-evaluates (and actually delivers) at the
    // first tick after the quiet window instead of burning the day's alert at 2AM.
    if (await userInQuietHours(th.instructorId)) continue;
    const value = await computeMetric(th.metric, th.studentId, th.domainId, now);
    if (value === null) continue; // no signal
    if (!compare(value, th.operator, th.value)) continue;

    const studentName = th.student.name ?? th.student.email ?? "Elevul";
    const title = `Prag atins: ${studentName}`;
    const message = `${studentName} (${th.domain.name}): ${METRIC_RO[th.metric] ?? th.metric} = ${value}, ${OP_RO[th.operator] ?? th.operator} pragul de ${th.value}.`;
    const metadata = {
      thresholdId: th.id,
      studentId: th.studentId,
      domainId: th.domainId,
      metric: th.metric,
      value,
      threshold: th.value,
    };

    await deliverThresholdAlert(th.instructorId, title, message, metadata, {
      url: "/dashboard/instructor/students",
      label: "Vezi elevii",
    });
    if (th.action === "notify_watcher") {
      const parents = await prisma.guardian.findMany({
        where: { childId: th.studentId, status: "active", relation: "PARENT" },
        select: { parentId: true },
      });
      for (const p of parents) {
        // Parents can't open instructor pages — point them at their watcher view.
        await deliverThresholdAlert(p.parentId, title, message, metadata, {
          url: "/dashboard/watcher",
          label: "Vezi copilul",
        });
      }
    }
    await prisma.escalationThreshold.update({
      where: { id: th.id },
      data: { lastFiredOn: now },
    });
    fired++;
  }
  return fired;
}
