import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      name: body.name,
      isActive: body.isActive,
      features: body.features,
      trialDays: body.trialDays,
    },
  });

  return NextResponse.json({ ...plan, price: plan.price / 100 });
}
