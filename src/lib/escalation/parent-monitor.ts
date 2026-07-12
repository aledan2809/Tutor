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
import { resolveLadder } from "./config";
import { isPaidStatus } from "@/lib/plan-channels";
import { webPushToUser, telegramAlertToUser } from "@/lib/notifications/service";
import { sendAppEmail } from "@/lib/email";

const PARENT_ALERT_URL = "/dashboard/watcher/notifications";

/**
 * The alert channels this user can actually receive right now, in THEIR saved
 * priority order (NotificationPreference.channelOrder, default order otherwise).
 * A channel is kept only when it's enabled AND deliverable: PUSH needs the pref on,
 * TELEGRAM needs a linked chat, EMAIL needs the pref + an address, WHATSAPP needs
 * the pref + a phone + env config + a paid plan (metered). PUSH is the final
 * fallback so the list is never empty.
 */
export async function resolveUserAlertChannels(userId: string): Promise<string[]> {
  const [user, prefs, phoneSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, telegramChatId: true, subscriptionStatus: true },
    }),
    prisma.notificationPreference.findUnique({ where: { userId } }),
    prisma.setting.findUnique({ where: { userId_key: { userId, key: "phone" } } }),
  ]);
  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  );
  const out: string[] = [];
  for (const rung of resolveLadder(prefs?.channelOrder)) {
    switch (rung.channel) {
      case "PUSH":
        if (prefs?.push ?? true) out.push("PUSH");
        break;
      case "TELEGRAM":
        // Telegram has no per-channel pref toggle; deliver if the user linked it.
        if (user?.telegramChatId) out.push("TELEGRAM");
        break;
      case "EMAIL":
        if ((prefs?.email ?? true) && user?.email) out.push("EMAIL");
        break;
      case "WHATSAPP":
        if (
          (prefs?.whatsapp ?? true) &&
          typeof phoneSetting?.value === "string" &&
          phoneSetting.value &&
          whatsappConfigured &&
          isPaidStatus(user?.subscriptionStatus)
        ) {
          out.push("WHATSAPP");
        }
        break;
    }
  }
  if (out.length === 0) out.push("PUSH"); // never leave the user unreachable
  return out;
}

/** Send one alert on one concrete channel. Returns whether the send succeeded. */
async function sendAlertOnChannel(
  userId: string,
  channel: string,
  title: string,
  message: string
): Promise<boolean> {
  const base = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
  switch (channel) {
    case "PUSH":
      // webPushToUser returns the delivered-subscription count.
      return (await webPushToUser(userId, { title, body: message, url: PARENT_ALERT_URL })) > 0;
    case "TELEGRAM":
      return await telegramAlertToUser(userId, {
        text: `${title}\n${message}`,
        url: PARENT_ALERT_URL,
        buttonLabel: "Vezi alertele",
      });
    case "EMAIL": {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (!user?.email) return false;
      // sendAppEmail reports provider failure — propagate it so the cascade can
      // fall through to the next channel instead of silently "succeeding".
      return await sendAppEmail({
        to: user.email,
        subject: title,
        html: `<p>${message}</p><p><a href="${base}${PARENT_ALERT_URL}">Vezi alertele</a></p>`,
      });
    }
    case "WHATSAPP": {
      // Free-text WhatsApp only delivers inside Meta's 24h service window (the
      // parent recently wrote to the business). Outside it, sendText fails and we
      // fall through to the parent's next channel — the alert is never lost. A
      // dedicated Meta-approved parent-alert template would make this rung reliable
      // (template approval = owner action, ~24-48h at Meta).
      const phoneSetting = await prisma.setting.findUnique({
        where: { userId_key: { userId, key: "phone" } },
      });
      const phone = typeof phoneSetting?.value === "string" ? phoneSetting.value : undefined;
      if (!phone) return false;
      try {
        const { WhatsAppClient, normalizePhone } = await import("@aledan/whatsapp");
        const client = new WhatsAppClient({
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        });
        const res = await client.sendText(normalizePhone(phone), `${title}\n${message}`);
        return res.success;
      } catch (e) {
        console.error("parent-alert WhatsApp send error:", e);
        return false;
      }
    }
    default:
      return false;
  }
}

