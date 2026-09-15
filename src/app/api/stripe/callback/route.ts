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
  /** Stripe event.id (broker callback v2+) — stable across retries; dedups renewals. */
  eventId?: string;
  event: string;
  sessionId: string;
  projectSlug: string;
  metadata?: {
    userId?: string;
    planId?: string;
    voucherId?: string;
    /** "child_addon" for a per-child add-on subscription (not the main plan). */
    type?: string;
    childIndex?: string;
  };
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

/**
 * Create a renewal Payment idempotently on the Stripe eventId (unique). Renewals
 * reuse the original sessionId, so they key on eventId instead. A broker retry of
 * the same event returns the existing Payment rather than creating a duplicate.
 * When eventId is absent (legacy v1 broker), falls back to a plain insert — same
 * non-deduped behavior as before, since NULL eventIds don't collide under UNIQUE.
 */
async function createRenewalPayment(data: {
  userId: string;
  planId?: string;
  eventId?: string;
  amount: number;
  currency: string;
}): Promise<{ payment: { id: string; userId: string; amount: number; currency: string }; isNew: boolean }> {
  try {
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        stripeEventId: data.eventId ?? null,
        amount: data.amount,
        currency: data.currency,
        status: "succeeded",
        type: "subscription",
      },
    });
    return { payment, isNew: true };
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002" && data.eventId) {
      const existing = await prisma.payment.findUnique({ where: { stripeEventId: data.eventId } });
      if (existing) return { payment: existing, isNew: false };
    }
    throw e;
  }
}

/**
 * Remember that this account used a oncePerUser voucher, so checkout refuses the code the
 * next time (flyer V126S: one use per account). Other vouchers are not recorded. A broker
 * retry hits the unique (voucher, user) pair and is a no-op. Never fails the callback —
 * the payment already happened; a lost row only means the account could reuse the code,
 * which is why renewals call this too (a missed row is repaired at the next renewal).
 */
async function recordVoucherRedemption(voucherId: string | undefined, userId: string, sessionId: string) {
  if (!voucherId) return;
  try {
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId }, select: { oncePerUser: true } });
    if (!voucher?.oncePerUser) return;
    await prisma.voucherRedemption.create({ data: { voucherId, userId, sessionId } });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      // Same session = a retry or a renewal: expected. Another session = the account opened
      // two checkouts with the code before either activated → two subscriptions; flag it.
      const existing = await prisma.voucherRedemption
        .findUnique({ where: { voucherId_userId: { voucherId, userId } }, select: { sessionId: true } })
        .catch(() => null);
      if (existing?.sessionId && existing.sessionId !== sessionId) {
        logger.warn("Voucher used on a second checkout by the same account — check for a double subscription", {
          voucherId,
          userId,
          firstSessionId: existing.sessionId,
          sessionId,
        });
      }
      return;
    }
    logger.error("Voucher redemption record failed", e, { voucherId, userId });
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
  const isChildAddon = p.metadata?.type === "child_addon";
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
      await recordVoucherRedemption(p.metadata?.voucherId, userId, p.sessionId);
      break;
    }

    case "subscription.activated": {
      const { payment, isNew } = await createPaymentForSession({
        userId,
        planId: isChildAddon ? undefined : planId,
        sessionId: p.sessionId,
        amount,
        currency,
        type: "subscription",
      });
      if (isChildAddon) {
        // A per-child add-on is its own recurring line — grant a seat, but NEVER
        // touch the main plan/status. isNew guards a broker retry from double-granting.
        if (isNew) {
          await prisma.user.update({
            where: { id: userId },
            data: { paidExtraChildSeats: { increment: 1 } },
          });
        }
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlanId: planId,
            subscriptionStatus: p.subscriptionStatus === "trialing" ? "trialing" : "active",
            // Persist the subscription id so /api/stripe/portal can open the portal.
            ...(p.stripeSubscriptionId ? { stripeSubscriptionId: p.stripeSubscriptionId } : {}),
          },
        });
        // Counts as used from activation, a free trial included.
        await recordVoucherRedemption(p.metadata?.voucherId, userId, p.sessionId);
      }
      // Accrue only on a real charge (a $0 trial activation carries no money);
      // recurring charges come back as subscription.renewed. isNew guards retries.
      if (isNew && amount > 0) await accrueReferral(payment);
      break;
    }

    case "subscription.renewed": {
      // Recurring charge. The broker skips the first (subscription_create) invoice,
      // so every renewed event is a distinct real charge → one Payment + commission.
      // Deduped on the broker callback's eventId (Stripe event.id, v2+): a broker
      // retry of the same renewal returns the existing Payment instead of a
      // duplicate. isNew guards the commission so a retry can't double-accrue.
      const { payment, isNew } = await createRenewalPayment({
        userId,
        planId: isChildAddon ? undefined : planId,
        eventId: p.eventId,
        amount,
        currency,
      });
      // An add-on renewal is a real charge (Payment + commission) but must NOT
      // reactivate the main plan's status.
      if (!isChildAddon) {
        await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: "active" } });
        await recordVoucherRedemption(p.metadata?.voucherId, userId, p.sessionId);
      }
      if (isNew) await accrueReferral(payment);
      break;
    }

    case "subscription.payment_failed": {
      // An add-on payment failure doesn't put the whole account past_due.
      if (!isChildAddon) {
        await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: "past_due" } });
      }
      break;
    }

    case "subscription.canceled": {
      if (isChildAddon) {
        // Free one add-on seat; leave the main subscription untouched. updateMany
        // with a gt:0 guard clamps at zero if the broker re-delivers the cancel.
        await prisma.user.updateMany({
          where: { id: userId, paidExtraChildSeats: { gt: 0 } },
          data: { paidExtraChildSeats: { decrement: 1 } },
        });
        break;
      }
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
