"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { buildNavSections } from "@/lib/nav-sections";
import Image from "next/image";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isSuperAdmin: boolean;
    accountRole?: "STUDENT" | "PARENT" | "TUTOR" | null;
    enrollments?: { domainId: string; domainSlug: string; roles: string[] }[];
  };
  /** True when the user holds an active family subscription plan (parent/child
   *  seats), so the family section shows even without a WATCHER enrollment. */
  hasFamilyPlan?: boolean;
}

export function Sidebar({ user, hasFamilyPlan = false }: SidebarProps) {
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

  const sections = buildNavSections(user, hasFamilyPlan);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-6">
        <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-xl font-bold text-blue-500">
          Tutor
        </Link>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="-m-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {section.labelKey && (
              <p
                className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                aria-hidden
              >
                {t(section.labelKey)}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href && !item.locked;
              return (
                <Link
                  key={item.locked ? `locked-${item.href}` : item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                    item.locked
                      ? "text-amber-500/70 hover:bg-gray-800 hover:text-amber-400"
                      : isActive
                        ? "bg-blue-600/10 text-blue-500"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.locked && <span aria-hidden>🔒</span>}
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        ))}
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
        className="fixed left-4 top-4 z-40 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-700 bg-gray-900 p-2 text-gray-400 hover:text-white lg:hidden"
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
