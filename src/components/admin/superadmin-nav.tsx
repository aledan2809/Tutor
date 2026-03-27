"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const superadminLinks = [
  { href: "/dashboard/admin/superadmin", labelKey: "saOverview" },
  { href: "/dashboard/admin/superadmin/users", labelKey: "saUsers" },
  { href: "/dashboard/admin/superadmin/plans", labelKey: "saPlans" },
  { href: "/dashboard/admin/superadmin/vouchers", labelKey: "saVouchers" },
  { href: "/dashboard/admin/superadmin/revenue", labelKey: "saRevenue" },
  { href: "/dashboard/admin/superadmin/ads", labelKey: "saAds" },
  { href: "/dashboard/admin/superadmin/audit", labelKey: "saAudit" },
];

export function SuperAdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin");

  return (
    <nav className="mt-4 flex flex-wrap gap-2">
      {superadminLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
