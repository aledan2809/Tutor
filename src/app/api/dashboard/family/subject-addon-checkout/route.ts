export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { paysByCard } from "@/lib/card-subscription";
import { paidSubjects, planLearner, subjectAddonQuote, subjectNeedsPayment } from "@/lib/checkout-facts";
import { activeSetters, lockedText } from "@/lib/guardian-lock";

/**
 * A subject added after the card payment, on its own small subscription (Alex 17.09.2026), through
 * the Stripe Checkout Broker like the extra child's seat. The price is the plan's monthly price with
 * the subject's discount (2nd −15%, from the 3rd −25%) and the family's lifetime discount, billed like
 * the main subscription. On activation the callback counts one more paid subject
 * (metadata.type = "subject_addon") and turns on the subject it was bought for, when the page named
 * one (body.domainId: from the child's subject list or the learner's own); the payment page then
 * returns to that list.
 */

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

  const userId = session.user.id;
  const payer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      stripeSubscriptionId: true,
      subscriptionPlan: { select: { name: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true } },
    },
  });
  // Only next to a card subscription that counted its subjects: a code year or an account marked
  // paid by hand has every subject already, and nothing would be billed next to it.
  const [counted, quote] = await Promise.all([paidSubjects(userId), subjectAddonQuote(userId)]);
  if (!payer || !counted || !quote || !(await paysByCard(payer))) {
    return NextResponse.json({ error: "Materiile în plus se adaugă lângă un abonament plătit cu cardul." }, { status: 400 });
  }
  const learnerId = counted.learnerId ?? (await planLearner(userId, payer.subscriptionPlan));

  // The subject it is bought for, when the page named one: only a subject that does need paying for,
  // for the learner the subscription counts (another child's subjects aren't limited).
  const input = (await req.json().catch(() => null)) as { domainId?: unknown; childId?: unknown } | null;
  const domainId = typeof input?.domainId === "string" && input.domainId ? input.domainId : null;
  const childId = typeof input?.childId === "string" && input.childId ? input.childId : null;
  if (childId && childId !== learnerId) {
    return NextResponse.json({ error: "Materiile în plus se plătesc pentru copilul din abonament." }, { status: 400 });
  }
  if (domainId && learnerId === userId) {
    // A learner paying for themselves doesn't buy back a subject a parent removed (guardian-lock.ts).
    const removed = await prisma.enrollment.findUnique({
      where: { userId_domainId: { userId, domainId } },
      select: { isActive: true, setById: true },
    });
    if (removed && !removed.isActive && removed.setById) {
      const owner = (await activeSetters(userId, [removed.setById])).get(removed.setById);
      if (owner) return NextResponse.json({ error: lockedText(owner, "subject"), locked: true }, { status: 403 });
    }
  }
  if (domainId && (!learnerId || !(await subjectNeedsPayment(learnerId, domainId)))) {
    return NextResponse.json({ error: "Materia aceasta se poate adăuga fără plată: încearcă din nou." }, { status: 409 });
  }

  const base = process.env.AUTH_URL;
  // Back to the list the payment started from: the child's chapter on the parent's page, or the
  // learner's own subjects — naming the subject, so the list stops looking once it is there.
  const paidSubject = domainId ? `subject=paid&domain=${encodeURIComponent(domainId)}` : "subject=paid";
  const back =
    domainId && learnerId
      ? learnerId === userId
        ? { path: "/dashboard/domains", paid: `/dashboard/domains?${paidSubject}` }
        : { path: `/dashboard/watcher?child=${learnerId}`, paid: `/dashboard/watcher?child=${learnerId}&${paidSubject}` }
      : { path: "/dashboard/packages", paid: `/dashboard/packages?${paidSubject}` };
  const body = {
    projectSlug: "tutor",
    mode: "subscription",
    currency: CURRENCY,
    lineItems: [
      {
        name: `${quote.planName} · materia a ${quote.subjectIndex}-a`,
        amount: quote.minor / 100,
        interval: quote.interval === "YEAR" ? "year" : "month",
        intervalCount: 1,
      },
    ],
    successUrl: `${base}${back.paid}`,
    cancelUrl: `${base}${back.path}`,
    callbackUrl: `${base}/api/stripe/callback`,
    customerEmail: session.user.email || undefined,
    metadata: { userId, type: "subject_addon", learnerId: learnerId ?? null, subjectIndex: quote.subjectIndex, domainId },
  };

  const res = await fetch(`${brokerUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Project-Key": projectKey },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    return NextResponse.json({ error: data?.error || "Nu am putut porni plata." }, { status: res.status === 200 ? 502 : res.status });
  }
  return NextResponse.json({ url: data.url });
}

export const POST = withErrorHandler(_POST);
