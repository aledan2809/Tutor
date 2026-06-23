/**
 * Parent on-demand nudge. A parent sends the child a personalized message that
 * the child reacts to, optionally repeated every N minutes until the child
 * engages. Free channels only (in-app + Telegram), no paid cascade. Stops on
 * the child's reaction, parent stop, or a safety cap.
 */
import { prisma } from "@/lib/prisma";
import type { EscalationChannel } from "@prisma/client";
import { sendNotification } from "@/lib/notifications/service";
import { userIdsOnBreak } from "./breaks";
import { reminderImminent } from "./reminders";

const MAX_FIRES = 12; // safety cap on repeats
const MAX_AGE_HOURS = 24; // auto-stop a nudge after a day
const OVERLAP_GUARD_MIN = 25; // stop a series when a scheduled session is this close

async function childReactedSince(childId: string, since: Date): Promise<boolean> {
  const acked = await prisma.escalationEvent.count({
    where: { userId: childId, acknowledgedAt: { gte: since } },
  });
  if (acked > 0) return true;
  // A reaction to the nudge = a session the child STARTED after it (not one that
  // was already running and merely ends later — that isn't "reacting to my nudge").
  const sessions = await prisma.session.count({
    where: { userId: childId, startedAt: { gte: since } },
  });
  return sessions > 0;
}

async function notifyParentReacted(parentId: string, childId: string): Promise<void> {
  const child = await prisma.user.findUnique({ where: { id: childId }, select: { name: true } });
  await prisma.notification.create({
    data: {
      userId: parentId,
      type: "parent_alert",
      title: "A reacționat la mementoul tău ✅",
      message: `${child?.name ?? "Copilul"} a reacționat la mementoul trimis de tine.`,
      metadata: { childId, childName: child?.name ?? null, alertType: "nudge_reacted" },
    },
  });
}

/** Deliver one nudge over the chosen channels (default: in-app push + Telegram). */
export async function fireNudge(
  childId: string,
  message: string,
  channels: string[] = ["PUSH", "TELEGRAM"]
): Promise<void> {
  const metadata = {
    title: "Memento de la părinte",
    message,
    url: "/dashboard/practice",
    templateId: "parent_nudge",
  };
  for (const ch of channels) {
    // Per-channel best-effort: one channel failing (e.g. no WhatsApp phone /
    // Telegram not linked) must not block the others.
    try {
      await sendNotification({
        userId: childId,
        channel: ch as EscalationChannel,
        templateId: "parent_nudge",
        metadata,
      });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Cron sweep: fire due repeating nudges, stop the ones whose child reacted or
 * which hit the safety cap. Children on a break are paused (not stopped).
 */
export async function runParentNudges(now: Date = new Date()): Promise<{ fired: number; stopped: number }> {
  let fired = 0;
  let stopped = 0;
  const active = await prisma.parentNudge.findMany({ where: { active: true } });
  if (active.length === 0) return { fired, stopped };

  const onBreak = await userIdsOnBreak(now);

  for (const n of active) {
    // Per-row isolation: a transient error on one nudge must not abort the sweep
    // (this runs alongside the other escalation sweeps in the shared cron route).
    try {
      // Safety cap: too many fires or too old → stop. Also the parent-set end
      // time of the series ("până la 18:00" / "peste 4h").
      if (
        n.fireCount >= MAX_FIRES ||
        now.getTime() - n.createdAt.getTime() > MAX_AGE_HOURS * 3_600_000 ||
        (n.untilAt != null && now.getTime() >= n.untilAt.getTime())
      ) {
        await prisma.parentNudge.update({ where: { id: n.id }, data: { active: false } });
        stopped++;
        continue;
      }
      // Child reacted since the nudge started → stop + tell the parent.
      if (await childReactedSince(n.childId, n.createdAt)) {
        await prisma.parentNudge.update({ where: { id: n.id }, data: { active: false } });
        await notifyParentReacted(n.parentId, n.childId);
        stopped++;
        continue;
      }
      if (onBreak.has(n.childId)) continue; // vacanță: pauză, fără a opri

      // No-overlap: stop the series when the child's next scheduled session is
      // imminent — don't nudge on top of a programmed reminder.
      if (await reminderImminent(n.childId, now, OVERLAP_GUARD_MIN)) {
        await prisma.parentNudge.update({ where: { id: n.id }, data: { active: false } });
        stopped++;
        continue;
      }

      const due =
        !n.lastFiredAt ||
        (n.intervalMin != null && now.getTime() - n.lastFiredAt.getTime() >= n.intervalMin * 60_000);
      if (!due) continue;

      await fireNudge(n.childId, n.message, n.channels);
      const oneShot = n.intervalMin == null;
      await prisma.parentNudge.update({
        where: { id: n.id },
        data: { lastFiredAt: now, fireCount: { increment: 1 }, active: !oneShot },
      });
      fired++;
    } catch (err) {
      console.error(`[parent-nudge] row ${n.id} failed:`, (err as Error).message);
    }
  }

  return { fired, stopped };
}
