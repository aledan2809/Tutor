/**
 * Escalation Engine
 *
 * State machine: PENDING → ESCALATING → COMPLETED
 * 6 levels: L1 Push → L2 WhatsApp friendly → L3 WhatsApp pressure →
 *           L4 SMS → L5 Email instructor → L6 Call trigger
 */

import { shouldEscalate, nextStep, resolveGraceMs } from "@aledan/notify-ladder";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { serverChannelAvailability } from "./channel-availability";
import {
  ESCALATION_LEVELS,
  MAX_SEND_FAILURES,
  isChannelEnabled,
  resolveUserLadder,
  resolveUserGraceMs,
  type EscalationLevel,
} from "./config";
import { isQuietHours, isOptimalNotificationTime } from "./timing";
import { sendNotification } from "@/lib/notifications/service";
import { resolveIsTestForUser } from "@/lib/notifications/test-account";
import {
  ESCALATION_LADDER,
  isPaidChannelDeliverable,
  meteredChannelsCovered,
  rungCannotReach,
  SELECT_ACOPERIRE_CANALE_RELATII,
} from "./segmentation";
import { userIdsOnBreak } from "./breaks";
import { scheduledTodayFilter } from "./scheduled-days";
import { pausedUserIds } from "@/lib/access-server";
import { getUserPhone } from "@/lib/phone-setting";

interface EscalationContext {
  userId: string;
  sessionId?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

// ─── Storm guard for cron-driven missed-session detection ───
// The ladder was dormant in prod (no cron). Turning it on must NOT erupt a
// retroactive storm: only re-engage users who lapsed RECENTLY (re-engagement
// has value there, not for months-dormant accounts) and cap how many new chains
// a single run starts. Detection is opt-in (ESCALATION_DETECT_ENABLED=true) so
// deploying the code alone changes nothing — activation = env flag + scheduling.

/** New missed-session chains are started only when this is explicitly enabled. */
export function escalationDetectionEnabled(): boolean {
  return process.env.ESCALATION_DETECT_ENABLED === "true";
}

/** Max new escalation chains a single cron run may start (blast-radius cap). */
export function escalationMaxNewPerRun(): number {
  const n = Number(process.env.ESCALATION_MAX_NEW_PER_RUN ?? 50);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 50;
}

/**
 * The lastActivityDate window for "recently lapsed" students: inactive for ≥24h
 * but not dormant longer than `recencyDays` (default 14). Pure for testability.
 */
export function escalationDetectionWindow(
  now: Date,
  recencyDays = Number(process.env.ESCALATION_RECENCY_DAYS ?? 14)
): { inactiveBefore: Date; lapsedAfter: Date } {
  const days = Number.isFinite(recencyDays) && recencyDays > 0 ? recencyDays : 14;
  return {
    inactiveBefore: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    lapsedAfter: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
  };
}

/**
 * Re-engagement cooldown start. A user with ANY escalation event created after
 * this is NOT re-detected — so a finished/terminated chain (whose events are all
 * COMPLETED, hence "no active escalation") doesn't get re-started every cron run.
 * Must exceed the full ladder duration (L1→L6 ≈ 48h). Default 7 days.
 */
export function escalationCooldownStart(
  now: Date,
  cooldownDays = Number(process.env.ESCALATION_COOLDOWN_DAYS ?? 7)
): Date {
  const days = Number.isFinite(cooldownDays) && cooldownDays > 0 ? cooldownDays : 7;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Start an escalation chain for a user (e.g., missed session).
 * Creates a PENDING L1 event and immediately attempts to send it.
 */
export async function startEscalation(ctx: EscalationContext): Promise<string> {
  const existing = await prisma.escalationEvent.findFirst({
    where: {
      userId: ctx.userId,
      status: { in: ["PENDING", "ESCALATING"] },
    },
    orderBy: { createdAt: "desc" },
  });

  // Don't start a new chain if one is already active
  if (existing) {
    return existing.id;
  }

  // First rung = the user's most-preferred channel (their saved order), or the
  // code default when they never customised it.
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: ctx.userId },
    select: { channelOrder: true, escalationSteps: true },
  });
  const level = resolveUserLadder(prefs ?? {})[0];
  const event = await prisma.escalationEvent.create({
    data: {
      userId: ctx.userId,
      isTest: await resolveIsTestForUser(ctx.userId),
      sessionId: ctx.sessionId,
      level: level.level,
      status: "PENDING",
      channel: level.channel,
      templateId: level.templateId,
      metadata: {
        reason: ctx.reason,
        ...ctx.metadata,
      },
    },
  });

  // Attempt immediate send for L1
  await processEscalationEvent(event.id);

  return event.id;
}

/**
 * Process a single escalation event — send notification and advance state.
 */
