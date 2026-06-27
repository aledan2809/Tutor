/**
 * Parent monitoring for the family plan.
 *
 * When a child ignores their whole cascade, open a ParentEscalation: notify the
 * parent (in-app), re-notify every 30 min until they react, let them authorize
 * an extra full cascade (incl. WhatsApp), and tell them the outcome — the child
 * engaged (positive, with the channel that reached them) or lapsed again
 * (negative). The decision bits are pure; the orchestration hits the DB and runs
 * from the cron.
 */

import { prisma } from "@/lib/prisma";
import { startEscalation } from "./engine";
import { userIdsOnBreak } from "./breaks";
import { scheduledTodayFilter } from "./scheduled-days";
import { isQuietHours } from "./timing";
import { webPushToUser, telegramAlertToUser } from "@/lib/notifications/service";
import { sendAppEmail } from "@/lib/email";

const PARENT_ALERT_URL = "/dashboard/watcher/notifications";

/**
 * Deliver a parent alert to the parent's real channels in real time (push +
 * Telegram + email), on top of the in-app feed row. Respects the parent's
 * enabled channels + quiet hours ("orele agreate, canalele agreate"). Best-effort
 * — never throws (alert delivery must not break the monitoring sweep).
 */
async function deliverParentAlert(parentId: string, title: string, message: string): Promise<void> {
  try {
    const [parent, prefs] = await Promise.all([
      prisma.user.findUnique({ where: { id: parentId }, select: { email: true } }),
      prisma.notificationPreference.findUnique({ where: { userId: parentId } }),
    ]);
    const tz = prefs?.timezone ?? "Europe/Bucharest";
    if (isQuietHours(tz, prefs?.quietHoursStart ?? "22:00", prefs?.quietHoursEnd ?? "07:00")) return;

    const base = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
    const tasks: Promise<unknown>[] = [];
    if (prefs?.push ?? true) tasks.push(webPushToUser(parentId, { title, body: message, url: PARENT_ALERT_URL }));
    // Telegram has no per-channel pref toggle; deliver if the parent linked it.
    tasks.push(
      telegramAlertToUser(parentId, { text: `${title}\n${message}`, url: PARENT_ALERT_URL, buttonLabel: "Vezi alertele" })
    );
    if ((prefs?.email ?? true) && parent?.email) {
      tasks.push(
        sendAppEmail({
          to: parent.email,
          subject: title,
          html: `<p>${message}</p><p><a href="${base}${PARENT_ALERT_URL}">Vezi alertele</a></p>`,
        })
      );
    }
    await Promise.allSettled(tasks);
  } catch (e) {
    console.error("deliverParentAlert error:", e);
  }
}

export const RENOTIFY_MIN = 30; // re-nag the parent at this interval
export const STALL_MIN = 45; // child chain considered lapsed after last touch
export const AUTH_EXHAUST_MIN = 60; // authorized cascade considered lapsed after this
const LOOKBACK_HOURS = 12;

/** Pure: is it time to re-notify the parent again? */
export function shouldRenotifyParent(
  lastNotifiedAt: Date | null,
  now: Date,
  intervalMin = RENOTIFY_MIN
): boolean {
  if (!lastNotifiedAt) return true;
  return now.getTime() - lastNotifiedAt.getTime() >= intervalMin * 60_000;
}

/** Create one in-app alert per active guardian of the child. */
async function notifyGuardians(
  childId: string,
  childName: string | null,
  alert: { alertType: string; title: string; message: string; channel?: string | null }
): Promise<number> {
  const links = await prisma.guardian.findMany({
    where: { childId, status: "active" },
    select: { parentId: true },
  });
  for (const l of links) {
    await prisma.notification.create({
      data: {
        userId: l.parentId,
        type: "parent_alert",
        title: alert.title,
        message: alert.message,
        metadata: {
          childId,
          childName,
          alertType: alert.alertType,
          channel: alert.channel ?? null,
        },
      },
    });
    // Real-time delivery to the parent's devices (not just the in-app feed).
    await deliverParentAlert(l.parentId, alert.title, alert.message);
  }
  return links.length;
}

