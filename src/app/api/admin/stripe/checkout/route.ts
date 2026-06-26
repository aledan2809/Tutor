export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

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

  // Validate voucher locally (the broker creates the matching Stripe coupon).
  let coupon: { percentOff: number; duration: "once"; metadata: { voucherId: string } } | undefined;
  let voucherId: string | undefined;
  if (voucherCode) {
    const voucher = await prisma.voucher.findUnique({ where: { code: voucherCode } });
    if (!voucher || !voucher.isActive) {
      return NextResponse.json({ error: "Invalid voucher code" }, { status: 400 });
    }
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return NextResponse.json({ error: "Voucher has expired" }, { status: 400 });
    }
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json({ error: "Voucher usage limit reached" }, { status: 400 });
    }
    coupon = { percentOff: voucher.discountPercent, duration: "once", metadata: { voucherId: voucher.id } };
    voucherId = voucher.id;
  }

  const isSubscription = plan.interval !== "ONE_TIME";
  const interval = INTERVAL_MAP[plan.interval];
  if (isSubscription && !interval) {
    return NextResponse.json({ error: `Unsupported plan interval: ${plan.interval}` }, { status: 400 });
  }

  const successUrl = `${process.env.STRIPE_SUCCESS_URL || process.env.AUTH_URL + "/dashboard"}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || process.env.AUTH_URL + "/dashboard";
  const callbackUrl = `${process.env.AUTH_URL}/api/stripe/callback`;

  const body = {
    projectSlug: "tutor",
    mode: isSubscription ? "subscription" : "payment",
    currency: CURRENCY,
    lineItems: [
      {
        name: plan.name,
        // Broker expects MAJOR units; plan.price is stored in minor units (cents).
        amount: plan.price / 100,
        ...(isSubscription ? { interval, intervalCount: 1 } : {}),
      },
    ],
    ...(isSubscription && plan.trialDays ? { trialDays: plan.trialDays } : {}),
    ...(coupon ? { coupon } : {}),
    successUrl,
    cancelUrl,
    callbackUrl,
    customerEmail: session.user.email || undefined,
    metadata: { userId: session.user.id, planId: plan.id, ...(voucherId ? { voucherId } : {}) },
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
