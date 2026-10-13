/**
 * Reads where a card subscription stands from the payment broker (POST /api/subscription, contract v3)
 * when the account's copy is missing or stale: subscriptions bought before v3 have no period stored, and
 * a stop scheduled in the Billing Portal reaches Tutor only if the company's Stripe webhook sends
 * customer.subscription.updated. Called when the payer opens Pachete; bounded by a short timeout and
 * never fails the page.
 */
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { parseBrokerSubscription, periodFieldsFrom } from "@/lib/billing-period";

/** A copy younger than this is used as it is. */
export const SUBSCRIPTION_SYNC_TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 3000;

type SyncFacts = {
  id: string;
  subscriptionStatus: string | null;
  stripeSubscriptionId: string | null;
  subscriptionSyncedAt: Date | null;
};

/** Pure: whether this account's copy should be read again now. */
export function needsSubscriptionSync(u: Omit<SyncFacts, "id">, now: Date = new Date()): boolean {
  if (!u.stripeSubscriptionId) return false;
  if (u.subscriptionStatus !== "active" && u.subscriptionStatus !== "trialing" && u.subscriptionStatus !== "past_due") return false;
  return !u.subscriptionSyncedAt || now.getTime() - u.subscriptionSyncedAt.getTime() > SUBSCRIPTION_SYNC_TTL_MS;
}

/** Read and store; true when the account was updated. */
export async function syncSubscriptionFromBroker(u: SyncFacts, now: Date = new Date()): Promise<boolean> {
  if (!needsSubscriptionSync(u, now)) return false;
  const brokerUrl = process.env.STRIPE_BROKER_URL;
  const projectKey = process.env.STRIPE_BROKER_PROJECT_KEY;
  if (!brokerUrl || !projectKey) return false;
  try {
    const res = await fetch(`${brokerUrl.replace(/\/$/, "")}/api/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Project-Key": projectKey },
      body: JSON.stringify({ subscriptionId: u.stripeSubscriptionId }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      // An older broker (no such route) or an unknown subscription: try again after the TTL, not on every view.
      await prisma.user.updateMany({ where: { id: u.id }, data: { subscriptionSyncedAt: now } });
      return false;
    }
    const sub = parseBrokerSubscription((await res.json().catch(() => null))?.subscription);
    if (!sub) return false;
    // Only while the account still has this subscription (a cancellation may have landed meanwhile).
    const updated = await prisma.user.updateMany({
      where: { id: u.id, stripeSubscriptionId: u.stripeSubscriptionId },
      data: periodFieldsFrom(sub, now),
    });
    return updated.count === 1;
  } catch (err) {
    logger.warn("Subscription period read from the broker failed (non-blocking)", { userId: u.id, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
