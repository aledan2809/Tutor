"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * A short „Cum funcționează" block, collapsed by default, on the page where the
 * question comes up.
 *
 * Built on native `<details>/<summary>` rather than a custom disclosure: keyboard
 * handling, focus and the collapsed/expanded announcement come from the browser
 * and cannot be got subtly wrong. The visual is the one from the Telegram connect
 * card, which is the explainer in this app people actually read.
 */
export function HowItWorks({
  storageKey,
  steps,
  moreHref,
}: {
  /** Also the localStorage key — pages that explain the same thing share one. */
  storageKey: string;
  steps: string[];
  /** Anchor into /dashboard/ajutor with the long version. */
  moreHref?: string;
}) {
  const t = useTranslations("howItWorks");
  const [open, setOpen] = useState(false);

  // Rendered closed on the server, so the markup is the same for everyone; the
  // remembered state is applied after mount.
  useEffect(() => {
    try {
      setOpen(localStorage.getItem(`tutor_hiw_${storageKey}`) === "1");
    } catch {
      /* private mode / storage disabled — collapsed is a fine default */
    }
  }, [storageKey]);

  const remember = (next: boolean) => {
    setOpen(next);
    try {
      if (next) localStorage.setItem(`tutor_hiw_${storageKey}`, "1");
      else localStorage.removeItem(`tutor_hiw_${storageKey}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <details
      open={open}
      onToggle={(e) => remember((e.currentTarget as HTMLDetailsElement).open)}
      className="mb-4 rounded-lg border border-gray-800 bg-gray-900/60"
    >
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <span aria-hidden>ℹ</span>
        {t("title")}
      </summary>
      <div className="px-3 pb-3">
        <ol className="space-y-1.5 text-sm text-gray-300">
          {steps.map((s, i) => (
            <li key={i}>
              <strong className="text-white">{i + 1}.</strong> {s}
            </li>
          ))}
        </ol>
        {moreHref && (
          <Link
            href={moreHref}
            className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300"
          >
            {t("more")} →
          </Link>
        )}
      </div>
    </details>
  );
}