export async function processEscalationEvent(eventId: string): Promise<void> {
  const event = await loadRungForSend(eventId);

  // Only a PENDING rung is picked up: an ESCALATING one is being sent by another run right now.
  if (!event || event.status !== "PENDING") return;
  const now = new Date();
  const stored = (event.metadata as Record<string, unknown> | null) ?? {};
  if (waitsUntilLater(event.metadata, now)) return;

  // A rung created earlier and sent only now (after quiet hours, a failed send, study time) is
  // dropped when the child tapped a notification of this chain or studied since the chain started.
  // Checked before any skip: skipping would create the next rung (review 3, minor 2a).
  if (!shouldEscalate(await chainAnswered(event.userId, event.level, event.createdAt))) {
    await prisma.escalationEvent.updateMany({
      where: { id: event.id, status: "PENDING" },
      data: { status: "COMPLETED", metadata: { ...stored, answered: true } as Prisma.InputJsonObject },
    });
    return;
  }

  const prefs = event.user.notificationPreference;
  const timezone = prefs?.timezone ?? "Europe/Bucharest";
  const quietStart = prefs?.quietHoursStart ?? "22:00";
  const quietEnd = prefs?.quietHoursEnd ?? "07:00";

  // Check quiet hours (skip for L1 push — always instant)
  if (event.level > 1 && isQuietHours(timezone, quietStart, quietEnd)) {
    // Looked at again in a quarter of an hour, not every minute all night.
    await waitRung(event.id, stored, {}, now);
    return;
  }

  // Check channel preference. The map lives in config.ts as a pure, total function so it
  // can be tested — see isChannelEnabled() there for why that matters (a silently skipped
  // TELEGRAM rung shipped for months behind an inline, untestable lookup).
  if (!isChannelEnabled(event.channel, prefs)) {
    // User disabled this channel — skip to next level
    await escalateToNextLevel(event.id, event.level, "PENDING");
    return;
  }

  // Skip a channel that can't deliver right now (Telegram not linked/enabled,
  // WhatsApp unconfigured, SMS gateway unconfigured) — otherwise the send fails
  // and the event retries forever. WhatsApp is the last rung, so skipping it
  // ends the chain.
  if (
    event.channel === "TELEGRAM" ||
    event.channel === "WHATSAPP" ||
    event.channel === "SMS" ||
    event.channel === "EMAIL"
  ) {
    // Același răspuns îl folosește și pagina pentru părinți, ca să nu promită un canal oprit.
    const available = serverChannelAvailability(process.env);
    const deliverable = isPaidChannelDeliverable(event.channel, {
      telegramLinked: Boolean(event.user.telegramChatId),
      telegramEnabled: available.telegram,
      whatsappConfigured: available.whatsapp,
      smsConfigured: available.sms,
      emailConfigured: available.email,
    });
    if (!deliverable) {
      await escalateToNextLevel(event.id, event.level, "PENDING");
      return;
    }
  }

  // WhatsApp is PREMIUM-ONLY for a free (non-trialing) student — dar „plătit" include
  // și omul a cărui FIRMĂ are canalele contorizate incluse (B2B, factură separată).
  // Poarta asta e ÎNAINTEA lui `sendNotification`, deci ea decide de fapt dacă
  // WhatsApp pleacă; o reparație doar în `meteredChannelBlocked` n-ar fi făcut nimic.
  // Since users can now
  // reorder their cascade, WhatsApp is no longer guaranteed to be the last rung — so
  // skip it and continue down the ladder instead of ending the chain here. In the
  // default order WhatsApp IS last, so skipping finds no next rung and the chain
  // still ends after email — identical outcome to before. Test accounts are exempt
  // (journey-audit), and a parent-authorized extra cascade may use WhatsApp regardless.
  const parentAuthorized =
    (event.metadata as Record<string, unknown> | null)?.parentAuthorized === true;
  // Same gate for SMS (it used to reach `sendNotification`, get blocked there, fall back to
  // PENDING and retry forever), plus the rungs that cannot reach this person at all: no email
  // address, no phone number. A „no" skips to the next rung instead of blocking the chain.
  if (event.channel === "EMAIL" || event.channel === "WHATSAPP" || event.channel === "SMS") {
    const phone = event.channel !== "EMAIL" ? await getUserPhone(event.userId) : null;
    const unreachable = rungCannotReach(event.channel, {
      hasEmail: Boolean(event.user.email),
      hasPhone: typeof phone === "string" && phone.trim().length > 0,
      covered: meteredChannelsCovered(event.user),
      isTest: event.isTest,
      parentAuthorized,
    });
    if (unreachable) {
      await escalateToNextLevel(event.id, event.level, "PENDING");
      return;
    }
  }

  const sendTemplateId = event.templateId ?? "";

  // Check SMS daily limit
  if (event.channel === "SMS") {
    // Look up by channel, not ladder position — the per-day cap belongs to SMS
    // wherever the user placed it in their order.
    const levelConfig = ESCALATION_LEVELS.find((l) => l.channel === event.channel);
    if (levelConfig?.maxPerDay) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const smsCount = await prisma.escalationEvent.count({
        where: {
          userId: event.userId,
          channel: "SMS",
          sentAt: { gte: todayStart },
        },
      });
      if (smsCount >= levelConfig.maxPerDay) {
        // Skip SMS, try next level
        await escalateToNextLevel(event.id, event.level, "PENDING");
        return;
      }
    }
  }

  // For L2+ non-urgent levels, prefer sending during the child's study time: wait once per chain
  // (the mark travels with the chain), and only for a rung that will actually be sent — a rung the
  // checks above skip must not hold the next one back.
  if (event.level >= 2 && event.level <= 3 && !stored.deferredOnce) {
    if (!(await isOptimalNotificationTime(event.userId, timezone))) {
      await waitRung(event.id, stored, { deferredOnce: true }, now);
      return;
    }
  }

  // Claim the rung: only the run that moves it from PENDING sends it. Two runs at once (one that
  // outlived its lease, or a new chain started outside the lease) would otherwise both send it.
  const claimed = await prisma.escalationEvent.updateMany({
    where: { id: event.id, status: "PENDING" },
    data: { status: "ESCALATING" },
  });
  if (claimed.count === 0) return;

  // A claimed rung must never stay ESCALATING because of an error in this run (a database hiccup):
  // closed later as stuck, with no send time, its chain would never lead further. Failing before the
  // send, it goes back to waiting; after a send that went out, it is recorded as sent; after a send
  // that failed, the failure counts.
  const progress: SendProgress = { phase: "before" };
  try {
    await sendClaimedRung(event, stored, parentAuthorized, sendTemplateId, now, progress);
  } catch (err) {
    const data: Prisma.EscalationEventUpdateManyMutationInput =
      progress.phase === "sent"
        ? { status: "COMPLETED", sentAt: new Date() }
        : {
            status: "PENDING",
            metadata: {
              ...stored,
              ...(progress.phase === "failed" ? { sendFailures: progress.failures } : {}),
              nextAttemptAt: laterIso(now),
            } as Prisma.InputJsonObject,
          };
    await prisma.escalationEvent
      .updateMany({ where: { id: event.id, status: "ESCALATING" }, data })
      .catch((e) => console.error("[escalation] claimed rung not released", event.id, e));
    throw err;
  }
}

