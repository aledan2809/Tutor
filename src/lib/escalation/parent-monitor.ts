/**
 * Parent monitoring for the family plan.
 *
 * When a child ignores their whole cascade, open a ParentEscalation: notify the
 * parent (in-app), re-notify at their cadence until they react, let them authorize
 * an extra full cascade (incl. WhatsApp), and tell them the outcome — the child
 * engaged (positive, with the channel that reached them) or lapsed again
 * (negative). The decision bits are pure; the orchestration hits the DB and runs
 * from the cron.
 *
 * Limits (30.09.2026: one parent got ~1,100 e-mails in a week, and the shared sending account hit
 * its daily cap for every app): a chain is known by its first rung, as the engine knows it, so a lapse
 * already reported never looks new again; one open episode per child at a time — a new lapse replaces
 * a waiting one (status `superseded`) instead of being hidden; at most
 * MAX_PARENT_RENOTIFY re-notifications per episode; an episode nobody acted on closes after
 * EPISODE_MAX_AGE_H without a word; one „reacted” notice per child, whatever number of episodes it
 * closes; at most PARENT_ALERTS_PER_DAY delivered alerts per parent per day besides the first alert of
 * an episode, and never more than PARENT_ALERTS_HARD_CAP (the in-app list keeps the rest); every
 * resolution claimed atomically, each alert sent once per key, one run at a time, within RUN_BUDGET_MS.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startEscalation } from "./engine";
import { userIdsOnBreak } from "./breaks";
import { scheduledTodayFilter } from "./scheduled-days";
import { isQuietHours } from "./timing";
import { PARENT_ALERT_STALL_MIN, PARENT_RENOTIFY_MIN } from "./config";
import { resolveLadder } from "./config";
import { meteredChannelsCovered, SELECT_ACOPERIRE_CANALE } from "./segmentation";
import { webPushToUser, telegramAlertToUser } from "@/lib/notifications/service";
import { sendAppEmail } from "@/lib/email";
import { coveredAsSecondParent, parentPaysForMetered } from "./parent-nudge";
import { pausedUserIds } from "@/lib/access-server";
import { escapeHtml } from "@/lib/sanitize";
import { withCronLease } from "@/lib/cron-lease";
import { withSendTimeout } from "@/lib/send-timeout";
import { isUndeliverableAddress } from "@/lib/email-recipients";
import { bucharestTimeToUtc, bucharestYmd } from "@/lib/bucharest-day";

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
      select: { email: true, telegramChatId: true, ...SELECT_ACOPERIRE_CANALE },
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
        if ((prefs?.email ?? true) && user?.email && !isUndeliverableAddress(user.email)) out.push("EMAIL");
        break;
      case "WHATSAPP":
        if (
          (prefs?.whatsapp ?? true) &&
          typeof phoneSetting?.value === "string" &&
          phoneSetting.value &&
          whatsappConfigured &&
          // The send gate's own answer (service.ts): a plan still paid for, „Gratuit permanent", a
          // company that pays for the channels. A lapsed „active" row doesn't count. The second
          // parent of Family Duo / Family Trio is paid for by the other parent's plan.
          user !== null &&
          (meteredChannelsCovered(user) || (await coveredAsSecondParent(userId)))
        ) {
          out.push("WHATSAPP");
        }
        break;
    }
  }
  if (out.length === 0) out.push("PUSH"); // never leave the user unreachable
  return out;
}

/** Where an alert's button leads. Parent alerts open the alert list; other messages pass their own. */
export type AlertLink = { url: string; label: string };
const ALERTS_LINK: AlertLink = { url: PARENT_ALERT_URL, label: "Vezi alertele" };

/** Text people typed (a child's name) put into an email's HTML stays text — the platform's one escape (review r6, K8). */
export { escapeHtml };

