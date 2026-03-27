/**
 * Escalation Engine
 *
 * State machine: PENDING → ESCALATING → COMPLETED
 * 6 levels: L1 Push → L2 WhatsApp friendly → L3 WhatsApp pressure →
 *           L4 SMS → L5 Email instructor → L6 Call trigger
 */

import { prisma } from "@/lib/prisma";
import { ESCALATION_LEVELS } from "./config";
import { isQuietHours } from "./timing";
import { sendNotification } from "@/lib/notifications/service";

interface EscalationContext {
  userId: string;
  sessionId?: string;
  reason: string;
  metadata?: Record<string, unknown>;
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

  // Send notification
  const metadata = (event.metadata as Record<string, unknown>) ?? {};
  const success = await sendNotification({
    userId: event.userId,
    channel: event.channel,
    templateId: event.templateId ?? "",
    metadata: {
      ...metadata,
      userName: event.user.name ?? "Student",
      userEmail: event.user.email ?? "",
      level: event.level,
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

    if (recentSession) {
      // User is active — no further escalation needed
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

    // Check if delay has passed
    const nextConfig = ESCALATION_LEVELS.find((l) => l.level === nextLevel);
    if (!nextConfig) continue;

    const sentAt = event.sentAt!;
    const delayMs = nextConfig.delayMinutes * 60 * 1000;
    if (Date.now() - sentAt.getTime() < delayMs) continue;

    // Create next level event
    await prisma.escalationEvent.create({
      data: {
        userId: event.userId,
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
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find users with active enrollments who haven't had a session in 24h+
  const inactiveUsers = await prisma.user.findMany({
    where: {
      enrollments: {
        some: {
          isActive: true,
          roles: { has: "STUDENT" },
        },
      },
      // Has gamification (meaning they've been active before)
      gamification: {
        some: {
          lastActivityDate: {
            lt: oneDayAgo,
            not: null,
          },
        },
      },
      // No active escalation
      escalationEvents: {
        none: {
          status: { in: ["PENDING", "ESCALATING"] },
        },
      },
    },
    select: { id: true },
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
