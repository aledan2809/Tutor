/**
 * Free-vs-paid funnel segmentation for the escalation ladder.
 *
 * Product decision (re-engagement funnel, 2026-06-11): a FREE inactive learner
 * gets free nudges (push / Telegram / in-app) plus at most `WHATSAPP_FREE_CAP`
 * paid WhatsApp touches — the first three mimic the paid experience, the fourth
 * is an upgrade CTA, and beyond that the chain stops. A PAID (or trialing)
 * subscriber gets the full ladder. Instructor-facing rungs (SMS / email / call)
 * are reserved for subscribers until the own-number SMS gateway lands (funnel
 * item 3).
 *
 * These helpers are pure so the decision logic is unit-testable without a DB.
 */

import type { LadderConfig, LadderStep } from "@aledan/notify-ladder";
import type { EscalationChannel } from "@prisma/client";
import { ESCALATION_LEVELS } from "./config";

/** Max paid WhatsApp touches a free user receives before the upgrade wall. */
export const WHATSAPP_FREE_CAP = 4;

/** templateId for the final (capped) WhatsApp touch — the upgrade CTA. */
export const WHATSAPP_UPGRADE_TEMPLATE = "whatsapp_upgrade_cta";

/** Deep-link target for the upgrade CTA (locale middleware resolves the prefix). */
export const UPGRADE_PATH = "/preturi";

/**
 * A subscriber gets the full experience. "trialing" counts as paid (they're
 * actively experiencing the paid tier). An expired `subscriptionEndsAt` demotes
 * the user to free even if the status string still says active.
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

export type WhatsAppDecision =
  | { action: "send"; templateId: string } // normal paid touch (1..cap-1)
  | { action: "upgrade"; templateId: string } // final touch = upgrade CTA
  | { action: "suppress" }; // past the cap → no more paid WhatsApp

/**
 * Decide how to handle a WhatsApp touch for a FREE user given how many paid
 * WhatsApp touches they've already received (`priorTouches` = completed,
 * actually-sent, non-test WhatsApp escalations).
 */
export function decideWhatsAppForFreeUser(
  priorTouches: number,
  defaultTemplateId: string
): WhatsAppDecision {
  if (priorTouches >= WHATSAPP_FREE_CAP) return { action: "suppress" };
  if (priorTouches === WHATSAPP_FREE_CAP - 1) {
    return { action: "upgrade", templateId: WHATSAPP_UPGRADE_TEMPLATE };
  }
  return { action: "send", templateId: defaultTemplateId };
}

// notify-ladder's LadderStep.channel union has no "call"; CALL maps to "email"
// purely to satisfy the type. The ladder config is used ONLY for the decision
// primitives (shouldEscalate / nextStep / resolveGraceMs) — the REAL channel +
// template for each rung always come from ESCALATION_LEVELS, never from here.
const LADDER_CHANNEL: Record<EscalationChannel, LadderStep["channel"]> = {
  PUSH: "push",
  WHATSAPP: "whatsapp",
  SMS: "sms",
  EMAIL: "email",
  CALL: "email",
};

/**
 * The escalation ladder expressed for `@aledan/notify-ladder`. Each step's
 * `graceMs` is the wait AFTER that step before escalating to the next rung —
 * i.e. the *next* level's `delayMinutes` (Tutor encodes delay as "before this
 * level"; notify-ladder encodes grace as "after this step"). The last step has
 * no successor → grace 0.
 */
export const ESCALATION_LADDER: LadderConfig = {
  steps: ESCALATION_LEVELS.map((l, i) => ({
    channel: LADDER_CHANNEL[l.channel],
    graceMs: (ESCALATION_LEVELS[i + 1]?.delayMinutes ?? 0) * 60_000,
  })),
};
