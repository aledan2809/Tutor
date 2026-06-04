"use client";

import { Link, usePathname } from "@/i18n/navigation";

// „Progresul meu" = 2 secțiuni (§213 merge Progres + Gamificare).
// Rutele rămân separate; tab-urile le unesc sub un singur item de meniu.
const tabs = [
  { href: "/dashboard/progress", label: "Statistici" },
  { href: "/dashboard/gamification", label: "Realizări" },
];

export function ProgressTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-gray-800">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-blue-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
