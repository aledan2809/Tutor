import { prisma } from "@/lib/prisma";

export default async function SuperAdminOverview() {
  const [
    totalUsers,
    activeSubscriptions,
    totalVouchers,
    totalPayments,
    activeAds,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: "active" } }),
    prisma.voucher.count({ where: { isActive: true } }),
    prisma.payment.count({ where: { status: "succeeded" } }),
    prisma.adPlacement.count({ where: { isActive: true } }),
    prisma.adminAuditLog.count(),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers, color: "text-blue-400" },
    { label: "Active Subscriptions", value: activeSubscriptions, color: "text-green-400" },
    { label: "Active Vouchers", value: totalVouchers, color: "text-purple-400" },
    { label: "Total Payments", value: totalPayments, color: "text-yellow-400" },
    { label: "Active Ads", value: activeAds, color: "text-pink-400" },
    { label: "Audit Entries", value: recentAudit, color: "text-gray-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-800 bg-gray-900 p-4"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
