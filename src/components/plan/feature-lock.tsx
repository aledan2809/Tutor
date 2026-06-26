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

/** The upgrade soft-lock card, on its own (e.g. to lock a section). */
export function FeatureLockCard({ feature }: { feature: PlanFeature }) {
  const t = useTranslations("featureLock");
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-2xl">
        🔒
      </div>
      <p className="mb-1 text-sm font-medium text-blue-400">{t(feature)}</p>
      <h2 className="mb-2 text-lg font-semibold text-white">{t("title")}</h2>
      <p className="mb-6 text-sm text-gray-400">{t("body")}</p>
      <Link
        href={UPGRADE_PATH}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
