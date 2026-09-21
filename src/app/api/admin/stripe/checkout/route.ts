export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { checkVoucherForCheckout, normalizeVoucherCode } from "@/lib/voucher-checkout";
import { resolveFamilyPlanFromRecord } from "@/lib/family";
import { checkoutTrialDays, remainingFreeTrialDays } from "@/lib/free-trial";
import { trialStartOf } from "@/lib/access";
import { loadPauseStartsAt } from "@/lib/access-server";
import { paysByCard } from "@/lib/card-subscription";
import { checkoutDiscount, subjectLines, type BillingInterval } from "@/lib/checkout-price";
import { familyHasTelegram, monthlyPlanPriceMinor, planLearner, subjectsToBill } from "@/lib/checkout-facts";

/**
 * Checkout via the central Stripe Checkout Broker (stripe.knowbest.ro).
 *
 * Tutor no longer holds a Stripe key: it asks the broker to create the Checkout
 * session on the billing company's Stripe account (Class RDA). The broker keeps
 * the customer + secrets; Tutor reacts to broker callbacks at /api/stripe/callback.
 *
 * Env (broker keys, env-independent — synced once via sync-broker-keys.mjs):
 *   STRIPE_BROKER_URL, STRIPE_BROKER_PROJECT_KEY, STRIPE_BROKER_CALLBACK_SECRET
 */

const INTERVAL_MAP: Record<string, "month" | "year"> = { MONTH: "month", YEAR: "year" };
const CURRENCY = process.env.TUTOR_CURRENCY || "ron";

