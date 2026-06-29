import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/plans
 * Active packages for the student-facing packages page. Login required (it's a
 * dashboard surface); only safe fields are returned (no stripeId). Price is in
 * major units (RON). Checkout itself goes through /api/admin/stripe/checkout.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      interval: true,
      trialDays: true,
      features: true,
      familyPlanKey: true,
      maxParents: true,
      maxChildren: true,
      maxTutors: true,
    },
  });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true, subscriptionPlanId: true },
  });

  return NextResponse.json({
    plans: plans.map((p) => ({ ...p, price: p.price / 100 })),
    current: {
      subscriptionStatus: me?.subscriptionStatus ?? null,
      subscriptionPlanId: me?.subscriptionPlanId ?? null,
    },
  });
}

export const GET = withErrorHandler(_GET);