/** Is this user inside their quiet hours right now? (default 22:00–07:00) */
export async function userInQuietHours(userId: string): Promise<boolean> {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  const tz = prefs?.timezone ?? "Europe/Bucharest";
  return isQuietHours(tz, prefs?.quietHoursStart ?? "22:00", prefs?.quietHoursEnd ?? "07:00");
}

/**
 * Deliver an alert to ONE user on the rung-th channel of their own ordered cascade
 * (rung 0 = most preferred; past the end stays on the last). If that channel's send
 * fails, tries the remaining channels — wrapping around to the start — so every
 * channel gets one attempt and the alert is never silently lost. Respects quiet
 * hours. Best-effort — never throws (alert delivery must not break the monitoring
 * sweep).
 */
async function deliverParentAlert(
  parentId: string,
  title: string,
  message: string,
  rung = 0
): Promise<void> {
  try {
    if (await userInQuietHours(parentId)) return;

    const channels = await resolveUserAlertChannels(parentId);
    const start = Math.min(rung, channels.length - 1);
    for (let k = 0; k < channels.length; k++) {
      const i = (start + k) % channels.length;
      if (await sendAlertOnChannel(parentId, channels[i], title, message)) return;
    }
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

// The parent's own re-alert cadence (only the RE-notify; the first alert always
// fires immediately when the episode opens). Set from /watcher/setari (decizia 03),
// parent-only (decizia 02).
export type SelfAlertConfig = { mode: string; everyH: number; at: string };

/** Local wall-clock minutes (H*60+M) of `d` in `tz`. */
function localMinutes(d: Date, tz: string): number {
  const s = d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}
/** Local calendar date (YYYY-MM-DD) of `d` in `tz`. */
function localDate(d: Date, tz: string): string {
  return d.toLocaleDateString("en-CA", { timeZone: tz });
}

/**
 * Pure: is it time to re-notify the parent again, per their chosen cadence?
 * STANDARD_30 → every RENOTIFY_MIN (default); EVERY_H → every `everyH` hours;
 * FIXED_AT → at most once a day at `at` (parent's local time); ONCE → never
 * (only the first alert). Unknown mode falls back to STANDARD_30.
 */
export function shouldRenotifyParentMode(
  config: SelfAlertConfig,
  lastNotifiedAt: Date | null,
  now: Date,
  tz = "Europe/Bucharest"
): boolean {
  switch (config.mode) {
    case "ONCE":
      return false;
    case "EVERY_H": {
      const h = Number.isFinite(config.everyH) && config.everyH > 0 ? config.everyH : 6;
      return shouldRenotifyParent(lastNotifiedAt, now, h * 60);
    }
    case "FIXED_AT": {
      const [ah, am] = String(config.at ?? "20:00").split(":").map(Number);
      const atMin = (Number.isFinite(ah) ? ah : 20) * 60 + (Number.isFinite(am) ? am : 0);
      if (localMinutes(now, tz) < atMin) return false; // today's slot not reached yet
      if (!lastNotifiedAt) return true;
      // Fire once per day: skip if we already alerted today at/after the slot.
      const firedTodaysSlot =
        localDate(lastNotifiedAt, tz) === localDate(now, tz) &&
        localMinutes(lastNotifiedAt, tz) >= atMin;
      return !firedTodaysSlot;
    }
    case "STANDARD_30":
    default:
      return shouldRenotifyParent(lastNotifiedAt, now);
  }
}

/** One in-app alert row + real-time delivery to ONE guardian (rung = their own cascade step). */
async function notifyParent(
  parentId: string,
  childId: string,
  childName: string | null,
  alert: { alertType: string; title: string; message: string; channel?: string | null },
  rung = 0
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: parentId,
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
  await deliverParentAlert(parentId, alert.title, alert.message, rung);
}

/**
 * Create one in-app alert per active guardian of the child. The no-reaction
 * ESCALATION episodes go to PARENT-relation guardians only (the meditator stays on
 * threshold alerts — decizia 02); informational updates go to all guardians.
 */
async function notifyGuardians(
  childId: string,
  childName: string | null,
  alert: { alertType: string; title: string; message: string; channel?: string | null },
  opts?: { relation?: "PARENT" }
): Promise<number> {
  const links = await prisma.guardian.findMany({
    where: { childId, status: "active", ...(opts?.relation ? { relation: opts.relation } : {}) },
    select: { parentId: true },
  });
  for (const l of links) {
    await notifyParent(l.parentId, childId, childName, alert);
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
      // Episode lifecycle stays PARENT-only (the TUTOR never saw its opening).
      await notifyGuardians(
        esc.childId,
        esc.child.name,
        {
          alertType: "reacted_positive",
          title: "A reacționat ✅",
          message: `${esc.child.name ?? "Copilul"} a reacționat (via ${chName(channel)}).`,
          channel,
        },
        { relation: "PARENT" }
      );
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
    await notifyGuardians(
      esc.childId,
      esc.child.name,
      {
        alertType: "reacted_negative",
        title: "Nu a reacționat ❌",
        message: `${esc.child.name ?? "Copilul"} nu a reacționat nici după mementoul suplimentar.`,
      },
      { relation: "PARENT" }
    );
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
    // Episodes (and the authorize-extra-memento flow) belong to PARENT-relation
    // guardians only; a TUTOR-relation guardian stays on threshold alerts.
    const guardians = await prisma.guardian.findMany({
      where: { childId, status: "active", relation: "PARENT" },
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
        await notifyGuardians(
          childId,
          c?.name ?? null,
          {
            alertType: "reacted_positive",
            title: "A reacționat ✅",
            message: `${c?.name ?? "Copilul"} a reacționat (via ${chName(reaction.channel)}).`,
            channel: reaction.channel,
          },
          { relation: "PARENT" }
        );
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
          // First alert (below) goes out on rung 0 = the parent's preferred
          // channel; the next re-notify starts one rung down.
          parentAlertRung: 1,
          lastParentNotifiedAt: now,
        },
      });
    }
    await notifyGuardians(
      childId,
      child?.name ?? null,
      {
        alertType: "no_reaction",
        title: "Nu a reacționat la memento",
        message: `${child?.name ?? "Copilul"} nu a reacționat la niciun canal. Poți autoriza un memento suplimentar.`,
      },
      { relation: "PARENT" }
    );
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
    // Cadence is the parent's own choice (decizia 03): every 30 min / every N hours /
    // once a day at a fixed local time / a single alert. One prefs fetch covers both
    // the cadence and the quiet-hours check below.
    const pp = await prisma.notificationPreference.findUnique({ where: { userId: esc.parentId } });
    const tz = pp?.timezone ?? "Europe/Bucharest";
    const cadence: SelfAlertConfig = {
      mode: pp?.selfAlertMode ?? "STANDARD_30",
      everyH: pp?.selfAlertEveryH ?? 6,
      at: pp?.selfAlertAt ?? "20:00",
    };
    if (!shouldRenotifyParentMode(cadence, esc.lastParentNotifiedAt, now, tz)) continue;
    // Quiet hours: skip the whole tick — no in-app row, no rung/timestamp consumed —
    // so the parent's cascade resumes exactly where it left off in the morning
    // (instead of burning ~18 silent rungs overnight).
    if (isQuietHours(tz, pp?.quietHoursStart ?? "22:00", pp?.quietHoursEnd ?? "07:00", now)) continue;
    // Re-notify ONLY this episode's parent (not every guardian of the child), one
    // rung further down THEIR own channel cascade each time.
    await notifyParent(
      esc.parentId,
      esc.childId,
      esc.child.name,
      {
        alertType: "no_reaction_reminder",
        title: "Încă nu a reacționat",
        message: `${esc.child.name ?? "Copilul"} încă nu a reacționat. Autorizează un memento suplimentar?`,
      },
      esc.parentAlertRung
    );
    await prisma.parentEscalation.update({
      where: { id: esc.id },
      data: { lastParentNotifiedAt: now, parentAlertRung: esc.parentAlertRung + 1 },
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
