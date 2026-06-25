"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

// A4: a social-app style bottom tab bar on mobile so the core student actions are
// one tap away (no hamburger hunting). Desktop keeps the sidebar (lg:hidden here).
// Shown only to learners (a STUDENT enrollment) — parents/instructors keep the menu.

type Tab = { href: string; key: string; icon: React.ReactNode };

const icon = (paths: React.ReactNode) => (
  <svg
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.6}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
);

const TABS: Tab[] = [
  {
    href: "/dashboard/practice",
    key: "tabLearn",
    icon: icon(
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 4v16" />
      </>
    ),
  },
  {
    href: "/dashboard/exam-bank",
    key: "tabSim",
    icon: icon(
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    href: "/dashboard/progress",
    key: "tabProgress",
    icon: icon(
      <>
        <path d="M5 20v-6M12 20V8M19 20v-9" />
        <path d="M3 20h18" />
      </>
    ),
  },
  {
    href: "/dashboard/settings",
    key: "tabProfile",
    icon: icon(
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </>
    ),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-800 bg-gray-950/95 backdrop-blur lg:hidden">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              active ? "text-blue-400" : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.icon}
            <span>{t(tab.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