/** One rung with what its send needs: the person, their preferences, who pays their metered channels. */
function loadRungForSend(eventId: string) {
  return prisma.escalationEvent.findUnique({
    where: { id: eventId },
    include: {
      user: {
        include: {
          notificationPreference: true,
          // Cine îi plătește canalele contorizate. Legătura cu clientul B2B trece prin
          // ÎNSCRIERE, nu prin `User.organizationId` (cursanții au acolo null) — de-aia
          // se folosește selectul comun, nu o listă scrisă de mână aici.
          ...SELECT_ACOPERIRE_CANALE_RELATII,
        },
      },
    },
  });
}

type ClaimedRung = NonNullable<Awaited<ReturnType<typeof loadRungForSend>>>;

/** How far the send of a claimed rung got, for putting it back right if this run fails midway. */
type SendProgress = { phase: "before" | "sent" | "failed"; failures?: number };

/** The send of a rung this run has claimed, and what it leaves behind (sent / retry / next rung). */
async function sendClaimedRung(
  event: ClaimedRung,
  stored: Record<string, unknown>,
  parentAuthorized: boolean,
  sendTemplateId: string,
  now: Date,
  progress: SendProgress
): Promise<void> {
  // The Telegram nudge carries the reminder's OWN copy (title/message, Romanian,
  // session-specific — exactly what push already uses) plus at most one encouraging
  // line. It used to carry an English pressure blob instead; see encouragementFor().
  const metadata: Record<string, unknown> = { ...stored };
  if (event.channel === "TELEGRAM") {
    const encouragement = await studentEncouragement(event.userId);
    if (encouragement) metadata.encouragement = encouragement;
  }

  // Send notification (never throws: a failed send returns false)
  const success = await sendNotification({
    userId: event.userId,
    channel: event.channel,
    templateId: sendTemplateId,
    metadata: {
      ...metadata,
      userName: event.user.name ?? "Student",
      userEmail: event.user.email ?? "",
      level: event.level,
      // Deep-link target (set by scheduled reminders); defaults to home on tap.
      url: metadata.url as string | undefined,
      // Embedded in the web-push payload so the service worker can ACK this
      // event on tap (→ /api/escalation/ack → acknowledgedAt → skip paid escalation).
      escalationEventId: event.id,
      // Pass the exemptions this engine already evaluated through to the send
      // chokepoint's defense-in-depth plan gate (so it agrees with us instead of
      // double-blocking a test / parent-authorized metered send).
      isTest: event.isTest,
      parentAuthorized,
    },
  });

  if (success) {
    progress.phase = "sent";
    await prisma.escalationEvent.update({
      where: { id: event.id },
      data: { status: "COMPLETED", sentAt: new Date() },
    });

    // Create in-app notification record
    await prisma.notification.create({
      data: {
        userId: event.userId,
        type: `escalation_l${event.level}`,
        title: getEscalationTitle(event.level),
        message: getEscalationMessage(event.level, metadata.reason as string),
        metadata: { escalationEventId: event.id, channel: event.channel },
      },
    });
  } else {
    // Failed — retry a few times, then move on: an endless PENDING keeps the chain „active",
    // so no new reminder starts and the parent is never alerted. The retries are a quarter of an
    // hour apart, as when the cron ran every 15 minutes: a minute's outage must not move a child
    // on to WhatsApp or SMS (review 3, minor 3).
    const failures = Number(stored.sendFailures ?? 0) + 1;
    progress.phase = "failed";
    progress.failures = failures;
    if (failures >= MAX_SEND_FAILURES) {
      await escalateToNextLevel(event.id, event.level, "ESCALATING");
      return;
    }
    await prisma.escalationEvent.updateMany({
      where: { id: event.id, status: "ESCALATING" },
      data: {
        status: "PENDING",
        metadata: { ...stored, sendFailures: failures, nextAttemptAt: laterIso(now) } as Prisma.InputJsonObject,
      },
    });
  }
}

