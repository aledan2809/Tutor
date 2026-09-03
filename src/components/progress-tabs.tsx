"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

// „Progresul meu" = 3 secțiuni (§213 merge Progres + Gamificare, + Rapoarte).
// Rutele rămân separate; tab-urile le unesc sub un singur item de meniu.
//
// Rapoarte a stat în sidebar ca intrare plată separată, deși e tot despre cum stă
// elevul — aici e lângă Statistici și Realizări, adică unde apare întrebarea.
const tabs = [
  { href: "/dashboard/progress", key: "progressStats" },
  { href: "/dashboard/gamification", key: "progressAchievements" },
  { href: "/dashboard/rapoarte", key: "reports" },
];

/**
 * @param showStudentTabs false pentru un părinte pe /dashboard/rapoarte: Statistici
 *   și Realizări sunt paginile ELEVULUI și lipsesc din meniul lui de părinte — un
 *   tab care duce într-o pagină pe care n-o are în meniu e o fundătură.
 */
export function ProgressTabs({ showStudentTabs = true }: { showStudentTabs?: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const visible = showStudentTabs
    ? tabs
    : tabs.filter((x) => x.href === "/dashboard/rapoarte");
  // Un singur tab nu e o navigație — e o etichetă. Nu-l randăm.
  if (visible.length < 2) return null;
  return (
    <div className="flex gap-1 border-b border-gray-800">
      {visible.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px inline-flex min-h-[44px] items-center border-b-2 px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-blue-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </div>
  );
}
