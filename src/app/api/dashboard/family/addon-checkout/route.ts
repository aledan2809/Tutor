export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { getFamilyOverview } from "@/lib/family-invite";
import { childDiscountPercent } from "@/lib/family";

/**
 * Per-child add-on checkout via the Stripe Checkout Broker.
 *
 * The family plans all carry maxChildren:1, so a 2nd+ child is always a paid
 * add-on (never an upgrade). We charge the owner's plan price PER CHILD, minus the
 * loyalty discount (−20% for the 2nd, −30% for the 3rd+), as a recurring line that
 * bills alongside the main subscription. The broker keeps the Stripe key; on
 * activation it calls /api/stripe/callback with metadata.type="child_addon" →
 * paidExtraChildSeats++. NO broker code is touched — a custom `amount` line item
 * is a first-class broker feature.
 */

const INTERVAL_MAP: Record<string, "month" | "year"> = { MONTH: "month", YEAR: "year" };
const CURRENCY = process.env.TUTOR_CURRENCY || "ron";

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
    select: {
      subscriptionPlan: { select: { name: true, price: true, interval: true, isActive: true } },
    },
  });
  const plan = u?.subscriptionPlan;
  if (!plan || !plan.isActive) {
    return NextResponse.json(
      { error: "Ai nevoie de un pachet de familie activ ca să adaugi un copil." },
      { status: 400 }
    );
  }
  const interval = INTERVAL_MAP[plan.interval];
  if (!interval) {
    return NextResponse.json(
      { error: "Pachetul curent nu permite adăugarea recurentă a unui copil." },
      { status: 400 }
    );
  }

  const overview = await getFamilyOverview(userId);
  // seats.children.max = plan base + already-paid add-on seats. This add-on pays for
  // the NEXT seat (1-based), which sets the loyalty discount tier.
  const childIndex = overview.seats.children.max + 1;
  const discount = childDiscountPercent(childIndex);
  // plan.price is minor units (cents); the broker wants MAJOR units.
  const base = plan.price / 100;
  const amount = Math.round(base * (1 - discount / 100) * 100) / 100;

  const successUrl = `${process.env.AUTH_URL}/dashboard/family?addon=ok`;
  const cancelUrl = `${process.env.AUTH_URL}/dashboard/family`;
  const callbackUrl = `${process.env.AUTH_URL}/api/stripe/callback`;

  const body = {
    projectSlug: "tutor",
    mode: "subscription",
    currency: CURRENCY,
    lineItems: [
      {
        name: `Copil suplimentar (${plan.name})`,
        amount,
        interval,
        intervalCount: 1,
      },
    ],
    successUrl,
    cancelUrl,
    callbackUrl,
    customerEmail: session.user.email || undefined,
    metadata: { userId, type: "child_addon", childIndex: String(childIndex) },
  };

  const res = await fetch(`${brokerUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Project-Key": projectKey },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    return NextResponse.json(
      { error: data?.error || "Nu am putut porni plata." },
      { status: res.status === 200 ? 502 : res.status }
    );
  }

  return NextResponse.json({ url: data.url });
}

export const POST = withErrorHandler(_POST);