/**
 * Escalate to next level by creating a new event. `from` is the status the caller saw: only the
 * caller that moves the rung on from it creates the next one, so two runs skipping the same rung at
 * once don't both create it.
 */
async function escalateToNextLevel(
  currentEventId: string,
  currentLevel: number,
  from: "PENDING" | "ESCALATING"
): Promise<void> {
  const current = await prisma.escalationEvent.findUnique({
    where: { id: currentEventId },
    select: {
      userId: true,
      sessionId: true,
      metadata: true,
      user: { select: { notificationPreference: { select: { channelOrder: true, escalationSteps: true } } } },
    },
  });
  if (!current) return;

  // Advance along THIS user's ladder — a parent's custom cascade if set, else their
  // channel priority order, else the code default.
  const nextLevelConfig = resolveUserLadder(current.user.notificationPreference ?? {}).find(
    (l) => l.level === currentLevel + 1
  );
  const isTest = nextLevelConfig ? await resolveIsTestForUser(current.userId) : false;

  await prisma.$transaction(async (tx) => {
    // Mark current as completed (skipped)
    const moved = await tx.escalationEvent.updateMany({
      where: { id: currentEventId, status: from },
      data: { status: "COMPLETED" },
    });
    if (moved.count === 0 || !nextLevelConfig) return; // moved on by another run, or no more levels

    // The failure count belongs to the rung that failed, not to the next one.
    await tx.escalationEvent.create({
      data: {
        userId: current.userId,
        isTest,
        sessionId: current.sessionId,
        level: nextLevelConfig.level,
        status: "PENDING",
        channel: nextLevelConfig.channel,
        templateId: nextLevelConfig.templateId,
        metadata: current.metadata ? withoutRungState(current.metadata) : undefined,
      },
    });
  });
}

/** A child's latest sent rung: the tip of the chain that is still running for them, if any. */
type ChainTip = {
  id: string;
  userId: string;
  level: number;
  sentAt: Date;
  createdAt: Date;
  acknowledgedAt: Date | null;
  sessionId: string | null;
  metadata: Prisma.JsonValue;
  isTest: boolean;
};

/**
 * A rung claimed for sending by a run that died (a restart during a deploy) stays ESCALATING, and the
 * child's chain then looks active forever: no new reminder starts, no parent alert. After a while it
 * is closed without another attempt — it may well have gone out before the run died.
 *
 * Runs before the due reminders (chains-run.ts): a reminder coming due next to a stuck rung would
 * otherwise find the chain „active", be marked done for the day, and start nothing. The retry cron
 * uses the same rule — sending such a rung again could send it twice.
 */
export async function closeStuckSends(now: Date = new Date()): Promise<number> {
  return prisma.$executeRaw`
    UPDATE "EscalationEvent"
    SET "status" = 'COMPLETED',
        "metadata" = COALESCE("metadata", '{}'::jsonb) || '{"stuck": true}'::jsonb,
        "updatedAt" = NOW()
    WHERE "status" = 'ESCALATING' AND "updatedAt" < ${new Date(now.getTime() - STUCK_SEND_MS)}`;
}

/**
 * Check for pending escalations that need advancement.
 * Called by cron — finds sent rungs whose next level delay has passed.
 *
 * Every minute, so it must stay a handful of queries whatever the number of children. It used to
 * load every rung sent in the last two weeks, each with its user, and query each one (review 3, M4).
 */