async function _POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brokerUrl = process.env.STRIPE_BROKER_URL;
  const projectKey = process.env.STRIPE_BROKER_PROJECT_KEY;
  if (!brokerUrl || !projectKey) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const { planId, voucherCode } = await req.json();

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 });
  }

  // Not on top of a subscription the card already pays: the broker can't switch its plan, so this
  // would start a second subscription next to it, charged under another Stripe customer the portal
  // doesn't show. A declined renewal is fixed with a new card; a change of package waits for the
  // current subscription to end.
  const payer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, subscriptionStatus: true, subscriptionEndsAt: true, stripeSubscriptionId: true },
  });
  if (payer && (await paysByCard(payer))) {
    const pastDue = payer.subscriptionStatus === "past_due";
    return NextResponse.json(
      {
        error: pastDue
          ? "Plata abonamentului tău n-a trecut, iar banca o reîncearcă. Actualizează cardul din „Gestionează abonamentul” — un pachet nou ar porni un al doilea abonament."
          : "Ai deja un abonament plătit cu cardul. Ca să treci pe alt pachet, oprește-l din „Gestionează abonamentul” și alege pachetul nou după ce se încheie — altfel ai plăti două abonamente.",
        code: pastDue ? "PAST_DUE" : "CARD_SUBSCRIPTION",
      },
      { status: 409 },
    );
  }

  // Validate voucher locally. The rules live in voucher-checkout.ts; `code` lets the page show a
  // translated message. Whether the code is what gets applied is decided below (checkoutDiscount).
  let codeOffer: { percent: number; renews: boolean; voucherId: string } | null = null;
  const code = normalizeVoucherCode(voucherCode);
  if (code) {
    const voucher = await prisma.voucher.findUnique({ where: { code } });
    const alreadyUsedByUser = voucher?.oncePerUser
      ? !!(await prisma.voucherRedemption.findUnique({
          where: { voucherId_userId: { voucherId: voucher.id, userId: session.user.id } },
        }))
      : false;
    const check = checkVoucherForCheckout(voucher, {
      alreadyUsedByUser,
      planKey: resolveFamilyPlanFromRecord(plan)?.key ?? null,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.message, code: check.code, planKey: check.planKey }, { status: 400 });
    }
    // A 100% code opens access without a card (/api/activate); here it would be dropped silently and
    // the family charged the full price.
    if (check.coupon.percentOff >= 100) {
      return NextResponse.json(
        { error: "Codul acesta deschide accesul fără plată: folosește-l din „Activare acces”.", code: "VOUCHER_FREE_ACCESS" },
        { status: 400 },
      );
    }
    codeOffer = {
      percent: check.coupon.percentOff,
      renews: check.coupon.duration === "forever",
      voucherId: check.coupon.metadata.voucherId,
    };
  }

  const isSubscription = plan.interval !== "ONE_TIME";
  const interval = INTERVAL_MAP[plan.interval];
  if (isSubscription && !interval) {
    return NextResponse.json({ error: `Unsupported plan interval: ${plan.interval}` }, { status: 400 });
  }

  // „7 zile gratuite" is counted once per account (decizie Alex 16.09.2026): paying on day 3 of a
  // free account gets the 4 days still owed, not a fresh week on top. The week starts where the
  // no-card trial's does (access.ts): an account older than the pause switch got it from the switch.
  const [account, pauseStartsAt, telegram, learnerId] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { createdAt: true } }),
    loadPauseStartsAt(),
    familyHasTelegram(session.user.id),
    planLearner(session.user.id, plan),
  ]);
  const trialStart = trialStartOf(account?.createdAt ?? new Date(), pauseStartsAt);
  const trialDays = isSubscription ? checkoutTrialDays(plan.trialDays, trialStart) : 0;

  // What is charged (checkout-price.ts, Alex 16–17.09): one line per subject the learner has chosen,
  // each with the lifetime discount built into the price — the trial offer while the account's own 7
  // days run (checked on its own, a plan without trial days included), or a renewing code, then
  // Telegram connected by anyone in the family. Annual = ten months of it.
  const discount = checkoutDiscount({
    trialActive: remainingFreeTrialDays(trialStart) > 0,
    code: codeOffer ? { percent: codeOffer.percent, renews: codeOffer.renews } : null,
    telegram,
  });
  const billing: BillingInterval = plan.interval === "YEAR" ? "YEAR" : "MONTH";
  // The learner's subjects, less the ones still paid by their own subscriptions (bought next to an
  // earlier plan): those aren't billed twice. An annual package is priced from today's monthly price.
  const [subjects, monthlyMinor] = await Promise.all([
    isSubscription ? subjectsToBill(session.user.id, learnerId) : Promise.resolve(1),
    isSubscription ? monthlyPlanPriceMinor(plan) : Promise.resolve(plan.price),
  ]);
  const lines = subjectLines({
    planMonthlyMinor: monthlyMinor,
    subjects,
    lifetimePercent: discount.pricesPercent,
    interval: billing,
  });
  const voucherId = discount.codeUsed ? codeOffer?.voucherId : undefined;

  const successUrl = `${process.env.STRIPE_SUCCESS_URL || process.env.AUTH_URL + "/dashboard"}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || process.env.AUTH_URL + "/dashboard";
  const callbackUrl = `${process.env.AUTH_URL}/api/stripe/callback`;

  const body = {
    projectSlug: "tutor",
    mode: isSubscription ? "subscription" : "payment",
    currency: CURRENCY,
    lineItems: lines.map((line) => ({
      name: line.index === 1 ? plan.name : `${plan.name} · materia a ${line.index}-a (−${line.subjectPercent}%)`,
      // Broker expects MAJOR units; amounts are computed in minor units (bani).
      amount: line.minor / 100,
      ...(isSubscription ? { interval, intervalCount: 1 } : {}),
    })),
    ...(trialDays > 0 ? { trialDays } : {}),
    // A code that doesn't renew beat the trial offer: it is taken off the first payment only.
    ...(discount.onceCouponPercent && voucherId
      ? { coupon: { percentOff: discount.onceCouponPercent, duration: "once", metadata: { voucherId } } }
      : {}),
    successUrl,
    cancelUrl,
    callbackUrl,
    customerEmail: session.user.email || undefined,
    // Echoed back on the callbacks: activation locks the discount and the paid subjects on the account.
    metadata: {
      userId: session.user.id,
      planId: plan.id,
      ...(voucherId ? { voucherId } : {}),
      learnerId: learnerId ?? null,
      subjects,
      discountPercent: discount.pricesPercent,
      discountBase: discount.base,
      telegram: discount.telegram,
      interval: billing,
    },
  };

  const res = await fetch(`${brokerUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Project-Key": projectKey },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    return NextResponse.json(
      { error: data?.error || "Checkout creation failed" },
      { status: res.status === 200 ? 502 : res.status }
    );
  }

  // Voucher usage is incremented only once the broker accepted the session.
  if (voucherId) {
    await prisma.voucher.update({ where: { id: voucherId }, data: { usedCount: { increment: 1 } } });
  }

  return NextResponse.json({ url: data.url });
}

export const POST = withErrorHandler(_POST);
