/**
 * What the payer is told about their card, at once, from the broker callback (api/stripe/callback):
 *  - the bank declined a renewal → the account (and the children it covers) is paused until the
 *    payment goes through — no grace (Alex, 13.10.2026);
 *  - a payment arrived for a subscription that had already ended → it buys one period, with an end
 *    date, and the payer is asked to choose a package for what comes after.
 *
 * In-app notification + email (none to test accounts). Pure copy lives here too, so it can be read
 * in one place; the sends never throw into the callback.
 */
import { prisma } from "@/lib/prisma";
import { sendAppEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import { fmtPrice } from "@/lib/pricing";
import { payingForAccess } from "@/lib/access";
import { billingIntervalOf, paidPeriodEnd } from "@/lib/billing-period";
import { resolveIsTest } from "@/lib/notifications/test-account";

export const BILLING_TYPE = {
  paymentFailed: "billing_payment_failed",
  latePayment: "billing_late_payment",
} as const;

const PACKAGES_PATH = "/ro/dashboard/packages";
const DATE_RO = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long" });

function baseUrl(): string {
  return (process.env.AUTH_URL || "https://etutor.ro").replace(/\/$/, "");
}

/** „Andrei”, „Andrei și Maria”, „Andrei, Maria și Ioana”. */
export function namesRo(names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} și ${clean[clean.length - 1]}`;
}

export function paymentFailedCopy(children: string[]): { title: string; message: string; button: string } {
  const kids = namesRo(children);
  return {
    title: "Plata abonamentului n-a trecut",
    message:
      `Banca n-a acceptat plata pentru pachetul tău. Până trece plata, contul e în pauză${kids ? ` — și al ${children.length > 1 ? "copiilor" : "copilului"} (${kids})` : ""}: fără exerciții, alerte sau rapoarte. ` +
      "Tot ce s-a lucrat rămâne salvat. Actualizează cardul din Pachete → „Gestionează abonamentul”; accesul revine imediat ce plata reușește.",
    button: "Actualizează cardul",
  };
}

export function latePaymentCopy(amountLei: number, until: Date): { title: string; message: string; button: string } {
  return {
    title: "Am primit plata ta",
    message:
      `Am primit ${fmtPrice(amountLei, "ro")} lei pentru un abonament care fusese oprit. Ai acces până pe ${DATE_RO.format(until)}. ` +
      "Ca să continue după aceea, alege pachetul din Pachete — nu se mai încasează nimic de la sine.",
    button: "Vezi pachetele",
  };
}

async function tell(userId: string, type: string, copy: { title: string; message: string; button: string }, metadata: Record<string, unknown>) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  await prisma.notification.create({ data: { userId, type, title: copy.title, message: copy.message, metadata: { ...metadata, url: PACKAGES_PATH } } });
  if (!user?.email || resolveIsTest(user.email)) return;
  const link = `${baseUrl()}${PACKAGES_PATH}`;
  const html =
    `<p>Bună${user.name ? `, ${escapeHtml(user.name.trim().slice(0, 80))}` : ""}!</p>` +
    `<p>${escapeHtml(copy.message)}</p>` +
    `<p><a href="${escapeHtml(link)}">${escapeHtml(copy.button)}</a></p>` +
    `<p style="color:#888;font-size:12px">eTutor.ro</p>`;
  const sent = await sendAppEmail({ to: user.email, subject: copy.title, html });
  if (!sent) logger.warn("Billing message not accepted by any transport", { userId, type });
}

/** The bank declined the renewal: the payer is told now, once per failure (the caller checks the status change). */
export async function notifyPaymentFailed(userId: string): Promise<void> {
  try {
    const links = await prisma.guardian.findMany({
      where: { parentId: userId, status: "active", relation: "PARENT" },
      select: { child: { select: { name: true } } },
    });
    await tell(userId, BILLING_TYPE.paymentFailed, paymentFailedCopy(links.map((l) => l.child.name ?? "")), {});
  } catch (err) {
    logger.error("Payment-failed message failed", err, { userId });
  }
}

/**
 * A payment for a subscription the account no longer has, when the account pays nothing else now:
 * one period of access from today, with an end date (a new checkout gives a subscription proper).
 * Nothing when the account is paying (an old subscription left running next to a new one — logged
 * by the caller) or when no money came with the event.
 */
export async function grantLatePaidPeriod(input: {
  userId: string;
  planId?: string | null;
  interval?: unknown;
  amountMinor: number;
  now?: Date;
}): Promise<{ granted: boolean; until?: Date }> {
  if (!(input.amountMinor > 0)) return { granted: false };
  const now = input.now ?? new Date();
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { subscriptionStatus: true, subscriptionEndsAt: true, subscriptionPlanId: true },
  });
  if (!user || payingForAccess(user)) return { granted: false };
  const until = paidPeriodEnd(now, billingIntervalOf(input.interval));
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      subscriptionStatus: "active",
      subscriptionEndsAt: until,
      ...(input.planId ? { subscriptionPlanId: input.planId } : {}),
    },
  });
  try {
    await tell(input.userId, BILLING_TYPE.latePayment, latePaymentCopy(input.amountMinor / 100, until), { until: until.toISOString() });
  } catch (err) {
    logger.error("Late-payment message failed", err, { userId: input.userId });
  }
  return { granted: true, until };
}
