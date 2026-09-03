"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function WatcherNav() {
  // Aceleasi cuvinte ca in sidebar. Etichetele erau generice si repetau exact
  // numele altor doua destinatii din acelasi meniu: trei intrari citeau
  // "Notificari" si trei citeau "Setari".
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/watcher", label: t("watcher") },
    { href: "/dashboard/watcher/notifications", label: t("watcherNotifications") },
    { href: "/dashboard/watcher/setari", label: t("watcherSettings") },
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
