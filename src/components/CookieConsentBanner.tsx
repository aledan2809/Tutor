"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  COOKIE_BANNER_HEIGHT_VAR,
  COOKIE_CONSENT_KEY,
  parseStoredConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/cookie-consent";

/**
 * GDPR cookie consent banner. Records the visitor's choice locally and notifies
 * the Legal Hub (legal.knowbest.ro) via /api/v1/consent/record (best-effort, never
 * blocks the UI). Links to the versioned Cookies + Privacy policies. eTutor uses
 * only essential (session) cookies today, so the banner is informational + consent
 * evidence; no non-essential cookie is set before a choice.
 *
 * Layout: one compact strip at the bottom that never covers the page. While it is
 * shown, its height is published as `--cookie-banner-h` on <html>; the body is padded
 * by that much (globals.css) and the other bottom-pinned pieces (WhatsApp button,
 * mobile nav) sit on top of it. On a phone the old two-row card covered 470–664 px of
 * a 664 px screen — every main button of the first visit (True E2E 2026-10-05, §0).
 */
export function CookieConsentBanner() {
  const t = useTranslations("cookieBanner");
  const locale = useLocale();
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!parseStoredConsent(localStorage.getItem(COOKIE_CONSENT_KEY))) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!show || !el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty(COOKIE_BANNER_HEIGHT_VAR, `${Math.ceil(el.getBoundingClientRect().height)}px`);
    publish();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(publish) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.removeProperty(COOKIE_BANNER_HEIGHT_VAR);
    };
  }, [show]);

  const decide = (choice: ConsentChoice) => {
    // Persists + notifies this tab, so a consent-gated third party (One Tap)
    // can start without a reload.
    writeConsent(choice);
    fetch("/api/v1/consent/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "COOKIES", choice, locale }),
    }).catch((err) => {
      console.error("[CookieConsent] Failed to record consent:", err);
    });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-gray-700 bg-gray-900/95 px-3 py-1.5 shadow-2xl backdrop-blur sm:py-2"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label={t("aria")}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-4">
        <p className="min-w-0 flex-1 text-xs leading-snug text-gray-300 sm:text-sm">
          {/* Phone: one short line. Wider screens: the full sentence with both policies. */}
          <span className="sm:hidden">
            {t("short")}{" "}
            <Link href="/cookies" className="text-blue-400 underline hover:text-blue-300">
              {t("details")}
            </Link>
          </span>
          <span className="hidden sm:inline">
            {t("text")}{" "}
            <Link href="/cookies" className="text-blue-400 underline hover:text-blue-300">
              {t("cookiesLink")}
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-blue-400 underline hover:text-blue-300">
              {t("privacyLink")}
            </Link>
            .
          </span>
        </p>
        <div className="flex flex-shrink-0 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="min-h-[44px] rounded-lg border border-gray-600 px-3 text-xs font-medium text-gray-300 hover:bg-gray-800 sm:px-4 sm:text-sm"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="min-h-[44px] rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 sm:px-4 sm:text-sm"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
