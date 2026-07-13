import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export default async function SuperAdminOverview() {
  const [
    totalUsers,
    activeSubscriptions,
    totalVouchers,
    totalPayments,
    activeAds,
    recentAudit,
    referralPayable,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: "active" } }),
    prisma.voucher.count({ where: { isActive: true } }),
    prisma.payment.count({ where: { status: "succeeded" } }),
    prisma.adPlacement.count({ where: { isActive: true } }),
    prisma.adminAuditLog.count(),
    prisma.referralEarning.aggregate({
      where: { status: { in: ["PENDING", "PAYABLE"] } },
      _sum: { amount: true },
    }),
  ]);

  const referralOwedLei = Math.round((referralPayable._sum.amount ?? 0) / 100);

  const stats = [
    { label: "Total Users", value: totalUsers, color: "text-blue-400", href: "/dashboard/admin/superadmin/users" },
    { label: "Active Subscriptions", value: activeSubscriptions, color: "text-green-400", href: "/dashboard/admin/superadmin/plans" },
    { label: "Active Vouchers", value: totalVouchers, color: "text-purple-400", href: "/dashboard/admin/superadmin/vouchers" },
    { label: "Total Payments", value: totalPayments, color: "text-yellow-400", href: "/dashboard/admin/superadmin/revenue" },
    { label: "Active Ads", value: activeAds, color: "text-pink-400", href: "/dashboard/admin/superadmin/ads" },
    { label: "Audit Entries", value: recentAudit, color: "text-gray-400", href: "/dashboard/admin/superadmin/audit" },
    { label: "Comisioane de plată (lei)", value: referralOwedLei, color: "text-amber-400", href: "/dashboard/admin/superadmin/referrals" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700 hover:bg-gray-800"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
