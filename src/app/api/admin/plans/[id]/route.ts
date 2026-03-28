import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json({ ...plan, price: plan.price / 100, subscriberCount: plan._count.users });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  // Build update data — only include fields that were sent
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.features !== undefined) data.features = body.features;
  if (body.trialDays !== undefined) data.trialDays = body.trialDays;
  if (body.price !== undefined) data.price = body.price; // already in cents from client
  if (body.interval !== undefined) data.interval = body.interval;

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ...plan, price: plan.price / 100 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;

  // Check for active subscribers
  const subscriberCount = await prisma.user.count({
    where: { subscriptionPlanId: id },
  });

  if (subscriberCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete plan with ${subscriberCount} active subscriber(s). Deactivate it instead.` },
      { status: 409 }
    );
  }

  await prisma.subscriptionPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
