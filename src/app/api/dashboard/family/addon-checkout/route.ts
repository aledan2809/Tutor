export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { getFamilyOverview } from "@/lib/family-invite";
import { childSeatMonthlyMinor, forInterval, parentUpgradeMonthlyMinor } from "@/lib/checkout-price";
import { lockedDiscount, monthlyPlanPriceMinor } from "@/lib/checkout-facts";
import { paysByCard } from "@/lib/card-subscription";
import { isPaidSubscriber } from "@/lib/escalation/segmentation";
import { individualPlan } from "@/lib/access";
import { parentUpgradeOf, resolveFamilyPlanFromRecord } from "@/lib/family";

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
 *
 * The same route sells the family's move to the package with one more parent (`{ type: "parent" }`:
 * Family → Family Duo). The broker cannot change a plan, so the family pays the DIFFERENCE as its own
 * small recurring line; together with the plan it pays exactly the bigger package's price and gets its
 * seats (metadata.type="parent_addon" → paidExtraParentSeats++). Stopping it puts the family back on
 * its own package.
 */

const INTERVAL_MAP: Record<string, "month" | "year"> = { MONTH: "month", YEAR: "year" };
const CURRENCY = process.env.TUTOR_CURRENCY || "ron";

async function _POST(req: Request) {
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
      id: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      stripeSubscriptionId: true,
      subscriptionPlan: {
        select: { name: true, price: true, interval: true, isActive: true, familyPlanKey: true, maxParents: true, maxChildren: true },
      },
    },
  });
  const plan = u?.subscriptionPlan;
  // A cancelled or expired subscription keeps its plan on the account; an add-on billed next to
  // it would charge for a family that no longer pays. The 7-day trial has no plan at all.
  if (!u || !plan || !plan.isActive || !isPaidSubscriber(u)) {
    return NextResponse.json(
      { error: "Ai nevoie de un pachet de familie activ ca să adaugi un copil." },
      { status: 400 }
    );
  }
  // Elev pays for one learner and covers no child (access.ts): a seat bought next to it would be
  // charged every month for a child who stays paused (review r6, P4).
  if (individualPlan(plan)) {
    return NextResponse.json(
      { error: "Pachetul Elev e pentru un singur cursant. Treci la Family ca să adaugi un copil." },
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

  const input = (await req.json().catch(() => null)) as { type?: unknown } | null;
  const wants = input?.type === "parent" ? "parent" : "child";
  const overview = await getFamilyOverview(userId);

  if (wants === "parent") {
    return parentUpgradeCheckout({ userId, email: session.user.email, plan, u, overview, brokerUrl, projectKey, interval });
  }
  // seats.children.max = plan base + already-paid add-on seats. This add-on pays for
  // the NEXT seat (1-based), which sets the loyalty discount tier.
  const childIndex = overview.seats.children.max + 1;
  // The family's lifetime discount (trial offer or code, then Telegram) applies to the extra child's
  // seat too, on top of the child's own discount (Alex 17.09.2026) — while the card subscription that
  // locked it runs, not next to a later year from a code. Annual = ten months of today's monthly price.
  const [locked, byCard, planMonthly] = await Promise.all([lockedDiscount(userId), paysByCard(u), monthlyPlanPriceMinor(plan)]);
  const monthly = childSeatMonthlyMinor(planMonthly, childIndex, byCard ? (locked?.percent ?? 0) : 0);
  // Minor units (bani); the broker wants MAJOR units.
  const amount = forInterval(monthly, plan.interval === "YEAR" ? "YEAR" : "MONTH") / 100;

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

/**
 * „Treci pe Family Duo": the difference to the package with one more parent, as its own recurring line.
 * Only next to a family package that has such a package, only once, and only when a second adult is
 * really left out — nobody pays for a seat nobody uses.
 */
async function parentUpgradeCheckout(input: {
  userId: string;
  email: string | null | undefined;
  plan: { name: string; price: number; interval: string; familyPlanKey: string | null; maxParents: number | null; maxChildren: number | null };
  u: { id: string; subscriptionStatus: string | null; subscriptionEndsAt: Date | null; stripeSubscriptionId: string | null };
  overview: Awaited<ReturnType<typeof getFamilyOverview>>;
  brokerUrl: string;
  projectKey: string;
  interval: "month" | "year";
}) {
  const { userId, plan, u, overview, brokerUrl, projectKey, interval } = input;
  const own = resolveFamilyPlanFromRecord(plan);
  const upgrade = parentUpgradeOf(own);
  if (!upgrade) {
    return NextResponse.json({ error: "Nu există un pachet cu mai mulți părinți." }, { status: 400 });
  }
  if (overview.paidExtraParentSeats > 0) {
    return NextResponse.json({ error: `Familia are deja pachetul „${upgrade.label}".` }, { status: 409 });
  }
  // Only next to a package paid by card: the difference is billed next to it.
  if (!(await paysByCard(u))) {
    return NextResponse.json({ error: "Trecerea se plătește lângă un abonament plătit cu cardul." }, { status: 400 });
  }
  // The bigger package's monthly price, from the row a price change edits (never the annual row).
  const target = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, interval: "MONTH", familyPlanKey: upgrade.key },
    orderBy: { price: "asc" },
    select: { price: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Nu există un pachet cu mai mulți părinți." }, { status: 400 });
  }
  const [locked, byCard, planMonthly] = await Promise.all([lockedDiscount(userId), paysByCard(u), monthlyPlanPriceMinor(plan)]);
  const monthly = parentUpgradeMonthlyMinor(planMonthly, target.price, byCard ? (locked?.percent ?? 0) : 0);
  if (monthly <= 0) {
    return NextResponse.json({ error: "Nu am putut calcula diferența de preț." }, { status: 400 });
  }
  const amount = forInterval(monthly, plan.interval === "YEAR" ? "YEAR" : "MONTH") / 100;

  const res = await fetch(`${brokerUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Project-Key": projectKey },
    body: JSON.stringify({
      projectSlug: "tutor",
      mode: "subscription",
      currency: CURRENCY,
      lineItems: [{ name: `Trecerea pe ${upgrade.label} (diferența)`, amount, interval, intervalCount: 1 }],
      successUrl: `${process.env.AUTH_URL}/dashboard/family?addon=ok`,
      cancelUrl: `${process.env.AUTH_URL}/dashboard/family`,
      callbackUrl: `${process.env.AUTH_URL}/api/stripe/callback`,
      customerEmail: input.email || undefined,
      metadata: { userId, type: "parent_addon", upgradeTo: upgrade.key },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    return NextResponse.json({ error: data?.error || "Nu am putut porni plata." }, { status: res.status === 200 ? 502 : res.status });
  }
  return NextResponse.json({ url: data.url });
}

export const POST = withErrorHandler(_POST);
