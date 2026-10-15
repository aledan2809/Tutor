/**
 * The child left without a seat after the family pays (/bani, 15.10.2026). The 7-day trial opens every
 * child; Family seats one, in the order the children were linked (family.ts seatsChild). A family that
 * tried with two children and paid Family had its second child paused, and „Familia mea” said nothing:
 * the seat could only be bought from „Adaugă copil”, i.e. for a new child. The payer is now told which
 * child is left out, from when, and what the seat costs (addon-checkout `type: "child"`, callback
 * `child_addon` → paidExtraChildSeats++, which seats the next child in link order — this one).
 */
import { prisma } from "@/lib/prisma";
import { childSeatMonthlyMinor, forInterval } from "@/lib/checkout-price";
import { childDiscountPercent } from "@/lib/family";
import { lockedDiscount, monthlyPlanPriceMinor } from "@/lib/checkout-facts";
import { paysByCard } from "@/lib/card-subscription";
import { isPaidSubscriber } from "@/lib/escalation/segmentation";
import { individualPlan } from "@/lib/access";
import { loadAccess } from "@/lib/access-server";
import type { getFamilyOverview } from "@/lib/family-invite";

export type ChildSeatQuote = {
  /** The next seat's price, in major units (RON), for the interval below. */
  price: number;
  interval: "MONTH" | "YEAR";
  /** The next seat's own discount against the first child (−20% for the 2nd, −30% from the 3rd). */
  discountPercent: number;
  /**
   * Children of this payer with no seat and no access of their own, in link order. `trialEndsAt` is
   * set while the trial still covers them (they pause then); null when they are paused already.
   */
  leftOut: { id: string; name: string | null; trialEndsAt: string | null }[];
  /**
   * Seats to buy before the first child left out is seated. Seats go by link order (family.ts
   * seatsChild), so a child linked earlier who is covered another way (another parent's package,
   * „Gratuit permanent") still takes the next seat: then one seat isn't enough (review 15.10).
   */
  seatsNeeded: number;
};

/** Null whenever there is nothing honest to offer: no family package paid for, or no child left out. */
export async function childSeatQuote(
  userId: string,
  overview: Awaited<ReturnType<typeof getFamilyOverview>>,
): Promise<ChildSeatQuote | null> {
  if (overview.unlimited || overview.trial) return null;
  const seats = overview.seats.children.max;
  if (overview.children.length <= seats) return null;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      stripeSubscriptionId: true,
      subscriptionPlan: { select: { price: true, interval: true, isActive: true, familyPlanKey: true, maxParents: true, maxChildren: true } },
    },
  });
  const plan = u?.subscriptionPlan;
  // The same gates as the seat's checkout (addon-checkout): a family package that is paid and seats children.
  if (!u || !plan || !plan.isActive || !isPaidSubscriber(u) || individualPlan(plan)) return null;
  if (plan.interval !== "MONTH" && plan.interval !== "YEAR") return null;

  // Link order, as access.ts seats them (access-server loads childrenLinks by createdAt).
  const links = await prisma.guardian.findMany({
    where: { parentId: userId, relation: "PARENT", status: "active" },
    orderBy: { createdAt: "asc" },
    select: { child: { select: { id: true, name: true } } },
  });
  // The access resolver decides: a child covered another way (another parent's package, „Gratuit
  // permanent”, a school) is not left out, and with the pause switched off nobody is paused.
  const unseated = links.slice(seats).map((l) => l.child);
  const accesses = await Promise.all(unseated.map((c) => loadAccess(c.id)));
  const leftOut: ChildSeatQuote["leftOut"] = [];
  let firstRank = -1;
  unseated.forEach((child, i) => {
    const access = accesses[i];
    if (access?.kind !== "paused" && access?.kind !== "trial") return;
    if (firstRank === -1) firstRank = i;
    leftOut.push({ id: child.id, name: child.name, trialEndsAt: access.kind === "trial" ? access.endsAt.toISOString() : null });
  });
  if (leftOut.length === 0) return null;

  const childIndex = seats + 1;
  const [locked, byCard, planMonthly] = await Promise.all([lockedDiscount(userId), paysByCard(u), monthlyPlanPriceMinor(plan)]);
  const monthly = childSeatMonthlyMinor(planMonthly, childIndex, byCard ? (locked?.percent ?? 0) : 0);
  const interval = plan.interval === "YEAR" ? "YEAR" : "MONTH";
  return { price: forInterval(monthly, interval) / 100, interval, discountPercent: childDiscountPercent(childIndex), leftOut, seatsNeeded: firstRank + 1 };
}
