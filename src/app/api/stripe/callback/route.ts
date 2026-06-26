export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { accrueCommissionForPayment } from "@/lib/referral";
import { logger } from "@/lib/logger";

/**
 * Stripe Checkout Broker → Tutor callback.
 *
 * The broker (stripe.knowbest.ro) holds the Stripe key + customer; it POSTs a
 * signed payload here on payment/subscription events. We verify the HMAC, reject
 * replays, then mirror the event into local DB (Payment + subscriptionStatus +
 * referral commission) — the same bookkeeping the old direct Stripe webhook did,
 * but keyed on metadata.userId (echoed by the broker) instead of stripeCustomerId.
 *
 * Env: STRIPE_BROKER_CALLBACK_SECRET (verifies X-Broker-Signature).
 */

const SECRET = process.env.STRIPE_BROKER_CALLBACK_SECRET;
const MAX_AGE_SECONDS = 300; // anti-replay window (broker payload carries `t`)

interface BrokerCallback {
  v?: number;
  t?: number;
  event: string;
  sessionId: string;
  projectSlug: string;
  metadata?: { userId?: string; planId?: string; voucherId?: string };
  paymentStatus?: string;
  amountTotal?: number | null;
  currency?: string;
  stripePaymentIntentId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
}

async function accrueReferral(payment: { id: string; userId: string; amount: number; currency: string }) {
  try {
    await accrueCommissionForPayment({
      paymentId: payment.id,
      payerUserId: payment.userId,
      amountCents: payment.amount,
      currency: payment.currency,
    });
  } catch (err) {
    logger.error("Referral commission accrual failed", err, { paymentId: payment.id });
  }
}

/**
 * Create a Payment idempotently on the broker sessionId (unique). A broker retry
 * (we returned non-2xx) won't create a duplicate; returns the existing one instead.
 */
async function createPaymentForSession(data: {
  userId: string;
  planId?: string;
  sessionId: string;
  amount: number;
  currency: string;
  type: "subscription" | "one_time";
}): Promise<{ payment: { id: string; userId: string; amount: number; currency: string }; isNew: boolean }> {
  try {
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        stripeSessionId: data.sessionId,
        amount: data.amount,
        currency: data.currency,
        status: "succeeded",
        type: data.type,
      },
    });
    return { payment, isNew: true };
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      const existing = await prisma.payment.findUnique({ where: { stripeSessionId: data.sessionId } });
      if (existing) return { payment: existing, isNew: false };
    }
    throw e;
  }
}

async function _POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-broker-signature") || "";

  if (!SECRET) {
    return NextResponse.json({ error: "Callback not configured" }, { status: 503 });
  }
  const expected = crypto.createHmac("sha256", SECRET).update(raw, "utf8").digest("hex");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let p: BrokerCallback;
  try {
    p = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Anti-replay: reject a captured signed body resent later (S6).
  if (typeof p.t === "number" && Math.floor(Date.now() / 1000) - p.t > MAX_AGE_SECONDS) {
    return NextResponse.json({ error: "Stale callback" }, { status: 400 });
  }

  const userId = p.metadata?.userId;
  const planId = p.metadata?.planId;
  const amount = typeof p.amountTotal === "number" ? p.amountTotal : 0;
  const currency = p.currency || "ron";
  if (!userId) {
    return NextResponse.json({ received: true, ignored: "no userId" });
  }

  switch (p.event) {
    case "payment.succeeded": {
      // One-time purchase.
      const { payment, isNew } = await createPaymentForSession({
        userId,
        planId,
        sessionId: p.sessionId,
        amount,
        currency,
        type: "one_time",
      });
      if (isNew) await accrueReferral(payment);
      break;
    }

    case "subscription.activated": {
      const { payment, isNew } = await createPaymentForSession({
        userId,
        planId,
        sessionId: p.sessionId,
        amount,
        currency,
        type: "subscription",
      });
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlanId: planId,
          subscriptionStatus: p.subscriptionStatus === "trialing" ? "trialing" : "active",
        },
      });
      // Accrue only on a real charge (a $0 trial activation carries no money);
      // recurring charges come back as subscription.renewed. isNew guards retries.
      if (isNew && amount > 0) await accrueReferral(payment);
      break;
    }

    case "subscription.renewed": {
      // Recurring charge. The broker skips the first (subscription_create) invoice,
      // so every renewed event is a distinct real charge → one Payment + commission.
      // NOTE: the broker callback carries no per-invoice id, so renewals are not
      // de-duped on a broker retry — acceptable while Tutor has no live recurring
      // subscriptions yet (follow-up: add Stripe eventId to the broker callback).
      const payment = await prisma.payment.create({
        data: { userId, planId, amount, currency, status: "succeeded", type: "subscription" },
      });
      await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: "active" } });
      await accrueReferral(payment);
      break;
    }

    case "subscription.payment_failed": {
      await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: "past_due" } });
      break;
    }

    case "subscription.canceled": {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: "canceled", subscriptionEndsAt: new Date() },
      });
      break;
    }

    // payment.expired / payment.failed → no local state change (checkout abandoned).
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const POST = withErrorHandler(_POST);
