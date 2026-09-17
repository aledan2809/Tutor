export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { accrueCommissionForPayment } from "@/lib/referral";
import { logger } from "@/lib/logger";
import { eventIsForCurrentSubscription } from "@/lib/card-subscription";

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
/** How long a declined renewal keeps the family's access: Stripe's default retry period. */
const PAST_DUE_GRACE_MS = 14 * 24 * 60 * 60 * 1000;
/**
 * The account's subscription hasn't ended. A cancellation is final — Stripe neither retries nor
 * renews a deleted subscription — so a failure or a charge arriving after it is late and mustn't
 * undo it. (A new subscription comes back through subscription.activated.)
 */
const NOT_ENDED = { OR: [{ subscriptionStatus: null }, { subscriptionStatus: { not: "canceled" } }] } satisfies Prisma.UserWhereInput;

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

/**
 * Whether this subscription event belongs to the subscription the account has now
 * (eventIsForCurrentSubscription). One that doesn't is logged: an old subscription still running
 * means the family pays twice, and only the billing account can stop it.
 */
async function currentSubscription(userId: string, p: BrokerCallback, what: string): Promise<boolean> {
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true } });
  if (eventIsForCurrentSubscription(account?.stripeSubscriptionId, p.stripeSubscriptionId)) return true;
  logger.warn("Subscription event for a subscription the account no longer has — left unchanged", {
    userId,
    event: what,
    subscriptionId: p.stripeSubscriptionId ?? "",
    currentSubscriptionId: account?.stripeSubscriptionId ?? "",
  });
  return false;
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
            // A cancel stamps an end date; a free year from a 100% code sets one too. A Stripe
            // subscription has none until it's cancelled — a past date left here would count the
            // family as unpaid (isPaidSubscriber) and lock the child while the parent pays.
            subscriptionEndsAt: null,
            // Persist the subscription id so /api/stripe/portal can open the portal.
            ...(p.stripeSubscriptionId ? { stripeSubscriptionId: p.stripeSubscriptionId } : {}),
            // The code kept since signup has done its job (used or not): the plan is paid for.
            pendingVoucherCode: null,
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
      // reactivate the main plan's status. Neither may a charge on a subscription the account left
      // behind: it is recorded, and flagged, since the family is paying twice.
      if (!isChildAddon && !(await currentSubscription(userId, p, "renewed"))) {
        if (isNew) await accrueReferral(payment);
        break;
      }
      if (!isChildAddon) {
        // Same reason as on activation: a paying renewal must never keep an old end date. Not on an
        // account whose subscription already ended, though: an ended subscription doesn't renew, so
        // this is a late charge (an open invoice paid after the cancellation) — recorded, but it
        // doesn't turn into access with no end.
        const renewed = await prisma.user.updateMany({
          where: { id: userId, ...NOT_ENDED },
          data: { subscriptionStatus: "active", subscriptionEndsAt: null },
        });
        if (renewed.count === 0) {
          logger.warn("Charge on an account whose subscription already ended — recorded, access unchanged", {
            userId,
            subscriptionId: p.stripeSubscriptionId ?? "",
            eventId: p.eventId ?? "",
          });
        }
        await recordVoucherRedemption(p.metadata?.voucherId, userId, p.sessionId);
      }
      if (isNew) await accrueReferral(payment);
      break;
    }

    case "subscription.payment_failed": {
      // An add-on payment failure doesn't put the whole account past_due, nor does one on a
      // subscription the account left behind.
      if (!isChildAddon && (await currentSubscription(userId, p, "payment_failed"))) {
        // Stripe sends the last failure and the cancellation together, in either order: a failure
        // applied after the cancellation would leave the family „retrying" a subscription that no
        // longer exists, with every package locked. Both writes are conditional, so a cancellation
        // landing between them wins.
        await prisma.user.updateMany({ where: { id: userId, ...NOT_ENDED }, data: { subscriptionStatus: "past_due" } });
        // Access stays while Stripe retries (access.ts), but not forever: the first failure sets an
        // end to it, as long as Stripe's retries (two weeks by default). Later failures of the same
        // renewal don't move it; a renewal that goes through clears it (subscription.renewed).
        await prisma.user.updateMany({
          where: { id: userId, subscriptionEndsAt: null, ...NOT_ENDED },
          data: { subscriptionEndsAt: new Date(Date.now() + PAST_DUE_GRACE_MS) },
        });
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
      // The end of a subscription the account left behind doesn't end the one it pays now.
      if (!(await currentSubscription(userId, p, "canceled"))) break;
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "canceled",
          subscriptionEndsAt: new Date(),
          // Nothing is charged any more: a later year from a code isn't taken for a card subscription.
          ...(p.stripeSubscriptionId ? { stripeSubscriptionId: null } : {}),
        },
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
