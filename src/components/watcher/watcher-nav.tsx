"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function WatcherNav() {
  const t = useTranslations("watcher");
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/watcher", label: t("title") },
    { href: "/dashboard/watcher/notifications", label: t("notifications") },
  ];

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/dashboard/watcher" &&
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
