/**
 * „Treci pe Family Duo": what the payer is offered when an adult of the family is left out of the
 * package. The payment service cannot change a plan, so the family pays the DIFFERENCE as its own
 * small subscription — together they make exactly the bigger package's price, and its seats
 * (addon-checkout `type: "parent"`, callback `parent_addon`).
 */
import { prisma } from "@/lib/prisma";
import { parentUpgradeOf, resolveFamilyPlanFromRecord } from "@/lib/family";
import { forInterval, parentUpgradeMonthlyMinor, percentOff } from "@/lib/checkout-price";
import { lockedDiscount, monthlyPlanPriceMinor } from "@/lib/checkout-facts";
import { paysByCard } from "@/lib/card-subscription";
import { isPaidSubscriber } from "@/lib/escalation/segmentation";
import { individualPlan } from "@/lib/access";
import { unseatedAdults } from "@/lib/access-server";
import type { getFamilyOverview } from "@/lib/family-invite";

export type ParentUpgradeQuote = {
  /** The package with one more parent (its own label, as the family reads it). */
  planLabel: string;
  /** What the difference costs, in major units (RON), for the interval below. */
  price: number;
  /** The bigger package's price with the family's discount — where the family lands. */
  total: number;
  interval: "MONTH" | "YEAR";
  /** Adults of this family who have no seat and no access of their own, in the order they were linked. */
  leftOut: { id: string; name: string | null }[];
  /** How many more parents the move seats (today: one). */
  seats: number;
};

/**
 * Null whenever there is nothing honest to offer: no family package paid for, no package with more
 * parents, the difference already paid, or no adult actually left out.
 */
export async function parentUpgradeQuote(
  userId: string,
  overview: Awaited<ReturnType<typeof getFamilyOverview>>,
): Promise<ParentUpgradeQuote | null> {
  if (overview.unlimited || overview.trial || overview.paidExtraParentSeats > 0) return null;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      stripeSubscriptionId: true,
      subscriptionPlan: {
        select: { name: true, price: true, interval: true, isActive: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true },
      },
    },
  });
  const plan = u?.subscriptionPlan;
  if (!u || !plan || !plan.isActive || !isPaidSubscriber(u) || individualPlan(plan)) return null;
  const upgrade = parentUpgradeOf(resolveFamilyPlanFromRecord(plan));
  if (!upgrade) return null;
  // Only next to a package paid by card: the difference rides next to it, and the price the family
  // would land on is the one the card is charged — for a free year from a code neither holds.
  if (!(await paysByCard(u))) return null;

  const target = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, interval: "MONTH", familyPlanKey: upgrade.key },
    orderBy: { price: "asc" },
    select: { price: true },
  });
  if (!target) return null;

  const interval = plan.interval === "YEAR" ? "YEAR" : "MONTH";
  const [locked, planMonthly, leftOut] = await Promise.all([lockedDiscount(userId), monthlyPlanPriceMinor(plan), unseatedAdults(userId)]);
  const percent = locked?.percent ?? 0;
  const monthly = parentUpgradeMonthlyMinor(planMonthly, target.price, percent);
  if (monthly <= 0) return null;
  return {
    planLabel: upgrade.label,
    price: forInterval(monthly, interval) / 100,
    // Where the family lands: the bigger package's price with the same discount (the plan it pays
    // plus this difference add up to exactly that).
    total: forInterval(percentOff(target.price, percent), interval) / 100,
    interval,
    leftOut,
    seats: upgrade.maxParents - (resolveFamilyPlanFromRecord(plan)?.maxParents ?? 0),
  };
}
