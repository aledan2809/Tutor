"use client";

import { useState, useEffect, useRef } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileAsideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileAsideRef.current) return;
    if (mobileOpen) {
      mobileAsideRef.current.removeAttribute("inert");
    } else {
      mobileAsideRef.current.setAttribute("inert", "");
    }
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const navItems = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/dashboard/lessons", label: t("lessons") },
    { href: "/dashboard/bibliography", label: t("bibliography") },
    { href: "/dashboard/practice", label: t("practice") },
    { href: "/dashboard/assessment", label: t("assessment") },
    { href: "/dashboard/exams", label: t("exams") },
    { href: "/dashboard/exam-bank", label: t("examBank") },
    { href: "/dashboard/activare", label: t("activare") },
    { href: "/dashboard/progress", label: t("progress") },
    { href: "/dashboard/domains", label: t("domains") },
    { href: "/dashboard/calendar", label: t("calendar") },
    { href: "/dashboard/notifications", label: t("notifications") },
    { href: "/dashboard/gamification", label: t("gamification") },
    { href: "/dashboard/referrals", label: t("referrals") },
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

  // §213 rol 2 — un cont WATCHER pur (părinte) monitorizează un copil; nu e el însuși elev.
  const isStudent =
    user.enrollments?.some((e) => e.roles.includes("STUDENT"));

  if (isWatcher) {
    navItems.push({ href: "/dashboard/watcher", label: t("watcher") });
    navItems.push({ href: "/dashboard/watcher/notifications", label: t("watcherNotifications") });
  }
  if (isInstructor) {
    navItems.push({ href: "/dashboard/instructor", label: t("instructor") });
  }
  if (isAdmin) {
    navItems.push({ href: "/dashboard/admin", label: t("admin") });
  }

  // HIDDEN 2026-06-04 (§213 restructurare meniuri) — item-uri goale/niche ascunse
  // temporar din nav; rutele rămân funcționale. Decizie ulterioară (populăm / unificăm /
  // scoatem) în Projects/Tutor/TODO_PERSISTENT.md §213.
  const HIDDEN_NAV = new Set([
    "/dashboard/lessons", // Lesson = 0
    "/dashboard/assessment", // Assessment = 0
    "/dashboard/exams", // ExamSimulation = 1 (~gol; exam-bank/Simulări rămâne)
    "/dashboard/bibliography", // Bibliography = 11 (niche juridic/aviation)
    "/dashboard/gamification", // MERGE → „Progresul meu" (tab Realizări) — §213
  ]);
  let visibleNavItems = navItems.filter((item) => !HIDDEN_NAV.has(item.href));

  // §213 rol 2 — PĂRINTE: un cont WATCHER pur (nu și elev/instructor/superadmin) primește
  // meniul focalizat pe monitorizarea copilului. Fluxul de învățare al elevului
  // (Practică/Simulări/Progresul meu/Domenii/Calendar) e ascuns din nav — rutele rămân
  // funcționale (conditional render, reversibil). SuperAdmin + instructor + elev păstrează
  // meniul actual (instructor = rol 3, restructurat ulterior). Ordine per mockup design
  // (knowledge/menu-restructure-mockups.md ROL 2): Panou · Monitorizare · Alerte ·
  // Invită un prieten · Notificări · Setări.
  const isParentView =
    !user.isSuperAdmin && isWatcher && !isInstructor && !isStudent;
  if (isParentView) {
    visibleNavItems = [
      { href: "/dashboard", label: t("dashboard") },
      { href: "/dashboard/watcher", label: t("watcher") },
      { href: "/dashboard/watcher/notifications", label: t("watcherNotifications") },
      { href: "/dashboard/referrals", label: t("referrals") },
      { href: "/dashboard/notifications", label: t("notifications") },
      { href: "/dashboard/settings", label: t("settings") },
    ];
  }

  // §213 rol 3 — MEDITATOR: un cont INSTRUCTOR pur (nu admin/superadmin/elev/părinte) primește
  // hub-ul Instructor + preview conținut (Practică/Simulări). Conceptele de elev (Progresul meu/
  // Domenii/Calendar) sunt ascunse din nav — rutele rămân funcționale. Sub-funcțiile Studenți/
  // Grupuri/Obiective/Mesaje/Analiză/Rapoarte trăiesc în pagina /dashboard/instructor. „Invită un
  // prieten" rămâne vizibil (meditatorul câștigă din referral — decizie user 2026-06-04). Ordine
  // per mockup design (knowledge/menu-restructure-mockups.md ROL 3).
  const isInstructorRole =
    user.enrollments?.some((e) => e.roles.includes("INSTRUCTOR"));
  const isMeditatorView =
    !user.isSuperAdmin && !isAdmin && isInstructorRole && !isStudent && !isWatcher;
  if (isMeditatorView) {
    visibleNavItems = [
      { href: "/dashboard", label: t("dashboard") },
      { href: "/dashboard/instructor", label: t("instructor") },
      { href: "/dashboard/practice", label: t("practice") },
      { href: "/dashboard/exam-bank", label: t("examBank") },
      { href: "/dashboard/referrals", label: t("referrals") },
      { href: "/dashboard/notifications", label: t("notifications") },
      { href: "/dashboard/settings", label: t("settings") },
    ];
  }

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-blue-500">
          Tutor
        </Link>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="text-gray-400 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors ${
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
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-3 w-full min-h-[44px] rounded-lg border border-gray-700 px-3 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          {tAuth("signOut")}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-gray-700 bg-gray-900 p-2 text-gray-400 hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        ref={mobileAsideRef}
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800 bg-gray-950 transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-800 bg-gray-950 lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
