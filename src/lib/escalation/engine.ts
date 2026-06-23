/**
 * Escalation Engine
 *
 * State machine: PENDING → ESCALATING → COMPLETED
 * 6 levels: L1 Push → L2 WhatsApp friendly → L3 WhatsApp pressure →
 *           L4 SMS → L5 Email instructor → L6 Call trigger
 */

import { shouldEscalate, nextStep, resolveGraceMs } from "@aledan/notify-ladder";
import { prisma } from "@/lib/prisma";
import { ESCALATION_LEVELS } from "./config";
import { isQuietHours, isOptimalNotificationTime } from "./timing";
import { sendNotification } from "@/lib/notifications/service";
import { resolveIsTest, resolveIsTestForUser } from "@/lib/notifications/test-account";
import {
  ESCALATION_LADDER,
  isPaidChannelDeliverable,
  isPaidSubscriber,
} from "./segmentation";

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

  const level = ESCALATION_LEVELS[0];
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
  const event = await prisma.escalationEvent.findUnique({
    where: { id: eventId },
    include: {
      user: {
        include: { notificationPreference: true },
      },
    },
  });

  if (!event || event.status === "COMPLETED") return;

  const prefs = event.user.notificationPreference;
  const timezone = prefs?.timezone ?? "Europe/Bucharest";
  const quietStart = prefs?.quietHoursStart ?? "22:00";
  const quietEnd = prefs?.quietHoursEnd ?? "07:00";

  // Check quiet hours (skip for L1 push — always instant)
  if (event.level > 1 && isQuietHours(timezone, quietStart, quietEnd)) {
    // Defer — will be picked up by next cron run after quiet hours
    return;
  }

  // For L2+ non-urgent levels, prefer sending during user's study time
  if (event.level >= 2 && event.level <= 3) {
    const isOptimal = await isOptimalNotificationTime(event.userId, timezone);
    // If not optimal time, defer once (but don't block indefinitely)
    if (!isOptimal && !((event.metadata as Record<string, unknown>)?.deferredOnce)) {
      await prisma.escalationEvent.update({
        where: { id: event.id },
        data: {
          metadata: {
            ...((event.metadata as Record<string, unknown>) ?? {}),
            deferredOnce: true,
          },
        },
      });
      return;
    }
  }

  // Check channel preference
  const channelKey = event.channel.toLowerCase() as keyof typeof channelMap;
  const channelMap = {
    push: prefs?.push ?? true,
    whatsapp: prefs?.whatsapp ?? true,
    sms: prefs?.sms ?? true,
    email: prefs?.email ?? true,
    call: prefs?.call ?? true,
  };

  if (!channelMap[channelKey]) {
    // User disabled this channel — skip to next level
    await escalateToNextLevel(event.id, event.level);
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
    const deliverable = isPaidChannelDeliverable(event.channel, {
      telegramLinked: Boolean(event.user.telegramChatId),
      telegramEnabled:
        process.env.FEATURE_TELEGRAM_NUDGES === "true" &&
        Boolean(process.env.TELEGRAM_BOT_TOKEN),
      whatsappConfigured: Boolean(
        process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
      ),
      smsConfigured: Boolean(
        process.env.SMSLINK_CONNECTION_ID && process.env.SMSLINK_PASSWORD
      ),
      emailConfigured: Boolean(process.env.AUTH_RESEND_KEY || process.env.SMTP_HOST),
    });
    if (!deliverable) {
      await escalateToNextLevel(event.id, event.level);
      return;
    }
  }

  // WhatsApp is PREMIUM-ONLY. A free (non-trialing) student's chain ends after
  // email — no paid WhatsApp. Test accounts are exempt (journey-audit), and a
  // parent-authorized extra cascade may use WhatsApp regardless of plan.
  const parentAuthorized =
    (event.metadata as Record<string, unknown> | null)?.parentAuthorized === true;
  if (
    event.channel === "WHATSAPP" &&
    !isPaidSubscriber(event.user) &&
    !event.isTest &&
    !parentAuthorized
  ) {
    await prisma.escalationEvent.update({
      where: { id: event.id },
      data: { status: "COMPLETED" },
    });
    return;
  }

  const sendTemplateId = event.templateId ?? "";

  // Check SMS daily limit
  if (event.channel === "SMS") {
    const levelConfig = ESCALATION_LEVELS.find((l) => l.level === event.level);
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
        await escalateToNextLevel(event.id, event.level);
        return;
      }
    }
  }

  // Mark as ESCALATING
  await prisma.escalationEvent.update({
    where: { id: event.id },
    data: { status: "ESCALATING" },
  });

  // Telegram nudge can carry a short progress line (streak/XP at risk).
  const metadata = (event.metadata as Record<string, unknown>) ?? {};
  if (event.channel === "TELEGRAM") {
    const stats = await generateUserStats(event.userId);
    metadata.stats = stats;
  }

  // Send notification
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
    },
  });

  if (success) {
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
    // Failed — revert to PENDING for retry
    await prisma.escalationEvent.update({
      where: { id: event.id },
      data: { status: "PENDING" },
    });
  }
}

/**
 * Escalate to next level by creating a new event.
 */