export async function advancePendingEscalations(now: Date = new Date()): Promise<number> {
  // One chain at a time per child: only their latest sent rung can lead further. An older sent rung
  // already has its next rung, or belongs to a chain a newer reminder replaced. Only recent tips can
  // still lead anywhere: the longest chain (six rungs of at most a day each, paused over days without
  // a schedule) ends well inside CHAIN_MAX_AGE_DAYS.
  const since = new Date(now.getTime() - CHAIN_MAX_AGE_DAYS * DAY_MS);
  const tips = await prisma.$queryRaw<ChainTip[]>`
    SELECT DISTINCT ON ("userId")
      "id", "userId", "level", "sentAt", "createdAt", "acknowledgedAt", "sessionId", "metadata", "isTest"
    FROM "EscalationEvent"
    WHERE "status" = 'COMPLETED' AND "sentAt" >= ${since}
    ORDER BY "userId", "sentAt" DESC`;

  const prefsByUser = new Map(
    tips.length === 0
      ? []
      : (
          await prisma.notificationPreference.findMany({
            where: { userId: { in: tips.map((t) => t.userId) } },
            select: { userId: true, channelOrder: true, escalationSteps: true },
          })
        ).map((p) => [p.userId, p] as const)
  );

  // The checks that need no query first: a closed or tapped tip, the last rung, a wait not over yet.
  const due: { tip: ChainTip; next: EscalationLevel }[] = [];
  for (const tip of tips) {
    if (chainClosed(tip.metadata)) continue; // answered, or ended by the pause (see below)
    if (tip.acknowledgedAt) continue; // tapped: the chain stops here
    // Resolve the next rung + its grace from the shared ladder. currentIndex is
    // 0-based (level - 1); resolveGraceMs(currentIndex) = wait after this step
    // before escalating to the next.
    const currentIndex = tip.level - 1;
    if (!nextStep(ESCALATION_LADDER, currentIndex)) continue; // terminal rung
    const prefs = prefsByUser.get(tip.userId);
    const next = resolveUserLadder(prefs ?? {})[currentIndex + 1];
    if (!next) continue;

    const messageType =
      ((tip.metadata as Record<string, unknown> | null)?.reason as string) ??
      "missed_session";
    // A parent's custom cascade sets the wait to the next rung's own delayMinutes,
    // overriding the window grace; otherwise fall back to the time-window grace.
    const customGrace = resolveUserGraceMs(prefs?.escalationSteps, currentIndex);
    const grace =
      customGrace !== undefined
        ? customGrace
        : resolveGraceMs(ESCALATION_LADDER, currentIndex, messageType);
    if (grace == null) continue;
    if (now.getTime() - tip.sentAt.getTime() < grace) continue;
    due.push({ tip, next });
  }

  const onBreak = await userIdsOnBreak(now);
  let advanced = 0;
  // Then the checks that cost one query for everyone, cheapest first; the per-account ones (the
  // pause reads each account's access) only for the few rungs about to be created.
  const facts = await chainFacts(
    [...new Set(due.map((d) => d.tip.userId))],
    new Date(since.getTime() - CHAIN_MAX_AGE_DAYS * DAY_MS)
  );
  // A rung created after the tip: the next rung exists (waiting, or skipped), or a new chain started.
  const leading = due.filter(({ tip }) => {
    const last = facts.get(tip.userId)?.lastCreatedAt;
    return !(last && last > tip.createdAt);
  });
  // No rung after the tip, so the latest level-1 rung is where the tip's chain started.
  const startOf = (tip: ChainTip) => facts.get(tip.userId)?.chainStart ?? tip.createdAt;
  const studied = await lastStudy(
    leading.map(({ tip }) => tip.userId),
    leading.reduce((min, { tip }) => (startOf(tip) < min ? startOf(tip) : min), now)
  );
  const unanswered: typeof leading = [];
  for (const d of leading) {
    // Push-first cost gate via @aledan/notify-ladder: escalate to the next (paid) rung only when
    // the child neither tapped a notification of this chain nor studied since it started (a
    // completed session = the domain "done" signal). A tap on any notification counts, not only
    // on the latest one: the child may open the first push after the Telegram message went out,
    // or the push of the reminder five minutes earlier.
    const answer = answeredSince(startOf(d.tip), facts.get(d.tip.userId)?.lastAckAt ?? null, studied.get(d.tip.userId) ?? null);
    if (shouldEscalate(answer)) unanswered.push(d);
    // Answered chains stay answered: closed, so they aren't read again every minute for two weeks.
    else await closeChain(d.tip.id, "answered");
  }

  const toCreate = unanswered.filter(({ tip }) => !onBreak.has(tip.userId)); // vacanță: nu escaladăm
  const userIds = [...new Set(toCreate.map(({ tip }) => tip.userId))];
  const [scheduled, paused] = await Promise.all([
    // Zile fără program (weekend / nimic programat): lanțul se pune pe pauză și
    // reia la următoarea zi programată — nu nag-uim copilul în off-days.
    scheduledTodayFilter(userIds, now),
    pausedUserIds(userIds, now),
  ]);
  for (const { tip, next } of toCreate) {
    // The pause before the day without a schedule: checked after it, a chain paused on a weekend
    // stayed open and picked up on the first scheduled day after the family paid (review r6, X7).
    if (paused.has(tip.userId)) {
      // Proba gratuită s-a încheiat fără plată (access.ts): the chain ends here. Left as it was, it
      // would pick up days later, the minute the family pays, for a session long gone.
      await closeChain(tip.id, "paused");
      continue;
    }
    if (!scheduled.has(tip.userId)) continue; // zi fără program: pauză
    try {
      const created = await prisma.$transaction(async (tx) => {
        // Two runs at once (one that outlived its lease): the second waits here for the first to
        // finish, then sees the rung it created.
        await tx.$queryRaw`SELECT "id" FROM "EscalationEvent" WHERE "id" = ${tip.id} FOR UPDATE`;
        const after = await tx.escalationEvent.findFirst({
          where: { userId: tip.userId, createdAt: { gt: tip.createdAt } },
          select: { id: true },
        });
        if (after) return false;
        await tx.escalationEvent.create({
          data: {
            userId: tip.userId,
            // Same person as the tip, so the same flag — no lookup per rung.
            isTest: tip.isTest,
            sessionId: tip.sessionId,
            level: next.level,
            status: "PENDING",
            channel: next.channel,
            templateId: next.templateId,
            // The failure count and waits belong to the rung they happened on, not the next one.
            metadata: tip.metadata ? withoutRungState(tip.metadata) : undefined,
          },
        });
        return true;
      });
      if (created) advanced++;
    } catch (err) {
      // One child's failure doesn't stop the rest of the minute's run.
      console.error("[escalation] next rung failed", tip.userId, err);
    }
  }

  // Process all pending events (skip students on a break — no delivery during vacanță). A rung that
  // can't reach the person is skipped by creating the next one; that one goes out in the same run
  // (another pass) instead of waiting for the next cron call. Each event is tried once per run. A
  // rung waiting for later (a failed send, quiet hours, study time) isn't loaded until then.
  const seen = new Set<string>();
  for (let pass = 0; pass < MAX_LADDER_PASSES; pass++) {
    const pending = await prisma.escalationEvent.findMany({
      where: { status: "PENDING", ...(seen.size > 0 ? { id: { notIn: [...seen] } } : {}) },
      select: { id: true, userId: true, metadata: true },
    });
    if (pending.length === 0) break;
    for (const p of pending) seen.add(p.id);
    const ready = pending.filter((p) => !onBreak.has(p.userId) && !waitsUntilLater(p.metadata, now));
    // Nothing sent or skipped in this pass, so no new rung for another one.
    if (ready.length === 0) break;
    const userIds = [...new Set(ready.map((p) => p.userId))];
    const [scheduledPending, paused] = await Promise.all([
      scheduledTodayFilter(userIds, now),
      pausedUserIds(userIds, now),
    ]);

    for (const p of ready) {
      if (paused.has(p.userId)) {
        // A paused account gets nothing; the chain ends here instead of firing late after payment.
        await prisma.escalationEvent.updateMany({ where: { id: p.id, status: "PENDING" }, data: { status: "COMPLETED" } });
        continue;
      }
      if (!scheduledPending.has(p.userId)) continue; // zi fără program: nu trimitem
      try {
        await processEscalationEvent(p.id);
      } catch (err) {
        // One rung's failure doesn't stop the rest of the minute's run.
        console.error("[escalation] rung failed", p.id, err);
      }
    }
  }

  return advanced;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** How far back a sent step can still start the next rung (see advancePendingEscalations). */
const CHAIN_MAX_AGE_DAYS = 14;
/** A send takes seconds; a rung ESCALATING longer than this was claimed by a run that died. */
const STUCK_SEND_MS = 15 * 60_000;
/** One pass per rung at most: a chain can't skip more rungs than the ladder has. */
const MAX_LADDER_PASSES = 6;
/**
 * How long a rung waits before it is looked at again: after a failed send, in quiet hours, and when
 * it waits once for the child's study time. These waits came from the 15-minute cron; running the
 * chains every minute must not shrink them to a minute.
 */
export const RUNG_WAIT_MS = 15 * 60_000;

function laterIso(now: Date): string {
  return new Date(now.getTime() + RUNG_WAIT_MS).toISOString();
}

/** Pure: does this rung's metadata ask to be left alone until a later time? */
export function waitsUntilLater(metadata: Prisma.JsonValue | null | undefined, now: Date): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const at = (metadata as Record<string, unknown>).nextAttemptAt;
  const ms = typeof at === "string" ? Date.parse(at) : NaN;
  return Number.isFinite(ms) && ms > now.getTime();
}

