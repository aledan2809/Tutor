"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TrialCountdown } from "@/components/access/trial-countdown";

const HOUR_MS = 60 * 60 * 1000;

/**
 * The free week's time left, in the top bar of every page (Alex, 29.09.2026: „fff vizibil”). Blue while
 * there is time, amber in the last 48 hours, red in the last 24. The same audience as TrialBanner: a
 * parent gets the −30% and the way to the packages (brought forward in the last 48 hours); a learner who
 * made their own account gets only the time — no price, no link (it may be a child).
 */
export function TrialTopBar({
  locale,
  endsAt,
  serverNow,
  audience,
  offerPercent,
}: {
  locale: "ro" | "en";
  endsAt: string;
  serverNow: string;
  audience: "parent" | "self";
  /** The −30% for paying in the account's own free week; null when it doesn't apply. */
  offerPercent: number | null;
}) {
  const ro = locale === "ro";
  const offset = useRef(0);
  const [left, setLeft] = useState<number | null>(null);

  // Only the colour follows this clock; the digits are TrialCountdown's (same server-time correction).
  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const server = new Date(serverNow).getTime();
    if (isNaN(end) || isNaN(server)) return;
    offset.current = Math.max(0, server - Date.now());
    const tick = () => setLeft(end - (Date.now() + offset.current));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [endsAt, serverNow]);

  if (left !== null && left <= 0) return null;
  const last48 = left !== null && left <= 48 * HOUR_MS;
  const last24 = left !== null && left <= 24 * HOUR_MS;
  const tone = last24
    ? "border-red-600/70 bg-red-950/60 text-red-100"
    : last48
      ? "border-amber-500/70 bg-amber-950/60 text-amber-100"
      : "border-blue-700/60 bg-blue-950/50 text-blue-100";
  const offer = audience === "parent" && offerPercent !== null;
  // Read out only when the time crosses 48 h and 24 h — never with the ticking digits.
  const announce = last24
    ? ro
      ? "Au mai rămas mai puțin de 24 de ore din proba gratuită."
      : "Less than 24 hours of the free trial left."
    : last48
      ? ro
        ? "Au mai rămas mai puțin de 48 de ore din proba gratuită."
        : "Less than 48 hours of the free trial left."
      : "";

  return (
    <div className="ml-14 mr-auto flex min-w-0 items-center gap-2 lg:ml-0">
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      <span
        role="timer"
        className={`flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
      >
        {/* On a phone the bar shares the header with the menu, set-up and bell: the hourglass and the
            time without seconds (no hourglass below 360 px); the words are still read out. */}
        <span className="hidden sm:inline">{ro ? "Proba gratuită: mai ai" : "Free trial:"}</span>
        <span className="sm:hidden max-[359px]:hidden" aria-hidden="true">⏳</span>
        <span className="sr-only sm:hidden">{ro ? "Proba gratuită, mai ai" : "Free trial, left"}</span>
        <TrialCountdown endsAt={endsAt} serverNow={serverNow} locale={locale} className="hidden sm:inline" />
        <TrialCountdown endsAt={endsAt} serverNow={serverNow} locale={locale} className="sm:hidden" compact />
        {!ro && <span className="hidden sm:inline">left</span>}
      </span>
      {offer && (
        <Link
          href={`/${locale}/dashboard/packages?plan=FAMILY`}
          className={`hidden shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold lg:inline-flex ${
            last48 ? "bg-amber-500 text-gray-950 hover:bg-amber-400" : "border border-blue-700/60 text-blue-100 hover:bg-blue-900/40"
          }`}
        >
          {last48
            ? ro
              ? `Ultimele 48 de ore: −${offerPercent}% pe viață`
              : `Last 48 hours: −${offerPercent}% for life`
            : ro
              ? `−${offerPercent}% dacă plătești în probă`
              : `−${offerPercent}% if you pay during the trial`}
        </Link>
      )}
      {offer && (
        <Link
          href={`/${locale}/dashboard/packages?plan=FAMILY`}
          className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold lg:hidden ${
            last48 ? "bg-amber-500 text-gray-950" : "border border-blue-700/60 text-blue-100"
          }`}
          aria-label={ro ? `−${offerPercent}% pe viață dacă plătești în probă` : `−${offerPercent}% for life if you pay during the trial`}
        >
          −{offerPercent}%
        </Link>
      )}
    </div>
  );
}