async function escalateToNextLevel(
  currentEventId: string,
  currentLevel: number
): Promise<void> {
  const current = await prisma.escalationEvent.findUnique({
    where: { id: currentEventId },
  });
  if (!current) return;

  // Mark current as completed (skipped)
  await prisma.escalationEvent.update({
    where: { id: currentEventId },
    data: { status: "COMPLETED" },
  });

  const nextLevelConfig = ESCALATION_LEVELS.find(
    (l) => l.level === currentLevel + 1
  );
  if (!nextLevelConfig) return; // No more levels

  await prisma.escalationEvent.create({
    data: {
      userId: current.userId,
      isTest: await resolveIsTestForUser(current.userId),
      sessionId: current.sessionId,
      level: nextLevelConfig.level,
      status: "PENDING",
      channel: nextLevelConfig.channel,
      templateId: nextLevelConfig.templateId,
      metadata: current.metadata ?? undefined,
    },
  });
}

/**
 * Check for pending escalations that need advancement.
 * Called by cron — finds COMPLETED events whose next level delay has passed.
 */
export async function advancePendingEscalations(): Promise<number> {
  // Find users with active escalation chains
  const completedEvents = await prisma.escalationEvent.findMany({
    where: {
      status: "COMPLETED",
      sentAt: { not: null },
      level: { lt: 6 },
    },
    orderBy: { sentAt: "desc" },
    include: { user: true },
  });

  let advanced = 0;

  for (const event of completedEvents) {
    // Check if user has resumed activity (completed a session since escalation)
    const recentSession = await prisma.session.findFirst({
      where: {
        userId: event.userId,
        endedAt: { not: null },
        startedAt: { gt: event.createdAt },
      },
    });

    // Push-first cost gate via @aledan/notify-ladder: escalate to the next
    // (paid) rung only when the user neither tapped the push (acknowledged) nor
    // resumed studying (a completed session = the domain "done" signal). When
    // either gate passes the chain stops here — the next level is only ever
    // created from this event.
    if (
      !shouldEscalate({
        acknowledged: !!event.acknowledgedAt,
        actionDone: !!recentSession,
      })
    ) {
      continue;
    }

    // Check if next level already exists
    const nextLevel = event.level + 1;
    const existingNext = await prisma.escalationEvent.findFirst({
      where: {
        userId: event.userId,
        level: nextLevel,
        createdAt: { gt: event.createdAt },
      },
    });

    if (existingNext) continue;

    // Resolve the next rung + its grace from the shared ladder. currentIndex is
    // 0-based (level - 1); resolveGraceMs(currentIndex) = wait after this step
    // before escalating to the next.
    const currentIndex = event.level - 1;
    if (!nextStep(ESCALATION_LADDER, currentIndex)) continue; // terminal rung
    const nextConfig = ESCALATION_LEVELS[currentIndex + 1];
    if (!nextConfig) continue;

    const messageType =
      ((event.metadata as Record<string, unknown> | null)?.reason as string) ??
      "missed_session";
    const grace = resolveGraceMs(ESCALATION_LADDER, currentIndex, messageType);
    if (grace == null) continue;
    if (Date.now() - event.sentAt!.getTime() < grace) continue;

    // Create next level event
    await prisma.escalationEvent.create({
      data: {
        userId: event.userId,
        // event.user already loaded via include above — avoid an N+1 lookup in this loop.
        isTest: resolveIsTest(event.user.email),
        sessionId: event.sessionId,
        level: nextConfig.level,
        status: "PENDING",
        channel: nextConfig.channel,
        templateId: nextConfig.templateId,
        metadata: event.metadata ?? undefined,
      },
    });

    advanced++;
  }

  // Process all pending events
  const pending = await prisma.escalationEvent.findMany({
    where: { status: "PENDING" },
  });

  for (const p of pending) {
    await processEscalationEvent(p.id);
  }

  return advanced;
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

  const userIds: string[] = [];

  for (const user of inactiveUsers) {
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
 * Generate student stats for L3 WhatsApp pressure message.
 * Includes weekly progress, missed sessions count, streak status.
 */
async function generateUserStats(userId: string): Promise<string> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [weekSessions, gamification, recentEscalations] = await Promise.all([
    prisma.session.count({
      where: {
        userId,
        startedAt: { gte: oneWeekAgo },
        endedAt: { not: null },
      },
    }),
    prisma.userGamification.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.escalationEvent.count({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
        status: "COMPLETED",
        sentAt: { not: null },
      },
    }),
  ]);

  const streak = gamification?.streak ?? 0;
  const xp = gamification?.xp ?? 0;
  const level = gamification?.level ?? "Cadet";

  const parts: string[] = [];

  if (weekSessions === 0) {
    parts.push("0 sessions this week");
  } else {
    parts.push(`${weekSessions} session${weekSessions > 1 ? "s" : ""} this week`);
  }

  if (streak === 0) {
    parts.push("streak lost");
  } else {
    parts.push(`${streak}-day streak at risk`);
  }

  parts.push(`${xp} XP (${level})`);

  if (recentEscalations > 1) {
    parts.push(`${recentEscalations} reminders sent`);
  }

  return parts.join(" | ");
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
