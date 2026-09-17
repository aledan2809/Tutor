import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { remainingFreeTrialDays } from "@/lib/free-trial";
import { payingForAccess, trialStartOf } from "@/lib/access";
import { loadPauseStartsAt } from "@/lib/access-server";
import { loadVoucherPreview, serializePreview } from "@/lib/voucher-preview-server";
import { paysByCard } from "@/lib/card-subscription";
import { isPaidSubscriber } from "@/lib/escalation/segmentation";

/**
 * GET /api/plans
 * Active packages for the student-facing packages page. Login required (it's a
 * dashboard surface); only safe fields are returned (no stripeId). Price is in
 * major units (RON). Checkout itself goes through /api/admin/stripe/checkout.
 *
 * `current` also says how many of the 7 free days this account is still owed (checkout gives
 * no more than that) and which discount code is kept on the account, checked again now — so the
 * page never shows a discounted price that checkout would refuse. A kept code that no longer
 * works is reported here once and removed from the account.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      interval: true,
      trialDays: true,
      features: true,
      familyPlanKey: true,
      maxParents: true,
      maxChildren: true,
      maxTutors: true,
    },
  });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      subscriptionPlanId: true,
      stripeSubscriptionId: true,
      createdAt: true,
      pendingVoucherCode: true,
    },
  });

  const pending = me?.pendingVoucherCode ? await loadVoucherPreview(me.pendingVoucherCode, session.user.id) : null;
  if (me?.pendingVoucherCode && pending && !pending.ok) {
    // The kept code can no longer be used (expired, already used on this account, switched off).
    // This response says why, once; the account forgets it, so the page stops offering a price
    // checkout would refuse. Guarded on the same code, so a code saved meanwhile stays.
    await prisma.user.updateMany({
      where: { id: session.user.id, pendingVoucherCode: me.pendingVoucherCode },
      data: { pendingVoucherCode: null },
    });
  }

  // The plan the account pays for right now. A cancelled package or an expired year from a code keeps
  // its plan on the row: shown as „current", the family couldn't buy again the very package the pause
  // screen sends them to (review r6, P2).
  const paid = me !== null && isPaidSubscriber(me);
  return NextResponse.json({
    plans: plans.map((p) => ({ ...p, price: p.price / 100 })),
    current: {
      subscriptionStatus: me?.subscriptionStatus ?? null,
      paid,
      subscriptionPlanId: me && payingForAccess(me) ? me.subscriptionPlanId : null,
      // Another package on top of a card subscription would be a second one: the page doesn't offer it.
      byCard: me ? await paysByCard(me) : false,
      // Stripe is still retrying a declined renewal (inside the grace). Past it, nothing is being
      // retried any more and the family must be able to choose a package again.
      retrying: me?.subscriptionStatus === "past_due" && payingForAccess(me),
      // Same start as the no-card week and as checkout (access.ts trialStartOf).
      freeTrialDaysLeft: me ? remainingFreeTrialDays(trialStartOf(me.createdAt, await loadPauseStartsAt())) : 0,
      pendingVoucher: pending
        ? pending.ok
          ? { ok: true as const, preview: serializePreview(pending.preview) }
          : { ok: false as const, code: pending.code, voucherCode: me?.pendingVoucherCode ?? null }
        : null,
    },
  });
}

export const GET = withErrorHandler(_GET);
