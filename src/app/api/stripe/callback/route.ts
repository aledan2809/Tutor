export const dynamic = "force-dynamic";
import { NextRequest, NextResponse, after } from "next/server";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { accrueCommissionForPayment } from "@/lib/referral";
import { logger } from "@/lib/logger";
import { boughtSubjectTarget, endAddon, grantAddon, recordCheckoutTerms } from "@/lib/checkout-facts";
import { enableLearnerSubject } from "@/lib/family-invite";
import {
  endedSubscriptionIds,
  eventIsForCurrentSubscription,
  recordEndedSubscription,
  subscriptionEnded,
} from "@/lib/card-subscription";
import { grantLatePaidPeriod, notifyPaymentFailed } from "@/lib/billing-messages";
import { CLEARED_PERIOD_FIELDS, parseBrokerSubscription, periodFieldsFrom } from "@/lib/billing-period";
import { alertOwners, lei, payerForAlert } from "@/lib/owner-alerts";

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
    /** "child_addon" / "subject_addon" / "parent_addon" for a subscription bought next to the plan. */
    type?: string;
    childIndex?: string;
    /** Checkout terms (checkout route): locked on the account at activation. */
    learnerId?: string | null;
    /** A subject add-on: the subject it was bought for, turned on at activation. */
    domainId?: string | null;
    subjects?: number;
    discountPercent?: number;
    discountBase?: string | null;
    telegram?: boolean;
    interval?: string;
  };
  paymentStatus?: string;
  amountTotal?: number | null;
  currency?: string;
  stripePaymentIntentId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  /** Contract v3: where the subscription stands (billing-period.ts BrokerSubscription). */
  subscription?: unknown;
  /** Contract v3, subscription.payment_failed: when the bank is retried next (ISO), null when it won't be. */
  nextPaymentAttempt?: string | null;
}

const ADDON_WORDS: Record<string, string> = {
  child_addon: "loc pentru încă un copil",
  subject_addon: "materie în plus",
  parent_addon: "diferența pentru încă un părinte",
};

/** Abandoned / refused checkouts already alerted in this process (bounded): they leave nothing in the database. */
const alerted = new Set<string>();
function firstAlertFor(key: string): boolean {
  if (alerted.has(key)) return false;
  alerted.add(key);
  if (alerted.size > 1000) alerted.delete(alerted.values().next().value as string);
  return true;
}

/** What the event is about, as the owner's alert names it: the package, or the add-on. */
async function boughtWords(planId: string | undefined, addonType: string | null): Promise<string> {
  if (addonType) return ADDON_WORDS[addonType] ?? "abonament separat";
  if (!planId) return "pachet";
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId }, select: { name: true } }).catch(() => null);
  return plan?.name ?? "pachet";
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
  const [account, ended] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true } }),
    endedSubscriptionIds(userId),
  ]);
  // Checked before the stored id: a cancellation clears it, and an empty id counts as „this one".
  const late = subscriptionEnded(ended, p.stripeSubscriptionId);
  if (!late && eventIsForCurrentSubscription(account?.stripeSubscriptionId, p.stripeSubscriptionId)) return true;
  logger.warn(
    late
      ? "Subscription event for a subscription that already ended — left unchanged"
      : "Subscription event for a subscription the account no longer has — left unchanged",
    {
      userId,
      event: what,
      subscriptionId: p.stripeSubscriptionId ?? "",
      currentSubscriptionId: account?.stripeSubscriptionId ?? "",
    }
  );
  return false;
}

/**
 * An activation that must not rewrite the account: one for a subscription already cancelled (a broker
 * retry arriving after the cancellation would set it active with no end date — access forever), or a
 * retry of an older activation arriving after the account moved on to another subscription. A first
 * activation is always a new checkout session, so a retry is one whose payment already existed.
 */
