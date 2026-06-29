"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const KEY = "etutor_cookie_consent_v1";

/**
 * GDPR cookie consent banner. Records the visitor's choice locally and notifies
 * the Legal Hub (legal.knowbest.ro) via /api/v1/consent/record (best-effort, never
 * blocks the UI). Links to the versioned Cookies + Privacy policies. eTutor uses
 * only essential (session) cookies today, so the banner is informational + consent
 * evidence; no non-essential cookie is set before a choice.
 */
export function CookieConsentBanner() {
  const t = useTranslations("cookieBanner");
  const locale = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const decide = (choice: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
    fetch("/api/v1/consent/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "COOKIES", choice, locale }),
    }).catch(() => {});
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-5"
      role="dialog"
      aria-label={t("aria")}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl sm:flex sm:items-center sm:gap-5">
        <div className="flex flex-1 items-start gap-3">
          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">
            🍪
          </span>
          <p className="text-sm text-gray-300">
            {t("text")}{" "}
            <Link href="/cookies" className="text-blue-400 underline hover:text-blue-300">
              {t("cookiesLink")}
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-blue-400 underline hover:text-blue-300">
              {t("privacyLink")}
            </Link>
            .
          </p>
        </div>
        <div className="mt-4 flex gap-2 sm:mt-0 sm:flex-shrink-0">
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="min-h-[44px] rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
