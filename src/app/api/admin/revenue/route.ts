import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    totalUsers,
    activeSubscriptions,
    payments,
    recentPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: "active" } }),
    prisma.payment.aggregate({
      where: { status: "succeeded", createdAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Calculate MRR from active subscriptions
  const activePlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    include: { _count: { select: { users: { where: { subscriptionStatus: "active" } } } } },
  });

  const mrr = activePlans.reduce((sum, plan) => {
    const monthlyPrice = plan.interval === "YEAR" ? plan.price / 12 : plan.price;
    return sum + monthlyPrice * plan._count.users;
  }, 0);

  // Churn: users who canceled in period / total active at start
  const canceledInPeriod = await prisma.user.count({
    where: {
      subscriptionStatus: "canceled",
      updatedAt: { gte: since },
    },
  });
  const churnRate = activeSubscriptions > 0
    ? canceledInPeriod / (activeSubscriptions + canceledInPeriod)
    : 0;

  // Conversion rate: paying users / total users
  const conversionRate = totalUsers > 0 ? activeSubscriptions / totalUsers : 0;

  return NextResponse.json({
    mrr: mrr / 100, // Convert cents to dollars
    totalRevenue: (payments._sum.amount || 0) / 100,
    totalTransactions: payments._count,
    totalUsers,
    activeSubscriptions,
    churnRate: Math.round(churnRate * 10000) / 100, // percentage with 2 decimals
    conversionRate: Math.round(conversionRate * 10000) / 100,
    recentPayments: recentPayments.map((p) => ({
      ...p,
      amount: p.amount / 100,
    })),
    planDistribution: activePlans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price / 100,
      interval: p.interval,
      subscribers: p._count.users,
    })),
  });
}
