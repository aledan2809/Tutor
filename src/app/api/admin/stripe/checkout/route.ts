export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId, voucherCode } = await req.json();

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 });
  }

  // Resolve or create Stripe customer
  let stripeCustomerId = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  }))?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: session.user.email || undefined,
      name: session.user.name || undefined,
      metadata: { userId: session.user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId },
    });
  }

  // Handle voucher discount
  let couponId: string | undefined;
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

    // Create Stripe coupon
    const stripeCoupon = await getStripe().coupons.create({
      percent_off: voucher.discountPercent,
      duration: "once",
      metadata: { voucherId: voucher.id },
    });
    couponId = stripeCoupon.id;

    // Increment usage
    await prisma.voucher.update({
      where: { id: voucher.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  const isSubscription = plan.interval !== "ONE_TIME";

  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripeId, quantity: 1 }],
    mode: isSubscription ? "subscription" : "payment",
    success_url: `${process.env.STRIPE_SUCCESS_URL || process.env.AUTH_URL + "/dashboard"}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.STRIPE_CANCEL_URL || process.env.AUTH_URL + "/dashboard",
    metadata: { userId: session.user.id, planId: plan.id },
  };

  if (isSubscription && plan.trialDays) {
    checkoutParams.subscription_data = {
      trial_period_days: plan.trialDays,
    };
  }

  if (couponId) {
    checkoutParams.discounts = [{ coupon: couponId }];
  }

  const checkoutSession = await getStripe().checkout.sessions.create(checkoutParams);

  return NextResponse.json({ url: checkoutSession.url });
}
