/**
 * Free-vs-paid funnel segmentation for the escalation cascade.
 *
 * Cascade (2026 funnel): App push → Telegram (if linked) → student email →
 * WhatsApp. WhatsApp is PREMIUM-ONLY — free users' chain ends after email.
 * Grace between steps is short in the morning window and relaxed in the evening
 * (scheduled reminders set the window via messageType).
 *
 * These helpers are pure so the decision logic is unit-testable without a DB.
 */

import type { LadderConfig, LadderStep } from "@aledan/notify-ladder";
import type { EscalationChannel } from "@prisma/client";
import { ESCALATION_LEVELS, CASCADE_GRACE_MINUTES } from "./config";

/**
 * A subscriber gets the paid channels (incl. WhatsApp). "trialing" counts as
 * paid. An expired `subscriptionEndsAt` demotes to free even if status says
 * active.
 */
export function isPaidSubscriber(u: {
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
}): boolean {
  if (u.subscriptionStatus !== "active" && u.subscriptionStatus !== "trialing") {
    return false;
  }
  if (u.subscriptionEndsAt && u.subscriptionEndsAt.getTime() < Date.now()) {
    return false;
  }
  return true;
}

/**
 * Whether a channel can actually deliver right now. Telegram needs a linked +
 * enabled chat; WhatsApp needs config; SMS needs its gateway. PUSH/EMAIL are
 * always deliverable (in-app / SMTP best-effort). The engine skips a rung that
 * can't deliver so the event doesn't retry forever.
 */
export function isPaidChannelDeliverable(
  channel: EscalationChannel,
  ctx: {
    telegramLinked: boolean;
    telegramEnabled: boolean;
    whatsappConfigured: boolean;
    smsConfigured: boolean;
  }
): boolean {
  if (channel === "TELEGRAM") return ctx.telegramEnabled && ctx.telegramLinked;
  if (channel === "WHATSAPP") return ctx.whatsappConfigured;
  if (channel === "SMS") return ctx.smsConfigured;
  return true;
}

export type CascadeWindow = keyof typeof CASCADE_GRACE_MINUTES;

/** Resolve the time-window from a reminder messageType (reason). */
export function resolveCascadeWindow(messageType: string | undefined): CascadeWindow {
  if (messageType?.startsWith("morning")) return "morning";
  if (messageType?.startsWith("evening")) return "evening";
  return "default";
}

// notify-ladder's LadderStep.channel union has no "telegram"/"call"; those map
// to free-ish stand-ins purely to satisfy the type. The ladder config drives
// ONLY the decision primitives (shouldEscalate / nextStep / resolveGraceMs) —
// the REAL channel + template for each rung always come from ESCALATION_LEVELS.
const LADDER_CHANNEL: Record<EscalationChannel, LadderStep["channel"]> = {
  PUSH: "push",
  TELEGRAM: "push",
  WHATSAPP: "whatsapp",
  SMS: "sms",
  EMAIL: "email",
  CALL: "email",
};

/**
 * The escalation cascade expressed for `@aledan/notify-ladder`. Grace is
 * resolved per time-window via `graceMsFor` (fast morning / slow evening), so
 * scheduled reminders escalate at the right pace for their window.
 */
export const ESCALATION_LADDER: LadderConfig = {
  steps: ESCALATION_LEVELS.map((l, i) => ({
    channel: LADDER_CHANNEL[l.channel],
    graceMs: (ESCALATION_LEVELS[i + 1]?.delayMinutes ?? 0) * 60_000,
  })),
  graceMsFor: (_step, messageType) =>
    CASCADE_GRACE_MINUTES[resolveCascadeWindow(messageType)] * 60_000,
};
