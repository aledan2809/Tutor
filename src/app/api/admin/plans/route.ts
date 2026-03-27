export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";
import type Stripe from "stripe";

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().int().min(0), // cents
  interval: z.enum(["MONTH", "YEAR", "ONE_TIME"]),
  trialDays: z.number().int().min(0).nullable().optional(),
  features: z.array(z.string()).optional(),
});

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(plans.map((p) => ({
    ...p,
    price: p.price / 100,
    subscriberCount: p._count.users,
  })));
}

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Create Stripe product + price
  const stripeProduct = await getStripe().products.create({
    name: parsed.data.name,
    metadata: { source: "tutor" },
  });

  const stripePriceParams: Stripe.PriceCreateParams = {
    product: stripeProduct.id,
    currency: "usd",
    unit_amount: parsed.data.price,
  };

  if (parsed.data.interval !== "ONE_TIME") {
    stripePriceParams.recurring = {
      interval: parsed.data.interval === "MONTH" ? "month" : "year",
    };
  }

  const stripePrice = await getStripe().prices.create(stripePriceParams);

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: parsed.data.name,
      stripeId: stripePrice.id,
      price: parsed.data.price,
      interval: parsed.data.interval,
      trialDays: parsed.data.trialDays ?? null,
      features: parsed.data.features ?? [],
    },
  });

  return NextResponse.json({ ...plan, price: plan.price / 100 }, { status: 201 });
}