/** Send one alert on one concrete channel. Returns whether the send succeeded. */
async function sendAlertOnChannel(
  userId: string,
  channel: string,
  title: string,
  message: string,
  link: AlertLink = ALERTS_LINK,
  idempotencyKey?: string
): Promise<boolean> {
  const base = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
  switch (channel) {
    case "PUSH":
      // webPushToUser returns the delivered-subscription count.
      return (await webPushToUser(userId, { title, body: message, url: link.url })) > 0;
    case "TELEGRAM":
      return await telegramAlertToUser(userId, {
        text: `${title}\n${message}`,
        url: link.url,
        buttonLabel: link.label,
      });
    case "EMAIL": {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      // A test or reserved address only bounces (and bounces hurt every app on the sending account).
      if (!user?.email || isUndeliverableAddress(user.email)) return false;
      // sendAppEmail reports provider failure — propagate it so the cascade can
      // fall through to the next channel instead of silently "succeeding".
      // The message carries names people typed (a child's name): escaped, so it stays text.
      return await sendAppEmail({
        to: user.email,
        subject: title,
        html: `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><p><a href="${base}${link.url}">${escapeHtml(link.label)}</a></p>`,
        idempotencyKey,
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
        const res = await withSendTimeout(client.sendText(normalizePhone(phone), `${title}\n${message}`), "WhatsApp");
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
 * sweep). Answers whether some channel took it.
 */
export async function deliverParentAlert(
  parentId: string,
  title: string,
  message: string,
  rung = 0,
  link: AlertLink = ALERTS_LINK,
  idempotencyKey?: string
): Promise<boolean> {
  try {
    if (await userInQuietHours(parentId)) return false;

    const channels = await resolveUserAlertChannels(parentId);
    const start = Math.min(rung, channels.length - 1);
    for (let k = 0; k < channels.length; k++) {
      const i = (start + k) % channels.length;
      if (await sendAlertOnChannel(parentId, channels[i], title, message, link, idempotencyKey)) return true;
    }
  } catch (e) {
    console.error("deliverParentAlert error:", e);
  }
  return false;
}

export const RENOTIFY_MIN = PARENT_RENOTIFY_MIN; // re-nag the parent at this interval
export const STALL_MIN = PARENT_ALERT_STALL_MIN; // child chain considered lapsed after last touch
export const AUTH_EXHAUST_MIN = 60; // authorized cascade considered lapsed after this
const LOOKBACK_HOURS = 12;
/** Re-notifications of one episode after its first alert; then it waits quietly for the parent. */
export const MAX_PARENT_RENOTIFY = 3;
/** An episode nobody acted on closes after this many hours (a new lapse opens a new one). */
export const EPISODE_MAX_AGE_H = 24;
/** An authorized extra cascade nobody resolved closes after this many hours. */
const AUTHORIZED_MAX_AGE_H = 48;
/**
 * Alerts one parent may get on their devices in a Bucharest day, counting only those that went out;
 * the in-app list keeps the rest. The first alert of an episode goes past it (one per lapse)…
 */
export const PARENT_ALERTS_PER_DAY = 8;
/** …but nothing goes past this one: a child with many reminders can't turn it into lapses + 8. */
export const PARENT_ALERTS_HARD_CAP = 12;
const UNCAPPED_ALERTS = new Set(["no_reaction"]);
const OPEN_STATUSES = ["awaiting_parent", "authorized"];
/**
 * How far back a chain's first rung is looked for: as long as the engine keeps a chain alive
 * (CHAIN_MAX_AGE_DAYS in engine.ts) — a rung frozen over a break can lapse days after its first one.
 */
const CHAIN_LOOKBACK_DAYS = 14;
/**
 * A run stops starting new work after this long (claims make it safe to finish on the next run): a
 * run that outlives its 30-minute lease would otherwise overlap the next one, which is how the
 * hours-long runs of 30.09 sent the same notices again.
 */
const RUN_BUDGET_MS = 20 * 60_000;
/** The extra cascade a parent authorized: every rung of it carries this reason. */
const AUTHORIZED_REASON = "parent_authorized";
const isAuthorizedCascade = (metadata: Prisma.JsonValue | null) =>
  (metadata as Record<string, unknown> | null)?.reason === AUTHORIZED_REASON;

/**
 * The latest chain of each child, known by its first rung (level 1) as the engine knows it
 * (`chainFacts`): its start, the last time it reached the child, and whether a rung is still waiting.
 * The extra cascade a parent authorized is left out — it belongs to its episode (step 2).
 */
async function latestChains(
  childIds: string[],
  now: Date
): Promise<Map<string, { start: Date; lastTouch: Date; active: boolean }>> {
  const out = new Map<string, { start: Date; lastTouch: Date; active: boolean }>();
  if (childIds.length === 0) return out;
  const from = new Date(now.getTime() - CHAIN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const starts = await prisma.$queryRaw<{ userId: string; start: Date }[]>`
    SELECT "userId", MAX("createdAt") AS "start"
    FROM "EscalationEvent"
    WHERE "userId" IN (${Prisma.join(childIds)})
      AND "level" = 1 AND "isTest" = false AND "createdAt" >= ${from}
      AND ("metadata"->>'reason') IS DISTINCT FROM ${AUTHORIZED_REASON}
    GROUP BY "userId"`;
  if (starts.length === 0) return out;
  const startOf = new Map(starts.map((r) => [r.userId, r.start] as const));
  const earliest = new Date(Math.min(...starts.map((r) => r.start.getTime())));
  const events = await prisma.escalationEvent.findMany({
    where: { userId: { in: [...startOf.keys()] }, createdAt: { gte: earliest }, isTest: false },
    select: { userId: true, status: true, sentAt: true, createdAt: true, metadata: true },
  });
  for (const [userId, start] of startOf) out.set(userId, { start, lastTouch: start, active: false });
  for (const e of events) {
    const chain = out.get(e.userId);
    if (!chain || e.createdAt.getTime() < chain.start.getTime() || isAuthorizedCascade(e.metadata)) continue;
    // Stall is measured from the last time we actually REACHED the child (a sent
    // event), so skipped/undeliverable rungs created later don't reset the clock.
    if (e.sentAt && e.sentAt.getTime() > chain.lastTouch.getTime()) chain.lastTouch = e.sentAt;
    if (e.status === "PENDING" || e.status === "ESCALATING") chain.active = true;
  }
  return out;
}

/** Thrown inside the episode transaction to undo it: something moved meanwhile, the next run decides. */
class EpisodeMoved extends Error {}

/** Pure: may this episode be re-notified again? (rung 1 = the first re-notification) */
export function renotifyAllowed(parentAlertRung: number): boolean {
  return parentAlertRung <= MAX_PARENT_RENOTIFY;
}

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

/** The start of today in Bucharest. */
function startOfBucharestDay(now: Date): Date {
  const { y, m, d } = bucharestYmd(now);
  return bucharestTimeToUtc(y, m, d);
}

/**
 * One in-app alert row + real-time delivery to ONE guardian (rung = their own cascade step). Past
 * PARENT_ALERTS_PER_DAY delivered alerts today, only the in-app row is written — except for the first
 * alert of an episode, up to PARENT_ALERTS_HARD_CAP. `key` names this one alert to this one parent, so
 * the e-mail provider sends it at most once. Never throws: one parent's failure must not stop the others.
 */
async function notifyParent(
  parentId: string,
  childId: string,
  childName: string | null,
  alert: { alertType: string; title: string; message: string; channel?: string | null },
  rung = 0,
  now: Date = new Date(),
  key?: string
): Promise<void> {
  try {
    const capped = !UNCAPPED_ALERTS.has(alert.alertType);
    // Only alerts that reached a device count: an in-app-only row, or one held by quiet hours, doesn't.
    const deliveredToday = await prisma.notification.count({
      where: {
        userId: parentId,
        type: "parent_alert",
        createdAt: { gte: startOfBucharestDay(now) },
        metadata: { path: ["delivered"], equals: true },
      },
    });
    const metadata = {
      childId,
      childName,
      alertType: alert.alertType,
      channel: alert.channel ?? null,
      delivered: false,
    };
    const row = await prisma.notification.create({
      data: { userId: parentId, type: "parent_alert", title: alert.title, message: alert.message, metadata },
    });
    // Real-time delivery to the parent's devices (not just the in-app feed), within the daily limits.
    if (deliveredToday >= PARENT_ALERTS_HARD_CAP) return;
    if (capped && deliveredToday >= PARENT_ALERTS_PER_DAY) return;
    if (await deliverParentAlert(parentId, alert.title, alert.message, rung, undefined, key)) {
      await prisma.notification.update({ where: { id: row.id }, data: { metadata: { ...metadata, delivered: true } } });
    }
  } catch (e) {
    console.error("notifyParent error:", e);
  }
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
  opts?: { relation?: "PARENT" },
  now: Date = new Date(),
  /** Names this alert about this child; each parent's key adds their id. */
  keyBase?: string
): Promise<number> {
  const links = await prisma.guardian.findMany({
    where: { childId, status: "active", ...(opts?.relation ? { relation: opts.relation } : {}) },
    select: { parentId: true },
  });
  // A paused parent (access.ts) gets no alert from any step of an episode, its resolution included —
  // and nobody gets one about a paused child (review r6, X5).
  const paused = await pausedUserIds([childId, ...links.map((l) => l.parentId)]);
  if (paused.has(childId)) return 0;
  const reached = links.filter((l) => !paused.has(l.parentId));
  for (const l of reached) {
    await notifyParent(l.parentId, childId, childName, alert, 0, now, keyBase ? `${keyBase}:${l.parentId}` : undefined);
  }
  return reached.length;
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
type MonitoringResult = { opened: number; renotified: number; resolvedPositive: number; resolvedNegative: number; expired: number };

export async function runParentMonitoring(now: Date = new Date()): Promise<MonitoringResult & { ran: boolean }> {
  // One run at a time: two runs working from their own lists sent the same notices again and again.
  const run = await withCronLease("parent-monitoring", 30 * 60_000, () => monitorOnce(now));
  return run.ran
    ? { ran: true, ...run.result }
    : { ran: false, opened: 0, renotified: 0, resolvedPositive: 0, resolvedNegative: 0, expired: 0 };
}

async function monitorOnce(now: Date): Promise<MonitoringResult> {
  const deadline = Date.now() + RUN_BUDGET_MS;
  const outOfTime = () => Date.now() > deadline;
  let opened = 0;
  let renotified = 0;
  let resolvedPositive = 0;
  let resolvedNegative = 0;
  let expired = 0;
  // Children whose parents were told something this run: one notice per child, whatever number of
  // episodes it closes.
  const announced = new Set<string>();

  // Vacanță: copiii în vacanță sunt excluși complet — niciun fel de alertă către părinte.
  const onBreak = await userIdsOnBreak(now);

  // 0) Episodes nobody acted on for a day close without a word: a new lapse opens a fresh one. An
  //    authorized extra cascade left unresolved closes after two (it would block new episodes). Counted
  //    from when the episode opened (or was authorized), not from its chain's start — a chain can lapse
  //    long after its first rung.
  const stale = await prisma.parentEscalation.updateMany({
    where: {
      OR: [
        { status: "awaiting_parent", createdAt: { lt: new Date(now.getTime() - EPISODE_MAX_AGE_H * 60 * 60 * 1000) } },
        {
          status: "authorized",
          OR: [
            { authorizedAt: { lt: new Date(now.getTime() - AUTHORIZED_MAX_AGE_H * 60 * 60 * 1000) } },
            { authorizedAt: null, createdAt: { lt: new Date(now.getTime() - AUTHORIZED_MAX_AGE_H * 60 * 60 * 1000) } },
          ],
        },
      ],
    },
    data: { status: "expired", resolvedAt: now },
  });
  expired = stale.count;

  const open = await prisma.parentEscalation.findMany({
    where: { status: { in: OPEN_STATUSES } },
    include: { child: { select: { name: true } } },
  });

  // 1) Resolve episodes where the child has since engaged → positive.
  for (const esc of open) {
    if (outOfTime()) break;
    if (onBreak.has(esc.childId)) continue;
    const { reacted, channel } = await childReactionSince(esc.childId, esc.openedFor);
    if (reacted) {
      // Claimed: only the run that moves it out of its open state announces it.
      const claimed = await prisma.parentEscalation.updateMany({
        where: { id: esc.id, status: esc.status },
        data: { status: "resolved_positive", childChannel: channel, resolvedAt: now },
      });
      if (claimed.count === 0) continue;
      resolvedPositive++;
      if (announced.has(esc.childId)) continue;
      announced.add(esc.childId);
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
        { relation: "PARENT" },
        now,
        `etutor:alert:reacted:${esc.childId}:${esc.openedFor.getTime()}`
      );
    }
  }

  // 2) Authorized episodes that lapsed again (no reaction past the window) → negative.
  for (const esc of open) {
    if (outOfTime()) break;
    if (onBreak.has(esc.childId)) continue;
    if (esc.status !== "authorized" || !esc.authorizedAt) continue;
    if (now.getTime() - esc.authorizedAt.getTime() < AUTH_EXHAUST_MIN * 60_000) continue;
    const { reacted } = await childReactionSince(esc.childId, esc.authorizedAt);
    if (reacted) continue; // handled by step 1 next tick
    const claimed = await prisma.parentEscalation.updateMany({
      where: { id: esc.id, status: "authorized" },
      data: { status: "resolved_negative", resolvedAt: now },
    });
    if (claimed.count === 0) continue;
    resolvedNegative++;
    if (announced.has(esc.childId)) continue;
    announced.add(esc.childId);
    await notifyGuardians(
      esc.childId,
      esc.child.name,
      {
        alertType: "reacted_negative",
        title: "Nu a reacționat ❌",
        message: `${esc.child.name ?? "Copilul"} nu a reacționat nici după reminderul suplimentar.`,
      },
      { relation: "PARENT" },
      now,
      `etutor:alert:negative:${esc.childId}:${esc.openedFor.getTime()}`
    );
  }

  // 3) Open episodes for children whose latest chain lapsed with no reaction. A chain is known by its
  //    first rung: the earliest event of the 12-hour window slid forward as events aged out and made one
  //    lapse look new again (4–6 episodes a child a day), and a rung created late in a slow cascade must
  //    not look like a new lapse either. A chain already has its episode when one was opened for it or
  //    after it (openedFor ≥ its start).
  const since = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const recent = await prisma.escalationEvent.findMany({
    where: { createdAt: { gte: since }, isTest: false },
    select: { userId: true, metadata: true },
  });
  const candidates = [...new Set(recent.filter((e) => !isAuthorizedCascade(e.metadata)).map((e) => e.userId))];
  const chains = await latestChains(candidates, now);
  const lastOpened =
    chains.size === 0
      ? []
      : await prisma.parentEscalation.groupBy({
          by: ["childId"],
          where: { childId: { in: [...chains.keys()] } },
          _max: { openedFor: true },
        });
  const reportedUpTo = new Map(lastOpened.map((r) => [r.childId, r._max.openedFor]));
  // Zile fără program (weekend / nimic programat): nu deschidem alertă nouă către părinte.
  const scheduledChildren = await scheduledTodayFilter([...chains.keys()], now);
  for (const [childId, chain] of chains) {
    if (outOfTime()) break;
    const reported = reportedUpTo.get(childId);
    if (reported && reported.getTime() >= chain.start.getTime()) continue; // this chain has its episode
    if (onBreak.has(childId)) continue; // vacanță
    if (!scheduledChildren.has(childId)) continue; // zi fără program: fără alertă nouă
    if (chain.active) continue; // chain still running
    // One child's failure must not stop the others' alerts.
    try {
      // Episodes (and the authorize-extra-memento flow) belong to PARENT-relation
      // guardians only; a TUTOR-relation guardian stays on threshold alerts.
      const linked = await prisma.guardian.findMany({
        where: { childId, status: "active", relation: "PARENT" },
        select: { parentId: true },
      });
      // A paused family (access.ts) gets no alerts: neither a paused parent nor about a paused child.
      const pausedHere = await pausedUserIds([childId, ...linked.map((g) => g.parentId)], now);
      if (pausedHere.has(childId)) continue;
      const guardians = linked.filter((g) => !pausedHere.has(g.parentId));
      if (guardians.length === 0) continue;

      const reaction = await childReactionSince(childId, chain.start);
      // No reaction → a no-reaction episode, but only after a stall grace.
      if (!reaction.reacted && now.getTime() - chain.lastTouch.getTime() < STALL_MIN * 60_000) continue;
      // Under a lock on the child and checked again inside it, so two runs can never report the same
      // chain twice, even past their leases. A prompt reaction is recorded as a closed episode, so the
      // chain counts as reported (a deleted notice used to be sent again).
      const openedHere = await prisma
        .$transaction(
          async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('parent-episode'), hashtext(${childId}))`;
            const latest = await tx.parentEscalation.findFirst({
              where: { childId },
              orderBy: { openedFor: "desc" },
              select: { openedFor: true },
            });
            if (latest && latest.openedFor.getTime() >= chain.start.getTime()) return false;
            if (reaction.reacted) {
              for (const g of guardians) {
                await tx.parentEscalation.create({
                  data: {
                    parentId: g.parentId,
                    childId,
                    status: "resolved_positive",
                    openedFor: chain.start,
                    childChannel: reaction.channel,
                    resolvedAt: now,
                  },
                });
              }
              return true;
            }
            const stillOpen = await tx.parentEscalation.findMany({
              where: { childId, status: { in: OPEN_STATUSES } },
              select: { id: true, status: true },
            });
            // The parent's extra cascade is running: step 2 owns this child until it resolves.
            if (stillOpen.some((e) => e.status === "authorized")) return false;
            // One open episode per child: a new lapse replaces the one still waiting, so the parent hears
            // about this morning's miss and not only yesterday evening's.
            if (stillOpen.length > 0) {
              const replaced = await tx.parentEscalation.updateMany({
                where: { id: { in: stillOpen.map((e) => e.id) }, status: "awaiting_parent" },
                data: { status: "superseded", resolvedAt: now },
              });
              // One moved meanwhile (a parent authorized the extra cascade): undo, the next run decides.
              if (replaced.count < stillOpen.length) throw new EpisodeMoved();
            }
            for (const g of guardians) {
              await tx.parentEscalation.create({
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
            return true;
          },
          // A slow database must not roll the opening back again and again (the default is 5 s).
          { timeout: 15_000, maxWait: 5_000 }
        )
        .catch((e) => {
          if (e instanceof EpisodeMoved) return false;
          throw e;
        });
      if (!openedHere) continue;
      if (reaction.reacted) {
        if (announced.has(childId)) continue; // told already this run (step 1)
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
          { relation: "PARENT" },
          now,
          `etutor:alert:reacted:${childId}:${chain.start.getTime()}`
        );
        continue;
      }
      const child = await prisma.user.findUnique({ where: { id: childId }, select: { name: true } });
      await notifyGuardians(
        childId,
        child?.name ?? null,
        {
          alertType: "no_reaction",
          title: "Nu a reacționat la reminder",
          message: `${child?.name ?? "Copilul"} nu a reacționat la niciun canal. Poți autoriza un reminder suplimentar.`,
        },
        { relation: "PARENT" },
        now,
        `etutor:alert:no-reaction:${childId}:${chain.start.getTime()}`
      );
      opened++;
    } catch (e) {
      console.error("parent-monitor: child failed", childId, e);
    }
  }

  // 4) Re-notify parents still awaiting, at their cadence — at most MAX_PARENT_RENOTIFY times.
  const awaiting = await prisma.parentEscalation.findMany({
    where: { status: "awaiting_parent" },
    include: { child: { select: { name: true } } },
  });
  const scheduledAwaiting = await scheduledTodayFilter(
    awaiting.map((e) => e.childId),
    now
  );
  const pausedAwaiting = await pausedUserIds(awaiting.flatMap((e) => [e.parentId, e.childId]), now);
  // A parent no longer linked to the child (removed from the family) gets no more re-notifications.
  const stillLinked =
    awaiting.length === 0
      ? []
      : await prisma.guardian.findMany({
          where: {
            status: "active",
            relation: "PARENT",
            OR: awaiting.map((e) => ({ parentId: e.parentId, childId: e.childId })),
          },
          select: { parentId: true, childId: true },
        });
  const linked = new Set(stillLinked.map((l) => `${l.parentId}:${l.childId}`));
  for (const esc of awaiting) {
    if (outOfTime()) break;
    if (!linked.has(`${esc.parentId}:${esc.childId}`)) continue;
    // Părinte în pauză sau copil în pauză: fără re-anunțuri. Checked only on the parent, a paused
    // child's episode re-alerted a parent covered some other way every 30 minutes (review r6, X5).
    if (pausedAwaiting.has(esc.parentId) || pausedAwaiting.has(esc.childId)) continue;
    if (onBreak.has(esc.childId)) continue; // vacanță
    if (!scheduledAwaiting.has(esc.childId)) continue; // zi fără program: nu re-notificăm
    if (!renotifyAllowed(esc.parentAlertRung)) continue; // enough: it waits quietly for the parent
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
    // Claimed before sending: a run that finds the rung moved on (another run sent it) skips it.
    const claimed = await prisma.parentEscalation.updateMany({
      where: { id: esc.id, status: "awaiting_parent", parentAlertRung: esc.parentAlertRung },
      data: { lastParentNotifiedAt: now, parentAlertRung: esc.parentAlertRung + 1 },
    });
    if (claimed.count === 0) continue;
    // Re-notify ONLY this episode's parent (not every guardian of the child), one
    // rung further down THEIR own channel cascade each time.
    await notifyParent(
      esc.parentId,
      esc.childId,
      esc.child.name,
      {
        alertType: "no_reaction_reminder",
        title: "Încă nu a reacționat",
        message: `${esc.child.name ?? "Copilul"} încă nu a reacționat. Autorizează un reminder suplimentar?`,
      },
      esc.parentAlertRung,
      now,
      `etutor:alert:renotify:${esc.id}:${esc.parentAlertRung}`
    );
    renotified++;
  }

  return { opened, renotified, resolvedPositive, resolvedNegative, expired };
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

  // Guarded: an episode replaced or closed meanwhile isn't authorized next to its successor.
  const authorized = await prisma.parentEscalation.updateMany({
    where: { id: esc.id, status: "awaiting_parent" },
    data: { status: "authorized", authorizedAt: new Date() },
  });
  if (authorized.count === 0) return { ok: false };

  await startEscalation({
    userId: childId,
    reason: "parent_authorized",
    metadata: {
      // WhatsApp/SMS only when the parent pays; a parent on the free trial gets the free channels.
      parentAuthorized: await parentPaysForMetered(parentId, childId),
      url: "/dashboard/practice",
      title: "Un reminder de la părinte",
      message: "Hai să facem un quiz scurt acum.",
    },
  });

  return { ok: true };
}
