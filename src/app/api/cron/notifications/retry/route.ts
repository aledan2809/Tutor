import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications/service";
import { withErrorHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

const RETRY_DELAYS_MS = [60_000, 300_000, 600_000]; // 1m, 5m, 10m
const BATCH_LIMIT = 100;

/**
 * POST /api/cron/notifications/retry — Retry failed notifications
 *
 * Protected by CRON_SECRET header.
 * Processes NotificationRetry records that are PENDING and past their nextRetryAt.
 * Uses exponential backoff (1m, 5m, 10m), max 3 attempts.
 */
async function _POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret) {
    logger.error("CRON_SECRET not configured");
    return NextResponse.json(
      { error: { code: "SERVER_CONFIG_ERROR", message: "CRON_SECRET not configured" } },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const now = new Date();
  let retried = 0;
  let succeeded = 0;
  let exhausted = 0;

  // Find PENDING retries that are past their nextRetryAt
  const pendingRetries = await prisma.notificationRetry.findMany({
    where: {
      status: "PENDING",
      nextRetryAt: { lte: now },
    },
    include: { user: true },
    take: BATCH_LIMIT,
    orderBy: { nextRetryAt: "asc" },
  });

  for (const retry of pendingRetries) {
    const payload = retry.payload as Record<string, unknown>;
    const newAttemptCount = retry.attemptCount + 1;

    const success = await sendNotification({
      userId: retry.userId,
      channel: (payload.channel as string) as "PUSH" | "WHATSAPP" | "SMS" | "EMAIL" | "CALL",
      templateId: (payload.templateId as string) ?? "",
      metadata: {
        ...(payload.metadata as Record<string, unknown> ?? {}),
        userName: retry.user.name ?? "Student",
        retryAttempt: newAttemptCount,
      },
    });

    if (success) {
      await prisma.notificationRetry.update({
        where: { id: retry.id },
        data: {
          status: "SUCCESS",
          attemptCount: newAttemptCount,
        },
      });
      succeeded++;
    } else if (newAttemptCount >= retry.maxAttempts) {
      await prisma.notificationRetry.update({
        where: { id: retry.id },
        data: {
          status: "EXHAUSTED",
          attemptCount: newAttemptCount,
          lastError: "Max retry attempts reached",
        },
      });
      exhausted++;
    } else {
      const delayMs = RETRY_DELAYS_MS[Math.min(newAttemptCount - 1, RETRY_DELAYS_MS.length - 1)];
      await prisma.notificationRetry.update({
        where: { id: retry.id },
        data: {
          attemptCount: newAttemptCount,
          nextRetryAt: new Date(now.getTime() + delayMs),
          lastError: `Attempt ${newAttemptCount} failed`,
        },
      });
    }
    retried++;
  }

  // Also handle stuck ESCALATING events (>5 min without completion)
  const stuckThreshold = new Date(now.getTime() - 5 * 60 * 1000);
  const stuckEvents = await prisma.escalationEvent.findMany({
    where: {
      status: "ESCALATING",
      updatedAt: { lt: stuckThreshold },
    },
    take: BATCH_LIMIT,
  });

  let stuckReset = 0;
  for (const event of stuckEvents) {
    const meta = (event.metadata as Record<string, unknown>) ?? {};
    const retryCount = (meta.retryCount as number) ?? 0;

    if (retryCount >= 3) {
      await prisma.escalationEvent.update({
        where: { id: event.id },
        data: {
          status: "COMPLETED",
          metadata: { ...meta, retryExhausted: true, lastRetryAt: now.toISOString() },
        },
      });
    } else {
      await prisma.escalationEvent.update({
        where: { id: event.id },
        data: {
          status: "PENDING",
          metadata: { ...meta, retryCount: retryCount + 1, lastRetryAt: now.toISOString() },
        },
      });
    }
    stuckReset++;
  }

  logger.info("Notification retry cron completed", {
    retried: retried as unknown as string,
    succeeded: succeeded as unknown as string,
    exhausted: exhausted as unknown as string,
    stuckReset: stuckReset as unknown as string,
  });

  return NextResponse.json({
    success: true,
    retried,
    succeeded,
    exhausted,
    stuckReset,
    timestamp: now.toISOString(),
  });
}

export const POST = withErrorHandler(_POST);
