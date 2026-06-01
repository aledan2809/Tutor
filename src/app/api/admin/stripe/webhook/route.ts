export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { withErrorHandler } from "@/lib/api-handler";
import { accrueCommissionForPayment } from "@/lib/referral";
import { logger } from "@/lib/logger";
import Stripe from "stripe";

// Accrue referral commission for a confirmed payment without ever breaking the
// webhook (Stripe needs a 200 or it retries). Idempotent on (paymentId, level).
async function accrueReferral(payment: {
  id: string;
  userId: string;
  amount: number;
  currency: string;
}) {
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

async function _POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;

      if (userId && planId) {
        const payment = await prisma.payment.create({
          data: {
            userId,
            planId,
            stripeSessionId: session.id,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "succeeded",
            type: session.mode === "subscription" ? "subscription" : "one_time",
          },
        });

        // Subscriptions accrue via invoice.paid (first + recurring) to avoid
        // double-counting — Stripe fires BOTH events on the first charge.
        // One-time payments only fire checkout.session.completed, so accrue here.
        if (session.mode !== "subscription") {
          await accrueReferral(payment);
        }

        if (session.mode === "subscription") {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionPlanId: planId,
              subscriptionStatus: "active",
            },
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: subscription.status === "trialing"
              ? "trialing"
              : subscription.status === "active"
              ? "active"
              : subscription.status === "canceled"
              ? "canceled"
              : "past_due",
            subscriptionEndsAt: subscription.ended_at
              ? new Date(subscription.ended_at * 1000)
              : null,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "canceled",
            subscriptionEndsAt: new Date(),
          },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        const payment = await prisma.payment.create({
          data: {
            userId: user.id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency || "usd",
            status: "succeeded",
            type: "subscription",
            metadata: { invoiceUrl: invoice.hosted_invoice_url },
          },
        });

        await accrueReferral(payment);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "past_due" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const POST = withErrorHandler(_POST);
