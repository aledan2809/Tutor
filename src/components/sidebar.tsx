"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import Image from "next/image";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isSuperAdmin: boolean;
    enrollments?: { domainId: string; domainSlug: string; roles: string[] }[];
  };
}

export function Sidebar({ user }: SidebarProps) {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/dashboard/lessons", label: t("lessons") },
    { href: "/dashboard/practice", label: t("practice") },
    { href: "/dashboard/assessment", label: t("assessment") },
    { href: "/dashboard/exams", label: t("exams") },
    { href: "/dashboard/progress", label: t("progress") },
    { href: "/dashboard/calendar", label: t("calendar") },
    { href: "/dashboard/notifications", label: t("notifications") },
    { href: "/dashboard/settings", label: t("settings") },
  ];

  const isWatcher =
    user.isSuperAdmin ||
    user.enrollments?.some((e) => e.roles.includes("WATCHER"));

  const isInstructor =
    user.isSuperAdmin ||
    user.enrollments?.some(
      (e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN")
    );

  const isAdmin =
    user.isSuperAdmin ||
    user.enrollments?.some((e) => e.roles.includes("ADMIN"));

  if (isWatcher) {
    navItems.push({ href: "/dashboard/watcher", label: t("watcher") });
  }
  if (isInstructor) {
    navItems.push({ href: "/dashboard/instructor", label: t("instructor") });
  }
  if (isAdmin) {
    navItems.push({ href: "/dashboard/admin", label: t("admin") });
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-blue-500">
          Tutor
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/10 text-blue-500"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <LocaleSwitcher />
        <div className="mt-3 flex items-center gap-3">
          {user.image && (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-3 w-full rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          {tAuth("signOut")}
        </button>
      </div>
    </aside>
  );
}
