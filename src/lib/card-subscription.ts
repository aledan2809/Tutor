/**
 * Whether an account pays a subscription by card right now (Stripe, through the broker). A second
 * package bought on top of it starts a second Stripe subscription — the broker can't switch a
 * subscription's plan, and the first one isn't stopped — and a 100% code applied over it would
 * replace the plan the card keeps paying for.
 */
import { prisma } from "@/lib/prisma";
import { payingForAccess } from "@/lib/access";

export type CardPayerFields = {
  id: string;
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
  stripeSubscriptionId: string | null;
};

/**
 * Pure: the account's access has the shape a Stripe subscription gives it — paid with no end date
 * (the callback clears it on every payment), or retrying a declined renewal. A year from a 100% code
 * is paid too, but carries its end date.
 */
export function cardShaped(u: Pick<CardPayerFields, "subscriptionStatus" | "subscriptionEndsAt">): boolean {
  if (!payingForAccess(u)) return false;
  return u.subscriptionStatus === "past_due" || u.subscriptionEndsAt === null;
}

/**
 * Card-shaped access with Stripe behind it: the subscription id stored by the broker callback, or —
 * for accounts that paid before the id was stored — their checkout payment. An account marked paid by
 * hand has neither.
 */
export async function paysByCard(user: CardPayerFields, db: Pick<typeof prisma, "payment"> = prisma): Promise<boolean> {
  if (!cardShaped(user)) return false;
  if (user.stripeSubscriptionId) return true;
  return (await db.payment.count({ where: { userId: user.id, stripeSessionId: { not: null } } })) > 0;
}

/**
 * Pure: does a renewal, a declined payment or a cancellation belong to the subscription the account
 * has now? One that isn't (an old subscription left running after a new checkout) must not change
 * the account — its end would pause a family that pays the new one. Unknown on either side (an
 * account from before the id was stored, an older broker) counts as the account's own.
 */
export function eventIsForCurrentSubscription(stored: string | null | undefined, incoming: string | null | undefined): boolean {
  return !stored || !incoming || stored === incoming;
}
