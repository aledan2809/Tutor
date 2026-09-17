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
import { NUDGE_MAX_FIRES, NUDGE_MAX_AGE_HOURS } from "./config";
import { isPaidSubscriber } from "./segmentation";
import { loadAccess } from "@/lib/access-server";
import { individualPlan, secondParentSeat } from "@/lib/access";

const MAX_FIRES = NUDGE_MAX_FIRES; // safety cap on repeats
const MAX_AGE_HOURS = NUDGE_MAX_AGE_HOURS; // auto-stop a nudge after a day
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
      title: "A reacționat la reminderul tău ✅",
      message: `${child?.name ?? "Copilul"} a reacționat la reminderul trimis de tine.`,
      metadata: { childId, childName: child?.name ?? null, alertType: "nudge_reacted" },
    },
  });
}

/**
 * May this parent's reminders use the channels paid per message (WhatsApp, SMS)? Only when the
 * parent pays (or is marked „Gratuit permanent"). A parent on the 7-day trial without a card gets
 * the free channels only (Alex, 16.09.2026) — before this, any parent's reminder skipped the gate.
 */
export async function parentPaysForMetered(parentId: string, childId?: string): Promise<boolean> {
  const p = await prisma.user.findUnique({ where: { id: parentId }, select: PAYER_SELECT });
  // An Elev plan pays for the parent's own account, not for a child's messages (access.ts).
  if (p && (p.isSuperAdmin || p.freeForever || (isPaidSubscriber(p) && !individualPlan(p.subscriptionPlan)))) return true;
  return coveredAsSecondParent(parentId, childId);
}

const PAYER_SELECT = {
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  freeForever: true,
  isSuperAdmin: true,
  subscriptionPlan: { select: { name: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true } },
} as const;

/**
 * The second parent of Family Duo / Family Trio: the plan sits on the other parent's account. It
 * lends the paid channels only when it has a seat for a second parent (access.ts), and only while it
 * is paid — not while a renewal is failing (WhatsApp and SMS cost per message). `childId` narrows it
 * to the other parents of that child.
 */
export async function coveredAsSecondParent(parentId: string, childId?: string): Promise<boolean> {
  const others = await prisma.guardian.findMany({
    where: {
      relation: "PARENT",
      status: "active",
      parentId: { not: parentId },
      ...(childId ? { childId } : {}),
      child: { guardianLinks: { some: { parentId, relation: "PARENT", status: "active" } } },
    },
    select: { parent: { select: PAYER_SELECT } },
  });
  return others.some(
    ({ parent: o }) =>
      o.isSuperAdmin ||
      o.freeForever ||
      (isPaidSubscriber(o) && !individualPlan(o.subscriptionPlan) && secondParentSeat(o.subscriptionPlan)),
  );
}

/** Deliver one nudge over the chosen channels (default: in-app push + Telegram). */
export async function fireNudge(
  childId: string,
  message: string,
  channels: string[] = ["PUSH", "TELEGRAM"],
  url: string = "/dashboard/practice",
  opts: { meteredAllowed?: boolean } = {}
): Promise<void> {
  const metadata = {
    title: "Reminder de la părinte",
    message,
    url: url || "/dashboard/practice",
    templateId: "parent_nudge",
    // A paying parent's nudge may use metered channels regardless of the child's plan — it
    // exempts it from the send chokepoint's plan gate (mirrors the engine's parentAuthorized
    // cascade). A parent who doesn't pay stays on the free channels.
    parentAuthorized: opts.meteredAllowed === true,
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

      // Proba gratuită s-a încheiat pentru părinte sau copil: seria se oprește (access.ts).
      const [parentAccess, childAccess] = await Promise.all([loadAccess(n.parentId, now), loadAccess(n.childId, now)]);
      if (parentAccess?.kind === "paused" || childAccess?.kind === "paused") {
        await prisma.parentNudge.update({ where: { id: n.id }, data: { active: false } });
        stopped++;
        continue;
      }

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

      await fireNudge(n.childId, n.message, n.channels, n.url ?? "/dashboard/practice", {
        meteredAllowed: await parentPaysForMetered(n.parentId, n.childId),
      });
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