/** Whether the child engaged since `since`, and via which channel (attribution). */
async function childReactionSince(
  childId: string,
  since: Date
): Promise<{ reacted: boolean; channel: string | null }> {
  const acked = await prisma.escalationEvent.findFirst({
    where: { userId: childId, acknowledgedAt: { not: null, gte: since } },
    orderBy: { acknowledgedAt: "desc" },
    select: { channel: true },
  });
  if (acked) return { reacted: true, channel: acked.channel };

  // Count a session that STARTED or FINISHED since `since` — a late/resumed
  // session has an old startedAt but completing it now still means the child engaged.
  const session = await prisma.session.findFirst({
    where: {
      userId: childId,
      OR: [{ startedAt: { gte: since } }, { endedAt: { gte: since } }],
    },
    select: { id: true },
  });
  if (session) {
    const lastSent = await prisma.escalationEvent.findFirst({
      where: { userId: childId, sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      select: { channel: true },
    });
    return { reacted: true, channel: lastSent?.channel ?? "PUSH" };
  }
  return { reacted: false, channel: null };
}

const CHANNEL_RO: Record<string, string> = {
  PUSH: "aplicație",
  TELEGRAM: "Telegram",
  EMAIL: "email",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  CALL: "apel",
};
const chName = (c: string | null) => (c ? CHANNEL_RO[c] ?? c : "aplicație");

/**
 * Drive the whole parent-monitoring lifecycle. Called from the cron.
 * Returns counts for observability.
 */
export async function runParentMonitoring(now: Date = new Date()): Promise<{
  opened: number;
  renotified: number;
  resolvedPositive: number;
  resolvedNegative: number;
}> {
  let opened = 0;
  let renotified = 0;
  let resolvedPositive = 0;
  let resolvedNegative = 0;

  // Vacanță: copiii în vacanță sunt excluși complet — niciun fel de alertă către părinte.
  const onBreak = await userIdsOnBreak(now);

  const open = await prisma.parentEscalation.findMany({
    where: { status: { in: ["awaiting_parent", "authorized"] } },
    include: { child: { select: { name: true } } },
  });

  // 1) Resolve episodes where the child has since engaged → positive.
  for (const esc of open) {
    if (onBreak.has(esc.childId)) continue;
    const { reacted, channel } = await childReactionSince(esc.childId, esc.openedFor);
    if (reacted) {
      await prisma.parentEscalation.update({
        where: { id: esc.id },
        data: { status: "resolved_positive", childChannel: channel, resolvedAt: now },
      });
      await notifyGuardians(esc.childId, esc.child.name, {
        alertType: "reacted_positive",
        title: "A reacționat ✅",
        message: `${esc.child.name ?? "Copilul"} a reacționat (via ${chName(channel)}).`,
        channel,
      });
      resolvedPositive++;
    }
  }

  // 2) Authorized episodes that lapsed again (no reaction past the window) → negative.
  for (const esc of open) {
    if (onBreak.has(esc.childId)) continue;
    if (esc.status !== "authorized" || !esc.authorizedAt) continue;
    if (now.getTime() - esc.authorizedAt.getTime() < AUTH_EXHAUST_MIN * 60_000) continue;
    const { reacted } = await childReactionSince(esc.childId, esc.authorizedAt);
    if (reacted) continue; // handled by step 1 next tick
    await prisma.parentEscalation.update({
      where: { id: esc.id },
      data: { status: "resolved_negative", resolvedAt: now },
    });
    await notifyGuardians(esc.childId, esc.child.name, {
      alertType: "reacted_negative",
      title: "Nu a reacționat ❌",
      message: `${esc.child.name ?? "Copilul"} nu a reacționat nici după mementoul suplimentar.`,
    });
    resolvedNegative++;
  }

  // 3) Open episodes for children whose cascade lapsed with no reaction.
  const since = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const recent = await prisma.escalationEvent.findMany({
    where: { createdAt: { gte: since }, isTest: false },
    orderBy: { createdAt: "asc" },
    select: { userId: true, status: true, sentAt: true, createdAt: true },
  });
  const byChild = new Map<string, { start: Date; lastTouch: Date; active: boolean }>();
  for (const e of recent) {
    const cur = byChild.get(e.userId) ?? { start: e.createdAt, lastTouch: e.createdAt, active: false };
    if (e.createdAt < cur.start) cur.start = e.createdAt;
    // Stall is measured from the last time we actually REACHED the child (a sent
    // event), so skipped/undeliverable rungs created later don't reset the clock.
    if (e.sentAt && e.sentAt.getTime() > cur.lastTouch.getTime()) cur.lastTouch = e.sentAt;
    if (e.status === "PENDING" || e.status === "ESCALATING") cur.active = true;
    byChild.set(e.userId, cur);
  }
  // Zile fără program (weekend / nimic programat): nu deschidem alertă nouă către părinte.
  const scheduledChildren = await scheduledTodayFilter([...byChild.keys()], now);
  for (const [childId, chain] of byChild) {
    if (onBreak.has(childId)) continue; // vacanță
    if (!scheduledChildren.has(childId)) continue; // zi fără program: fără alertă nouă
    if (chain.active) continue; // chain still running
    const guardians = await prisma.guardian.findMany({
      where: { childId, status: "active" },
      select: { parentId: true },
    });
    if (guardians.length === 0) continue;

    const reaction = await childReactionSince(childId, chain.start);
    if (reaction.reacted) {
      // Prompt reaction (no no-reaction episode) → tell the parent which channel
      // worked, once per episode. Dedup via an existing alert for this child.
      const alreadyReported = await prisma.notification.findFirst({
        where: {
          type: "parent_alert",
          createdAt: { gte: chain.start },
          metadata: { path: ["childId"], equals: childId },
        },
        select: { id: true },
      });
      if (!alreadyReported) {
        const c = await prisma.user.findUnique({ where: { id: childId }, select: { name: true } });
        await notifyGuardians(childId, c?.name ?? null, {
          alertType: "reacted_positive",
          title: "A reacționat ✅",
          message: `${c?.name ?? "Copilul"} a reacționat (via ${chName(reaction.channel)}).`,
          channel: reaction.channel,
        });
      }
      continue;
    }

    // No reaction → open a no-reaction episode, but only after a stall grace.
    if (now.getTime() - chain.lastTouch.getTime() < STALL_MIN * 60_000) continue;
    const existing = await prisma.parentEscalation.findFirst({
      where: { childId, openedFor: { gte: chain.start } },
    });
    if (existing) continue; // already tracked this episode
    const child = await prisma.user.findUnique({ where: { id: childId }, select: { name: true } });
    for (const g of guardians) {
      await prisma.parentEscalation.create({
        data: {
          parentId: g.parentId,
          childId,
          status: "awaiting_parent",
          openedFor: chain.start,
          lastParentNotifiedAt: now,
        },
      });
    }
    await notifyGuardians(childId, child?.name ?? null, {
      alertType: "no_reaction",
      title: "Nu a reacționat la memento",
      message: `${child?.name ?? "Copilul"} nu a reacționat la niciun canal. Poți autoriza un memento suplimentar.`,
    });
    opened++;
  }

  // 4) Re-notify parents still awaiting, every RENOTIFY_MIN.
  const awaiting = await prisma.parentEscalation.findMany({
    where: { status: "awaiting_parent" },
    include: { child: { select: { name: true } } },
  });
  const scheduledAwaiting = await scheduledTodayFilter(
    awaiting.map((e) => e.childId),
    now
  );
  for (const esc of awaiting) {
    if (onBreak.has(esc.childId)) continue; // vacanță
    if (!scheduledAwaiting.has(esc.childId)) continue; // zi fără program: nu re-notificăm
    if (!shouldRenotifyParent(esc.lastParentNotifiedAt, now)) continue;
    await notifyGuardians(esc.childId, esc.child.name, {
      alertType: "no_reaction_reminder",
      title: "Încă nu a reacționat",
      message: `${esc.child.name ?? "Copilul"} încă nu a reacționat. Autorizează un memento suplimentar?`,
    });
    await prisma.parentEscalation.update({
      where: { id: esc.id },
      data: { lastParentNotifiedAt: now },
    });
    renotified++;
  }

  return { opened, renotified, resolvedPositive, resolvedNegative };
}

/**
 * Parent authorizes an extra (full, incl. WhatsApp) cascade for their child.
 * Marks the episode authorized and starts a fresh chain flagged
 * `parentAuthorized` so the WhatsApp Premium gate is bypassed.
 */
export async function authorizeExtraMemento(
  parentId: string,
  childId: string
): Promise<{ ok: boolean }> {
  const esc = await prisma.parentEscalation.findFirst({
    where: { parentId, childId, status: "awaiting_parent" },
    orderBy: { createdAt: "desc" },
  });
  if (!esc) return { ok: false };

  await prisma.parentEscalation.update({
    where: { id: esc.id },
    data: { status: "authorized", authorizedAt: new Date() },
  });

  await startEscalation({
    userId: childId,
    reason: "parent_authorized",
    metadata: {
      parentAuthorized: true,
      url: "/dashboard/practice",
      title: "Un memento de la părinte",
      message: "Hai să facem un quiz scurt acum.",
    },
  });

  return { ok: true };
}
