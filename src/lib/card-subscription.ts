/**
 * Whether an account pays a subscription by card right now (Stripe, through the broker). A second
 * package bought on top of it starts a second Stripe subscription — the broker can't switch a
 * subscription's plan, and the first one isn't stopped — and a 100% code applied over it would
 * replace the plan the card keeps paying for.
 */
import { randomUUID } from "crypto";
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

/** Setting key: the Stripe subscriptions this account has seen cancelled (a list of ids). */
export const ENDED_SUBSCRIPTIONS_KEY = "stripeEndedSubscriptions";

/**
 * Pure: has the account already seen this subscription end? A cancellation is final — Stripe neither
 * renews nor retries a deleted subscription — so anything arriving for it later is late. The account
 * row alone can't tell: the cancellation clears the stored id, and a year from a 100% code then makes
 * the account look active again (review r6, P1).
 */
export function subscriptionEnded(endedIds: unknown, incoming: string | null | undefined): boolean {
  return Boolean(incoming) && Array.isArray(endedIds) && endedIds.includes(incoming);
}

/** The subscriptions this account has seen cancelled. */
export async function endedSubscriptionIds(userId: string, db: Pick<typeof prisma, "setting"> = prisma): Promise<unknown> {
  const row = await db.setting.findUnique({
    where: { userId_key: { userId, key: ENDED_SUBSCRIPTIONS_KEY } },
    select: { value: true },
  });
  return row?.value ?? [];
}

/** Remember a cancelled subscription. One statement, so two cancellations at once both land. */
export async function recordEndedSubscription(userId: string, subscriptionId: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "Setting" ("id", "userId", "key", "value", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${ENDED_SUBSCRIPTIONS_KEY}, jsonb_build_array(${subscriptionId}::text), NOW(), NOW())
    ON CONFLICT ("userId", "key") DO UPDATE
    SET "value" = CASE
          WHEN jsonb_typeof("Setting"."value") = 'array' AND "Setting"."value" @> jsonb_build_array(${subscriptionId}::text) THEN "Setting"."value"
          WHEN jsonb_typeof("Setting"."value") = 'array' THEN "Setting"."value" || jsonb_build_array(${subscriptionId}::text)
          ELSE jsonb_build_array(${subscriptionId}::text)
        END,
        "updatedAt" = NOW()`;
}
