"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PlanFeature } from "@/lib/plan-features";

/** Where the upgrade CTA points — the student-facing packages page. */
const UPGRADE_PATH = "/dashboard/packages";

type GateState = "loading" | "allowed" | "locked";

/**
 * Renders `children` only when the logged-in user's package unlocks `feature`,
 * otherwise shows the upgrade soft-lock card. Server-truth via /api/student/
 * entitlements — the real security boundary stays the API (this is just UX).
 * When wrapping a whole page, pass the page body as a child element so its own
 * data-fetching hooks don't run while locked.
 */
export function FeatureGate({
  feature,
  children,
}: {
  feature: PlanFeature;
  children: React.ReactNode;
}) {
  const tc = useTranslations("common");
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/student/entitlements")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        // Fail open on a missing/garbled response: the API is the real gate
        // (paid-only actions return 403 regardless), so this never grants real
        // access — it just avoids locking out paying users on a transient blip.
        if (!data?.features) {
          setState("allowed");
          return;
        }
        setState(data.features[feature] === true ? "allowed" : "locked");
      })
      .catch(() => {
        if (active) setState("allowed");
      });
    return () => {
      active = false;
    };
  }, [feature]);

  if (state === "loading") {
    return <div className="py-12 text-center text-gray-500">{tc("loading")}</div>;
  }
  if (state === "allowed") {
    return <>{children}</>;
  }
  return <FeatureLockCard feature={feature} />;
}

/**
 * The upgrade soft-lock card, on its own (e.g. to lock a section).
 *
 * Contextual, not a wall: when the student has a known weak area, the card leads
 * with THEIR problem ("you often miss X") and frames the paid feature as the fix
 * for exactly that — and always offers a free way forward (practice) so hitting
 * a lock never dead-ends. The weak-area lookup is best-effort; without it the
 * card falls back to the generic copy.
 */
export function FeatureLockCard({ feature }: { feature: PlanFeature }) {
  const t = useTranslations("featureLock");
  const [weak, setWeak] = useState<{ topic: string; errorRate: number } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/student/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        const w = d?.weakAreas?.[0];
        if (w?.topic) setWeak({ topic: w.topic, errorRate: w.errorRate ?? 0 });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-2xl">
        {weak ? "🎯" : "🔒"}
      </div>
      <p className="mb-1 text-sm font-medium text-blue-400">{t(feature)}</p>
      {weak ? (
        <>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-red-400">
            {t("observed")}
          </p>
          <h2 className="mb-2 text-lg font-semibold text-white">
            {t("weakNote", { topic: weak.topic, rate: weak.errorRate })}
          </h2>
          <p className="mb-6 text-sm text-gray-400">{t("valueWeak", { topic: weak.topic })}</p>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-lg font-semibold text-white">{t("title")}</h2>
          <p className="mb-6 text-sm text-gray-400">{t("body")}</p>
        </>
      )}
      <div className="flex flex-col gap-2">
        <Link
          href={UPGRADE_PATH}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t("cta")}
        </Link>
        <Link
          href="/dashboard/practice"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
        >
          {t("continueFree")}
        </Link>
      </div>
    </div>
  );
}
