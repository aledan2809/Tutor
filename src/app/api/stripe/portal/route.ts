export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * Open the Stripe Customer Portal for the caller's subscription via the broker.
 *
 * The customer lives on the billing company's Stripe account (the broker holds the
 * key), so the app asks the broker to mint a portal session. We pass the persisted
 * `stripeSubscriptionId`; for legacy users who paid before we started storing it,
 * fall back to the most recent checkout `sessionId` (the broker resolves the
 * customer from either). NO broker code is touched.
 */

async function _POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brokerUrl = process.env.STRIPE_BROKER_URL;
  const projectKey = process.env.STRIPE_BROKER_PROJECT_KEY;
  if (!brokerUrl || !projectKey) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const userId = session.user.id;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });

  let payload: { subscriptionId: string } | { sessionId: string };
  if (u?.stripeSubscriptionId) {
    payload = { subscriptionId: u.stripeSubscriptionId };
  } else {
    // Legacy fallback: the latest real checkout session (subscription renewals carry
    // no sessionId, so filter them out).
    const lastPayment = await prisma.payment.findFirst({
      where: { userId, stripeSessionId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { stripeSessionId: true },
    });
    if (!lastPayment?.stripeSessionId) {
      return NextResponse.json(
        { error: "Nu am găsit un abonament de gestionat." },
        { status: 400 }
      );
    }
    payload = { sessionId: lastPayment.stripeSessionId };
  }

  const returnUrl = `${process.env.AUTH_URL}/dashboard/packages`;

  const res = await fetch(`${brokerUrl}/api/portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Project-Key": projectKey },
    body: JSON.stringify({ ...payload, returnUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    return NextResponse.json(
      { error: data?.error || "Nu am putut deschide portalul de abonament." },
      { status: res.status === 200 ? 502 : res.status }
    );
  }

  return NextResponse.json({ url: data.url });
}

export const POST = withErrorHandler(_POST);