/** Put a PENDING rung aside for RUNG_WAIT_MS (unless another run has claimed it meanwhile). */
async function waitRung(
  eventId: string,
  stored: Record<string, unknown>,
  extra: Record<string, unknown>,
  now: Date
): Promise<void> {
  await prisma.escalationEvent.updateMany({
    where: { id: eventId, status: "PENDING" },
    data: { metadata: { ...stored, ...extra, nextAttemptAt: laterIso(now) } as Prisma.InputJsonObject },
  });
}

/** The bookkeeping of one rung (failures, waits, how it ended) doesn't travel to the next one. */
export function withoutRungState(metadata: Prisma.JsonValue): Prisma.InputJsonValue {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return metadata as Prisma.InputJsonValue;
  const copy: Record<string, unknown> = { ...(metadata as Record<string, unknown>) };
  for (const key of RUNG_STATE_KEYS) delete copy[key];
  return copy as Prisma.InputJsonObject;
}

/**
 * Set on one rung only: retries, waits, and the marks of how it or its chain ended. `deferredOnce` is
 * not among them: the wait for the child's study time happens once per chain, not once per rung.
 */
const RUNG_STATE_KEYS = ["sendFailures", "nextAttemptAt", "retryCount", "lastRetryAt", "answered", "stuck", "closed"];

/** Pure: was this sent rung marked as the end of its chain? */
export function chainClosed(metadata: Prisma.JsonValue | null | undefined): boolean {
  return Boolean(metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).closed);
}

