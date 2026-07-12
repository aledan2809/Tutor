"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { resolveFamilyPlanFromRecord, type FamilyPlan } from "@/lib/family";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "MONTH" | "YEAR" | "ONE_TIME";
  trialDays: number | null;
  features: unknown;
  familyPlanKey: string | null;
  maxParents: number | null;
  maxChildren: number | null;
  maxTutors: number | null;
}

interface PlansResponse {
  plans: Plan[];
  current: { subscriptionStatus: string | null; subscriptionPlanId: string | null };
}

function planFeatures(features: unknown): string[] {
  return Array.isArray(features) ? features.filter((f): f is string => typeof f === "string") : [];
}

export default function PackagesPage() {
  const t = useTranslations("packages");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<PlansResponse["current"]>({
    subscriptionStatus: null,
    subscriptionPlanId: null,
  });
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState("");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Plan the visitor picked on /preturi (?plan=<FamilyPlanKey>) — pre-highlight
  // + scroll to it so the pricing→signup→packages hand-off keeps continuity.
  const [preselect, setPreselect] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan");
    if (p) setPreselect(p);
  }, []);

  useEffect(() => {
    if (!preselect || plans.length === 0) return;
    const match = plans.find((pl) => resolveFamilyPlanFromRecord(pl)?.key === preselect);
    if (match) {
      const el = document.getElementById(`plan-card-${match.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [preselect, plans]);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PlansResponse | null) => {
        if (!data) return;
        setPlans(data.plans || []);
        setCurrent(data.current || { subscriptionStatus: null, subscriptionPlanId: null });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async (planId: string) => {
    setCheckingOut(planId);
    setError(null);
    try {
      const res = await fetch("/api/admin/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, voucherCode: voucher.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || t("checkoutError"));
    } catch {
      setError(t("checkoutError"));
    } finally {
      setCheckingOut(null);
    }
  };

  const isPaid =
    current.subscriptionStatus === "active" || current.subscriptionStatus === "trialing";

  const intervalLabel = (interval: Plan["interval"]) =>
    interval === "YEAR" ? t("perYear") : interval === "ONE_TIME" ? t("oneTime") : t("perMonth");

  const seatSummary = (fam: FamilyPlan): string => {
    const parts: string[] = [];
    parts.push(fam.maxParents === 1 ? t("oneParent") : t("nParents", { n: fam.maxParents }));
    parts.push(fam.maxChildren === 1 ? t("oneChild") : t("nChildren", { n: fam.maxChildren }));
    if (fam.features.tutorAccess && fam.maxTutors > 0) parts.push(t("oneTutor"));
    return parts.join(" • ");
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">{t("loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>
      </div>

      {isPaid && (
        <div className="rounded-xl border border-green-900/50 bg-green-900/10 px-4 py-3 text-sm text-green-400">
          {current.subscriptionStatus === "trialing" ? t("currentTrial") : t("currentActive")}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-900/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          {t("noPlans")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plans.map((plan) => {
              const fam = resolveFamilyPlanFromRecord(plan);
              const isCurrent = current.subscriptionPlanId === plan.id;
              const isPreselected = !!preselect && !isCurrent && fam?.key === preselect;
              const features = planFeatures(plan.features);
              return (
                <div
                  key={plan.id}
                  id={`plan-card-${plan.id}`}
                  className={`flex flex-col rounded-2xl border bg-gray-900 p-6 ${
                    isCurrent
                      ? "border-green-700"
                      : isPreselected
                        ? "border-blue-500 ring-2 ring-blue-500/40"
                        : "border-gray-800"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                    {isCurrent && (
                      <span className="rounded bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                        {t("currentPlan")}
                      </span>
                    )}
                  </div>

                  <p className="mb-1">
                    <span className="text-2xl font-bold text-white">{plan.price} lei</span>
                    <span className="text-sm text-gray-400"> {intervalLabel(plan.interval)}</span>
                  </p>
                  <p className="mb-1 text-xs text-gray-500">{t("perSubject")}</p>
                  {plan.trialDays ? (
                    <p className="mb-3 text-xs text-blue-400">{t("trial", { n: plan.trialDays })}</p>
                  ) : (
                    <div className="mb-3" />
                  )}

                  {fam && (
                    <div className="mb-3 rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2">
                      <p className="text-xs font-medium text-gray-400">{t("seats")}</p>
                      <p className="text-sm text-white">{seatSummary(fam)}</p>
                      <p className="mt-1 text-xs text-gray-500">{t("manageFamily")}</p>
                    </div>
                  )}

                  {features.length > 0 && (
                    <ul className="mb-4 space-y-1 text-sm text-gray-300">
                      {features.map((f, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-green-400">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={checkingOut === plan.id || isCurrent}
                    className="mt-auto min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCurrent
                      ? t("currentPlan")
                      : checkingOut === plan.id
                        ? t("preparing")
                        : t("subscribe")}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-xs text-gray-400">
            {t("discounts")}
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <label className="mb-1 block text-xs font-medium text-gray-400" htmlFor="voucher">
              {t("voucher")}
            </label>
            <input
              id="voucher"
              type="text"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
              placeholder={t("voucherPlaceholder")}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </div>
        </>
      )}
    </div>
  );
}
