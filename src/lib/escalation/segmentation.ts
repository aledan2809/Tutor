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
 * Canalele contorizate (WhatsApp, SMS) sunt acoperite pentru omul ăsta — fie prin
 * abonamentul lui individual, fie prin firma care îl înscrie și primește factură
 * separată (B2B).
 *
 * Există ca predicat SEPARAT, nu ca ramură în `isPaidSubscriber`, fiindcă acela
 * răspunde la altceva: „are abonament plătit". Un cursant al Poștei NU are, și n-o
 * să aibă — dar canalele lui sunt plătite. Confundarea celor două întrebări e chiar
 * bug-ul pe care îl repară: poarta de trimitere se uita doar la abonamentul individual.
 */
export function meteredChannelsCovered(u: {
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
  /** Firma căreia îi APARȚINE contul — practic doar administratorii de firmă. */
  organization?: { meteredIncluded: boolean } | null;
  /**
   * Înscrierile ACOPERITE, adică deja filtrate de `SELECT_ACOPERIRE_CANALE`.
   * Orice rând aici înseamnă „e înscris la o materie a unei firme care plătește".
   * Nu trimite lista completă de înscrieri: ar deschide poarta pentru toată lumea.
   */
  enrollments?: { id: string }[] | null;
}): boolean {
  if (u.organization?.meteredIncluded === true) return true;
  if (u.enrollments && u.enrollments.length > 0) return true;
  return isPaidSubscriber(u);
}

/**
 * Ce trebuie citit de pe un utilizator ca să știi cine îi plătește canalele.
 *
 * Există ca o singură constantă fiindcă partea care contează e ușor de scris greșit:
 * legătura cu firma NU e `User.organizationId`. Măsurat pe producție — firma „Poșta
 * Română (demo)" avea 3 materii și ZERO membri: cursanții sunt conturi obișnuite,
 * legate de client prin ÎNSCRIEREA la materia lui. O poartă care s-ar fi uitat doar
 * la apartenența contului ar fi trecut testele și n-ar fi făcut nimic pentru client.
 *
 * `where` de aici nu e decorativ: fără el, `enrollments` ar fi toate înscrierile
 * omului, iar predicatul ar deschide canalele plătite pentru oricine e înscris undeva.
 */
export const SELECT_ACOPERIRE_CANALE_RELATII = {
  organization: { select: { meteredIncluded: true } },
  enrollments: {
    where: { isActive: true, domain: { organization: { meteredIncluded: true } } },
    select: { id: true },
    take: 1,
  },
} as const;

/** Același lucru, plus scalarii de abonament, pentru un `select` complet. */
export const SELECT_ACOPERIRE_CANALE = {
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  ...SELECT_ACOPERIRE_CANALE_RELATII,
} as const;

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
    emailConfigured: boolean;
  }
): boolean {
  if (channel === "TELEGRAM") return ctx.telegramEnabled && ctx.telegramLinked;
  if (channel === "WHATSAPP") return ctx.whatsappConfigured;
  if (channel === "SMS") return ctx.smsConfigured;
  if (channel === "EMAIL") return ctx.emailConfigured;
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