/** Mark a chain's latest sent rung as its end, so it never leads to another rung. */
async function closeChain(tipId: string, why: "answered" | "paused"): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "EscalationEvent"
    SET "metadata" = COALESCE("metadata", '{}'::jsonb) || jsonb_build_object('closed', ${why}::text),
        "updatedAt" = NOW()
    WHERE "id" = ${tipId} AND "status" = 'COMPLETED'`;
}

/**
 * End every chain of one account (it became a parent: it no longer does the sessions the reminders
 * call for). A rung still waiting is closed unsent; every sent rung that could still lead to another
 * one (CHAIN_MAX_AGE_DAYS) gets the same `closed` mark as closeChain. Run inside the caller's
 * transaction (`db`), so it happens together with the account's change (review r6, K6).
 */
export async function closeChainsOf(
  userId: string,
  why: "parent",
  db: Pick<typeof prisma, "escalationEvent" | "$executeRaw"> = prisma,
  now: Date = new Date()
): Promise<void> {
  await db.escalationEvent.updateMany({ where: { userId, status: "PENDING" }, data: { status: "COMPLETED" } });
  await db.$executeRaw`
    UPDATE "EscalationEvent"
    SET "metadata" = COALESCE("metadata", '{}'::jsonb) || jsonb_build_object('closed', ${why}::text),
        "updatedAt" = NOW()
    WHERE "userId" = ${userId} AND "status" = 'COMPLETED' AND "sentAt" >= ${new Date(now.getTime() - CHAIN_MAX_AGE_DAYS * DAY_MS)}`;
}

type LastStudy = { startedAt: Date | null; endedAt: Date | null };

/**
 * Pure: did the child answer the chain that started at `start` — a tap on any notification since
 * then, or a session finished since then? A late/resumed session has an old startedAt, so a session
 * that FINISHED after the start counts too: the completion is the real "studied" signal. Earlier
 * chains don't count, so yesterday's tap doesn't silence today's reminder.
 */
export function answeredSince(
  start: Date,
  lastAckAt: Date | null,
  study: LastStudy | null
): { acknowledged: boolean; actionDone: boolean } {
  const after = (d: Date | null | undefined) => d != null && d.getTime() > start.getTime();
  return {
    acknowledged: lastAckAt != null && lastAckAt.getTime() >= start.getTime(),
    actionDone: study != null && (after(study.startedAt) || after(study.endedAt)),
  };
}

/**
 * Per child, in one query: their latest rung, where their latest chain started, their latest tap.
 * Only rungs created since `from`: this runs every minute, and a child's older history can't start
 * or answer a chain still running.
 */
async function chainFacts(
  userIds: string[],
  from: Date
): Promise<Map<string, { lastCreatedAt: Date | null; chainStart: Date | null; lastAckAt: Date | null }>> {
  if (userIds.length === 0) return new Map();
  const rows = await prisma.$queryRaw<
    { userId: string; lastCreatedAt: Date | null; chainStart: Date | null; lastAckAt: Date | null }[]
  >`
    SELECT "userId",
      MAX("createdAt") AS "lastCreatedAt",
      MAX("createdAt") FILTER (WHERE "level" = 1) AS "chainStart",
      MAX("acknowledgedAt") AS "lastAckAt"
    FROM "EscalationEvent"
    WHERE "userId" IN (${Prisma.join(userIds)}) AND "createdAt" >= ${from}
    GROUP BY "userId"`;
  return new Map(rows.map((r) => [r.userId, r] as const));
}

/**
 * Per child, in one query: the latest start and end among their finished sessions — only sessions
 * that started or ended after `from` (the earliest chain start asked about) can answer a chain.
 */
async function lastStudy(userIds: string[], from: Date): Promise<Map<string, LastStudy>> {
  if (userIds.length === 0) return new Map();
  const rows = await prisma.session.groupBy({
    by: ["userId"],
    where: {
      userId: { in: [...new Set(userIds)] },
      endedAt: { not: null },
      OR: [{ startedAt: { gt: from } }, { endedAt: { gt: from } }],
    },
    _max: { startedAt: true, endedAt: true },
  });
  return new Map(rows.map((r) => [r.userId, { startedAt: r._max.startedAt, endedAt: r._max.endedAt }] as const));
}

/**
 * For one rung about to be sent: did the child answer its chain? The chain starts at the latest
 * level-1 rung created up to this one.
 */
async function chainAnswered(
  userId: string,
  level: number,
  createdAt: Date
): Promise<{ acknowledged: boolean; actionDone: boolean }> {
  const start =
    level <= 1
      ? createdAt
      : ((
          await prisma.escalationEvent.findFirst({
            where: { userId, level: 1, createdAt: { lte: createdAt } },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          })
        )?.createdAt ?? createdAt);
  const [tap, study] = await Promise.all([
    prisma.escalationEvent.findFirst({
      where: { userId, acknowledgedAt: { gte: start } },
      select: { acknowledgedAt: true },
    }),
    prisma.session.findFirst({
      where: { userId, endedAt: { not: null }, OR: [{ startedAt: { gt: start } }, { endedAt: { gt: start } }] },
      select: { startedAt: true, endedAt: true },
    }),
  ]);
  return answeredSince(start, tap?.acknowledgedAt ?? null, study);
}

/**
 * Cancel escalation chain for a user (e.g., user resumed studying).
 */
export async function cancelEscalation(userId: string): Promise<number> {
  const result = await prisma.escalationEvent.updateMany({
    where: {
      userId,
      status: { in: ["PENDING", "ESCALATING"] },
    },
    data: { status: "COMPLETED" },
  });
  return result.count;
}

/**
 * Detect users with missed sessions who need escalation.
 */
export async function detectMissedSessions(): Promise<string[]> {
  // Guard: never start NEW chains unless explicitly enabled (prevents the
  // dormant-ladder activation from erupting). advancePendingEscalations still
  // runs separately to advance any already-started chains.
  if (!escalationDetectionEnabled()) return [];

  const now = new Date();
  const { inactiveBefore, lapsedAfter } = escalationDetectionWindow(now);
  const cooldownStart = escalationCooldownStart(now);

  // Find STUDENT users who lapsed recently (inactive ≥24h, but not dormant
  // longer than the recency window) and are NOT already in / just out of a
  // chain. Capped per run to bound the blast radius on the first/large run.
  const inactiveUsers = await prisma.user.findMany({
    where: {
      enrollments: {
        some: {
          isActive: true,
          roles: { has: "STUDENT" },
        },
      },
      // Recently lapsed: 24h+ idle but within the recency window.
      gamification: {
        some: {
          lastActivityDate: {
            lt: inactiveBefore,
            gte: lapsedAfter,
          },
        },
      },
      // No active chain AND no recent chain within the cooldown — otherwise a
      // just-finished chain (all events COMPLETED → "no active") would be
      // re-started every run.
      escalationEvents: {
        none: {
          OR: [
            { status: { in: ["PENDING", "ESCALATING"] } },
            { createdAt: { gte: cooldownStart } },
          ],
        },
      },
    },
    select: { id: true },
    take: escalationMaxNewPerRun(),
  });

  const onBreak = await userIdsOnBreak(now);
  // Zile fără program (weekend / nimic programat): nu deschidem lanț nou — altfel
  // nudge-urile devin spam și copilul + părintele se desensibilizează.
  const scheduledToday = await scheduledTodayFilter(
    inactiveUsers.map((u) => u.id),
    now
  );
  const userIds: string[] = [];
  const paused = await pausedUserIds(inactiveUsers.map((u) => u.id), now);

  for (const user of inactiveUsers) {
    if (onBreak.has(user.id)) continue; // vacanță: nu deschidem lanț nou
    if (paused.has(user.id)) continue; // cont în pauză: nimic nou
    if (!scheduledToday.has(user.id)) continue; // zi fără program: nu deschidem lanț nou
    await startEscalation({
      userId: user.id,
      reason: "missed_session",
      metadata: { detectedAt: now.toISOString() },
    });
    userIds.push(user.id);
  }

  return userIds;
}

/**
 * One short, POSITIVE line for the gentle rungs (Telegram). Romanian.
 *
 * Replaces the old `generateUserStats`, whose own docstring said it produced the
 * "L3 WhatsApp pressure message" — an English blob of "0 sessions this week |
 * streak lost | N reminders sent". It had drifted onto the TELEGRAM rung, i.e. the
 * FIRST and gentlest nudge, so a child got a guilt-trip instead of a reminder. Two
 * of its numbers had no business reaching a student at all: `reminders sent` counts
 * how many times we nagged him (our metric, not his progress), and the gamification
 * LEVEL name read as if he were an instructor.
 *
 * (WhatsApp never consumed this — it sends the Meta-approved `study_reminder`
 * template in `ro`. The docstring was stale, not the routing.)
 *
 * Returns null when there is nothing encouraging to say. A broken streak stays
 * SILENT on purpose: "streak lost" on a reminder is discouragement, and the point
 * of this rung is to get the child to start, not to score him.
 */
export function encouragementFor(streak: number): string | null {
  if (!Number.isFinite(streak) || streak <= 0) return null;
  if (streak === 1) return "🔥 Prima zi din serie — hai să facem a doua.";
  return `🔥 ${streak} zile la rând — nu rupe seria azi.`;
}

async function studentEncouragement(userId: string): Promise<string | null> {
  const gamification = await prisma.userGamification.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return encouragementFor(gamification?.streak ?? 0);
}

function getEscalationTitle(level: number): string {
  const titles: Record<number, string> = {
    1: "Time to study!",
    2: "Friendly reminder",
    3: "Your progress is at risk",
    4: "We miss you!",
    5: "Instructor notified",
    6: "Instructor will reach out",
  };
  return titles[level] ?? "Study reminder";
}

function getEscalationMessage(level: number, reason?: string): string {
  const messages: Record<number, string> = {
    1: "You have a study session waiting. Keep your streak alive!",
    2: "Hey! You haven't studied today. A quick session can make a big difference.",
    3: "Your learning progress is slowing down. Your streak is at risk!",
    4: "It's been a while since your last session. Let's get back on track!",
    5: "Your instructor has been notified about your absence.",
    6: "Your instructor will reach out to help you get back on track.",
  };
  return messages[level] ?? reason ?? "Please resume your studies.";
}
