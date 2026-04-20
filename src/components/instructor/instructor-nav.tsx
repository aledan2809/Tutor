"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function InstructorNav() {
  const t = useTranslations("instructor");
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/instructor", label: t("overview") },
    { href: "/dashboard/instructor/students", label: t("students") },
    { href: "/dashboard/instructor/questions", label: t("questions") },
    { href: "/dashboard/instructor/groups", label: t("groups") },
    { href: "/dashboard/instructor/goals", label: t("goals") },
    { href: "/dashboard/instructor/messages", label: t("messages") },
    { href: "/dashboard/instructor/analytics", label: t("analytics") },
    { href: "/dashboard/instructor/reports", label: t("reports") },
    { href: "/dashboard/instructor/settings", label: t("settings") },
  ];

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/dashboard/instructor" &&
            pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600/10 text-blue-500"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
