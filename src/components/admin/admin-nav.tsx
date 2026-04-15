"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

const adminLinks = [
  { href: "/dashboard/admin", labelKey: "overview", superAdminOnly: false },
  { href: "/dashboard/admin/questions", labelKey: "questions", superAdminOnly: false },
  { href: "/dashboard/admin/questions/review", labelKey: "reviewQueue", superAdminOnly: false },
  { href: "/dashboard/admin/domains", labelKey: "domains", superAdminOnly: false },
  { href: "/dashboard/admin/tags", labelKey: "tags", superAdminOnly: false },
  { href: "/dashboard/admin/questions/import", labelKey: "import", superAdminOnly: false },
  { href: "/dashboard/admin/questions/generate", labelKey: "aiGenerate", superAdminOnly: false },
  { href: "/dashboard/admin/exam-formats", labelKey: "examFormats", superAdminOnly: false },
  { href: "/dashboard/admin/templates", labelKey: "escalationTemplates", superAdminOnly: false },
  { href: "/dashboard/admin/aviation/seed-demo", labelKey: "aviationSeed", superAdminOnly: true },
  { href: "/dashboard/admin/superadmin", labelKey: "superAdmin", superAdminOnly: true },
];

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.isSuperAdmin;

  const visibleLinks = adminLinks.filter(
    (link) => !link.superAdminOnly || isSuperAdmin
  );

  return (
    <nav className="mt-4 flex flex-wrap gap-2">
      {visibleLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? link.superAdminOnly ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
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