async function staleActivation(userId: string, p: BrokerCallback, isNew: boolean): Promise<boolean> {
  const [account, ended] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true } }),
    endedSubscriptionIds(userId),
  ]);
  const late = subscriptionEnded(ended, p.stripeSubscriptionId);
  const older = !isNew && !eventIsForCurrentSubscription(account?.stripeSubscriptionId, p.stripeSubscriptionId);
  if (!late && !older) return false;
  logger.warn("Activation retry for a subscription the account no longer has — payment recorded, account unchanged", {
    userId,
    subscriptionId: p.stripeSubscriptionId ?? "",
    currentSubscriptionId: account?.stripeSubscriptionId ?? "",
    ended: late,
  });
  return true;
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
  // An add-on is its own recurring line next to the main subscription: an extra child's seat, a subject
  // added after payment, or the difference to the package with one more parent („Treci pe Family Duo").
  // Its events never change the main plan or status.
  const addonType =
    p.metadata?.type === "child_addon" || p.metadata?.type === "subject_addon" || p.metadata?.type === "parent_addon"
      ? p.metadata.type
      : null;
  const isAddon = addonType !== null;
  const amount = typeof p.amountTotal === "number" ? p.amountTotal : 0;
  const currency = p.currency || "ron";
  // Contract v3: the paid period, a scheduled stop, the price of a period. An older broker sends none:
  // the columns then stay as they are (Pachete reads them from the broker on demand — subscription-sync.ts).
  const brokerSub = parseBrokerSubscription(p.subscription);
  const period = brokerSub ? periodFieldsFrom(brokerSub) : {};
  if (!userId) {
    return NextResponse.json({ received: true, ignored: "no userId" });
  }
  // The owner hears of money once per real change (/bani 15.10.2026): set below only on a first
  // delivery, sent after the bookkeeping so a failed write is retried by the broker without an alert.
  let alert: string | null = null;

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
      if (isNew) alert = `💳 Plată unică încasată: ${await boughtWords(planId, null)} · ${lei(amount, currency)}`;
      await recordVoucherRedemption(p.metadata?.voucherId, userId, p.sessionId);
      break;
    }

    case "subscription.activated": {
      const { payment, isNew } = await createPaymentForSession({
        userId,
        planId: isAddon ? undefined : planId,
        sessionId: p.sessionId,
        amount,
        currency,
        type: "subscription",
      });
      if (isNew) {
        const words = await boughtWords(planId, addonType);
        alert = amount > 0 ? `💳 Abonament nou: ${words} · ${lei(amount, currency)}` : `💳 Abonament nou, cu zile gratuite în Stripe (0 lei azi): ${words}`;
      }
      if (addonType) {
        // Its place — a child's seat or a subject — is counted together with its entry in the payer's
        // list of subscriptions bought next to the plan and the subject it was bought for turned on, in
        // one transaction, once per checkout session: a delivery repeated after a failure counts nothing
        // twice; one that arrives after the subscription's end counts nothing. NEVER the main plan or status.
        const learnerId = typeof p.metadata?.learnerId === "string" ? p.metadata.learnerId : null;
        const domainId = addonType === "subject_addon" && typeof p.metadata?.domainId === "string" ? p.metadata.domainId : null;
        const target = domainId ? await boughtSubjectTarget(userId, learnerId, domainId) : null;
        await grantAddon(
          userId,
          { type: addonType, sessionId: p.sessionId, learnerId, domainId, at: new Date().toISOString() },
          target ? (db) => enableLearnerSubject(target.learnerId, target.domainId, target.setById, db) : undefined,
        );
      } else if (await staleActivation(userId, p, isNew)) {
        // Recorded as a payment above. A first delivery whose subscription has meanwhile ended still
        // brought money: it buys one period with an end date, never the subscription back
        // (billing-messages.ts). A repeated delivery (isNew false) brought nothing new.
        if (isNew) await grantLatePaidPeriod({ userId, planId, interval: p.metadata?.interval, amountMinor: amount });
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
            ...period,
            subscriptionRetryAt: null,
            // The code kept since signup has done its job once the plan is paid with it. When the trial
            // offer beat it, it wasn't used and stays on the account for later (checkout-price.ts).
            ...(typeof p.metadata?.discountPercent === "number" && !p.metadata?.voucherId ? {} : { pendingVoucherCode: null }),
          },
        });
        // Counts as used from activation, a free trial included.
        await recordVoucherRedemption(p.metadata?.voucherId, userId, p.sessionId);
        // The discount and the subjects this subscription was priced with, for add-ons bought later.
        await recordCheckoutTerms(userId, p.metadata as Record<string, unknown> | undefined, p.sessionId);
      }
      // Accrue only on a real charge (a $0 trial activation carries no money);
      // recurring charges come back as subscription.renewed. On every delivery, not only the first: a
      // first one that failed before this point (the add-on or terms transaction above) still accrues on
      // its retry, and a repeated one finds the commission already recorded (unique on the payment).
      if (amount > 0) await accrueReferral(payment);
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
        planId: isAddon ? undefined : planId,
        eventId: p.eventId,
        amount,
        currency,
      });
      // An add-on renewal is a real charge (Payment + commission) but must NOT
      // reactivate the main plan's status. Neither may a charge on a subscription the account left
      // behind: it is recorded, and flagged, since the family is paying twice.
      if (!isAddon && !(await currentSubscription(userId, p, "renewed"))) {
        // Money for a subscription the account no longer has: when nothing else pays for the account
        // now, it buys one period from today (Alex, 13.10.2026) — a parent who paid an old invoice by
        // hand gets what they paid for; an account paying a newer subscription is left as it is.
        if (isNew) await grantLatePaidPeriod({ userId, planId, interval: p.metadata?.interval, amountMinor: amount });
        if (isNew) await accrueReferral(payment);
        break;
      }
      if (!isAddon) {
        // Same reason as on activation: a paying renewal must never keep an old end date. Not on an
        // account whose subscription already ended, though: an ended subscription doesn't renew, so
        // this is a late charge (an open invoice paid after the cancellation) — recorded, but it
        // doesn't turn into access with no end.
        const renewed = await prisma.user.updateMany({
          where: { id: userId, ...NOT_ENDED },
          data: { subscriptionStatus: "active", subscriptionEndsAt: null, ...period, subscriptionRetryAt: null },
        });
        if (renewed.count === 0) {
          // The subscription was cancelled meanwhile (status "canceled"): the same bounded period.
          const late = isNew ? await grantLatePaidPeriod({ userId, planId, interval: p.metadata?.interval, amountMinor: amount }) : { granted: false };
          logger.warn(
            late.granted
              ? "Charge on an account whose subscription already ended — one paid period granted"
              : "Charge on an account whose subscription already ended — recorded, access unchanged",
            { userId, subscriptionId: p.stripeSubscriptionId ?? "", eventId: p.eventId ?? "", until: late.until?.toISOString() ?? "" },
          );
        }
        await recordVoucherRedemption(p.metadata?.voucherId, userId, p.sessionId);
      }
      if (isNew) await accrueReferral(payment);
      if (isNew) alert = `🔁 Reînnoire încasată: ${await boughtWords(planId, addonType)} · ${lei(amount, currency)}`;
      break;
    }

    case "subscription.payment_failed": {
      // An add-on payment failure doesn't put the whole account past_due, nor does one on a
      // subscription the account left behind.
      if (!isAddon && (await currentSubscription(userId, p, "payment_failed"))) {
        // Stripe sends the last failure and the cancellation together, in either order: a failure
        // applied after the cancellation would leave the family „retrying" a subscription that no
        // longer exists, with every package locked. The write is conditional, so a cancellation
        // landing first wins.
        // No grace (Alex, 13.10.2026): the account pays for nothing from this moment (access.ts
        // payingForAccess) and the family is told at once — on the first failure of this renewal
        // only; Stripe's later retries of the same invoice fail into an account already past_due.
        // A renewal that goes through clears it (subscription.renewed).
        const failed = await prisma.user.updateMany({
          // NOT on a nullable column skips NULL rows in SQL: both conditions spelled with an explicit null.
          where: { id: userId, AND: [NOT_ENDED, { OR: [{ subscriptionStatus: null }, { subscriptionStatus: { not: "past_due" } }] }] },
          data: { subscriptionStatus: "past_due", subscriptionEndsAt: new Date() },
        });
        // When the bank is retried next, and the period as Stripe sees it (on every failure, not only the first).
        await prisma.user.updateMany({
          where: { id: userId, subscriptionStatus: "past_due" },
          data: { ...period, ...(p.nextPaymentAttempt !== undefined ? { subscriptionRetryAt: p.nextPaymentAttempt ? new Date(p.nextPaymentAttempt) : null } : {}) },
        });
        if (failed.count === 1) {
          await notifyPaymentFailed(userId);
          alert = `⚠️ Plata n-a trecut, contul e în pauză până trece: ${await boughtWords(planId, null)}${p.nextPaymentAttempt ? " · banca mai e încercată" : " · nu mai e reîncercată"}`;
        }
      }
      break;
    }

    case "subscription.canceled": {
      if (addonType) {
        // Its place goes with its entry, and for a subject at most one subject is switched off, its own
        // first — in one transaction, so a repeated delivery finds nothing left to do. The main
        // subscription stays untouched.
        if (await endAddon(userId, p.sessionId)) alert = `➖ Abonament separat oprit: ${await boughtWords(undefined, addonType)}`;
        break;
      }
      // The end of a subscription the account left behind doesn't end the one it pays now.
      if (await currentSubscription(userId, p, "canceled")) {
        // The owner hears of the end once: a redelivery (or a legacy callback with no subscription id, which
        // passes currentSubscription every time) finds the account already ended.
        const before = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "canceled",
            subscriptionEndsAt: new Date(),
            // Nothing is charged any more: a later year from a code isn't taken for a card subscription.
            ...(p.stripeSubscriptionId ? { stripeSubscriptionId: null } : {}),
            ...CLEARED_PERIOD_FIELDS,
          },
        });
        if (before?.subscriptionStatus !== "canceled") alert = `🛑 Abonament încheiat: ${await boughtWords(planId, null)}`;
      }
      // Either way the subscription has ended: whatever arrives for it later is late. Recorded after
      // the account's own change, so a retry of a cancellation that failed midway still applies it.
      if (p.stripeSubscriptionId) await recordEndedSubscription(userId, p.stripeSubscriptionId);
      break;
    }

    case "subscription.updated": {
      // Contract v3: a stop scheduled (or undone) in the Billing Portal, a new period, the trial's end.
      // Only the period columns: status and access stay with activation/renewal/failure/cancellation.
      if (addonType || !brokerSub) break;
      if (!(await currentSubscription(userId, p, "updated"))) break;
      await prisma.user.updateMany({ where: { id: userId, ...NOT_ENDED }, data: period });
      break;
    }

    // payment.expired / payment.failed → no local state change (checkout abandoned), but the owner hears
    // of it: four checkouts had been started and dropped before anyone noticed (/bani 15.10.2026).
    default:
      if (p.event === "payment.expired") alert = `⌛ Plată începută și neterminată: ${await boughtWords(planId, addonType)}`;
      else if (p.event === "payment.failed") alert = `❌ Cardul a fost refuzat la plată: ${await boughtWords(planId, addonType)}`;
      break;
  }

  // After the answer has gone back to the broker: a slow Telegram never holds the callback into a retry.
  // The money events alert only on a first change in the database (isNew, a first failure, a cancellation
  // that applied), so a redelivery finds nothing new. An abandoned or refused checkout writes nothing:
  // only those are remembered here — keying every event by session would silence the second renewal of
  // a session whose callbacks carry no event id (review 15.10).
  const dbGated = p.event !== "payment.expired" && p.event !== "payment.failed";
  if (alert && (dbGated || firstAlertFor(`${p.event}:${p.sessionId}`))) {
    const text = alert;
    after(async () => {
      const who = await payerForAlert(userId).catch(() => null);
      if (who) await alertOwners(`${text}\n${who}`);
    });
  }
  return NextResponse.json({ received: true });
}

export const POST = withErrorHandler(_POST);
