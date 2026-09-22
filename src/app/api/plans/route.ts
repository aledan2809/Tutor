import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { payingForAccess } from "@/lib/access";
import { loadAccess, loadSeatHolder } from "@/lib/access-server";
import { getFamilyOverview } from "@/lib/family-invite";
import { parentUpgradeQuote } from "@/lib/parent-upgrade";
import { effectiveFamilyPlan, parentUpgradeOf, resolveFamilyPlanFromRecord } from "@/lib/family";
import { loadVoucherPreview, serializePreview } from "@/lib/voucher-preview-server";
import { paysByCard } from "@/lib/card-subscription";
import { isPaidSubscriber } from "@/lib/escalation/segmentation";
import { forInterval } from "@/lib/checkout-price";
import {
  familyHasTelegram,
  firstLinkedChild,
  lockedDiscount,
  paidSubjects,
  payerTrial,
  planLearner,
  runningAddons,
  subjectsToBill,
} from "@/lib/checkout-facts";

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
  const userId = session.user.id;

  const [plans, me] = await Promise.all([
    prisma.subscriptionPlan.findMany({
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
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountRole: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        subscriptionPlanId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        pendingVoucherCode: true,
        paidExtraParentSeats: true,
        subscriptionPlan: { select: { name: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true } },
      },
    }),
  ]);
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = me.pendingVoucherCode ? await loadVoucherPreview(me.pendingVoucherCode, userId) : null;
  if (me.pendingVoucherCode && pending && !pending.ok) {
    // The kept code can no longer be used (expired, already used on this account, switched off).
    // This response says why, once; the account forgets it, so the page stops offering a price
    // checkout would refuse. Guarded on the same code, so a code saved meanwhile stays.
    await prisma.user.updateMany({
      where: { id: userId, pendingVoucherCode: me.pendingVoucherCode },
      data: { pendingVoucherCode: null },
    });
  }

  // What the page prices every package with (checkout-price.ts): the payer's own free week (the −30%
  // offer and its countdown), Telegram in the family (−10%), and the subjects each kind of plan would
  // bill — the payer's own for Elev, the first linked child's for a family plan — less the ones still
  // paid by their own subscriptions, as checkout counts them.
  const [trial, telegram, counted, parentLinks, firstChild, addons, byCard] = await Promise.all([
    payerTrial(userId, new Date(), me.createdAt),
    familyHasTelegram(userId),
    paidSubjects(userId),
    prisma.guardian.count({ where: { childId: userId, status: "active", relation: "PARENT" } }),
    firstLinkedChild(userId),
    runningAddons(userId),
    paysByCard(me),
  ]);
  // A child whose parent is in the account is never offered a price to pay now (UCPD Annex I point
  // 28): no countdown, no −30% in the trial, no Telegram saving — the rule of the trial banner and of
  // the Telegram card. A learner whose card pays their own subscription is its payer, not such a child:
  // the offer goes to whoever pays (their own subjects' prices included, student domains route).
  const child = parentLinks > 0 && me.accountRole !== "PARENT" && firstChild === null && !byCard;

  const paid = isPaidSubscriber(me);
  const [selfSubjects, childSubjects, locked, countedLearner, names, seatHolder] = await Promise.all([
    subjectsToBill(userId, userId),
    firstChild ? subjectsToBill(userId, firstChild) : Promise.resolve(null),
    byCard ? lockedDiscount(userId) : Promise.resolve(null),
    byCard && counted ? (counted.learnerId ? Promise.resolve(counted.learnerId) : planLearner(userId, me.subscriptionPlan)) : Promise.resolve(null),
    addonNames(addons),
    // A parent the family's plan leaves out (another parent's plan covers the children, without a seat
    // for this one — so without the plan's access) is told who has it, never pushed to buy a second one:
    // the trial banner's rule.
    !paid && firstChild
      ? loadAccess(userId).then((access) => (access && access.kind !== "full" ? loadSeatHolder(userId) : null))
      : Promise.resolve(null),
  ]);

  // The subjects the card subscription pays for, and whose: one more is added from that learner's
  // subject list and paid on its own subscription (checkout-facts.ts).
  const subjectsPaid =
    byCard && counted
      ? {
          count: counted.count,
          self: countedLearner === userId,
          name:
            countedLearner && countedLearner !== userId
              ? ((await prisma.user.findUnique({ where: { id: countedLearner }, select: { name: true } }))?.name ?? null)
              : null,
        }
      : null;

  // An annual package is priced from its monthly one — the row a price change edits — as checkout
  // charges it (monthlyPlanPriceMinor): ten months of the lowest monthly price of the same package.
  const monthlyByKey = new Map<string, number>();
  for (const p of plans) {
    if (p.interval === "MONTH" && p.familyPlanKey && !monthlyByKey.has(p.familyPlanKey)) monthlyByKey.set(p.familyPlanKey, p.price);
  }
  const shownPrice = (p: (typeof plans)[number]) => {
    const monthly = p.interval === "YEAR" && p.familyPlanKey ? monthlyByKey.get(p.familyPlanKey) : undefined;
    return (monthly !== undefined ? forInterval(monthly, "YEAR") : p.price) / 100;
  };

  // The payer is told that an adult of the family is left out, and what the package that includes them
  // costs (the same offer as on „Familia mea"); with the difference already paid, the family's package
  // is the bigger one — that is what it pays for and what it holds.
  const overview = paid ? await getFamilyOverview(userId) : null;
  const parentUpgrade = overview ? await parentUpgradeQuote(userId, overview) : null;
  const ownPlan = resolveFamilyPlanFromRecord(me.subscriptionPlan);
  const upgradedPlanName = me.paidExtraParentSeats > 0 ? (effectiveFamilyPlan(ownPlan, me.paidExtraParentSeats)?.label ?? null) : null;
  // Paid next to a package that already includes the second parent (the family moved to it since):
  // the difference buys nothing any more and is only worth stopping.
  const parentUpgradeRedundant = me.paidExtraParentSeats > 0 && parentUpgradeOf(ownPlan) === null;

  return NextResponse.json({
    plans: plans.map((p) => ({ ...p, price: shownPrice(p) })),
    current: {
      subscriptionStatus: me.subscriptionStatus,
      paid,
      // The plan the account pays for right now. A cancelled package or an expired year from a code keeps
      // its plan on the row: shown as „current", the family couldn't buy again the very package the pause
      // screen sends them to (review r6, P2).
      subscriptionPlanId: payingForAccess(me) ? me.subscriptionPlanId : null,
      // Another package on top of a card subscription would be a second one: the page doesn't offer it.
      byCard,
      child,
      subjectsPaid,
      parentUpgrade,
      upgradedPlanName,
      parentUpgradeRedundant,
      // The discount the card subscription keeps (for a family comparing a year with what it pays now).
      locked: locked ? { percent: locked.percent, base: locked.base, telegram: locked.telegram, interval: locked.interval } : null,
      // Stripe is still retrying a declined renewal (inside the grace). Past it, nothing is being
      // retried any more and the family must be able to choose a package again.
      retrying: me.subscriptionStatus === "past_due" && payingForAccess(me),
      // Same start as the no-card week and as checkout (access.ts trialStartOf).
      freeTrialDaysLeft: trial?.daysLeft ?? 0,
      trialOffer: trial && !child && !paid && !seatHolder ? { active: trial.active, endsAt: trial.endsAt.toISOString() } : null,
      seatHolder,
      telegram,
      subjects: {
        self: selfSubjects,
        child: childSubjects !== null ? { count: childSubjects } : null,
      },
      // The subscriptions bought next to the plan (a subject, a child's seat), each with its own
      // „Gestionează”: the plan's portal doesn't show them. Listed while they run, with the plan or not.
      addons: addons.map((a) => ({
        sessionId: a.sessionId,
        type: a.type,
        learnerName: a.learnerId ? (names.learners.get(a.learnerId) ?? null) : null,
        subjectName: a.domainId ? (names.domains.get(a.domainId) ?? null) : null,
        since: a.at,
      })),
      // The countdown counts from the server's clock (a phone's clock may run ahead).
      serverNow: new Date().toISOString(),
      pendingVoucher: pending
        ? pending.ok
          ? { ok: true as const, preview: serializePreview(pending.preview) }
          : { ok: false as const, code: pending.code, voucherCode: me.pendingVoucherCode ?? null }
        : null,
    },
  });
}

/** The names the add-on list shows: whose subject, which subject. */
async function addonNames(addons: { learnerId: string | null; domainId: string | null }[]) {
  const learnerIds = [...new Set(addons.flatMap((a) => (a.learnerId ? [a.learnerId] : [])))];
  const domainIds = [...new Set(addons.flatMap((a) => (a.domainId ? [a.domainId] : [])))];
  const [learners, domains] = await Promise.all([
    learnerIds.length ? prisma.user.findMany({ where: { id: { in: learnerIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
    domainIds.length ? prisma.domain.findMany({ where: { id: { in: domainIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  return {
    learners: new Map(learners.map((l) => [l.id, l.name])),
    domains: new Map(domains.map((d) => [d.id, d.name])),
  };
}

export const GET = withErrorHandler(_GET);
