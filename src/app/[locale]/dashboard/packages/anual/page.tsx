"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resolveFamilyPlanFromRecord } from "@/lib/family";
import { fmtPrice } from "@/lib/pricing";
import { packagePrice, type CodePreview, type PricedPlan, type PricingFacts } from "@/lib/package-price";
import { MONTHS_PAID_PER_YEAR, TELEGRAM_PERCENT, TRIAL_PAYMENT_PERCENT, type DiscountBase } from "@/lib/checkout-price";
import { VOUCHER_ERROR_KEYS } from "@/lib/voucher-checkout";
import type { SeatHolderNote } from "@/lib/access-server";
import { TrialCountdown } from "@/components/access/trial-countdown";
import { holderWords } from "@/components/access/holder-words";

/**
 * „Cât economisești plătind anual" (Alex 17.09.2026): the family's own monthly price against a year
 * paid at once (ten months, discounts included), and the payment. Reached from the annual offer on the
 * monthly price in Abonament; the public page /anual shows the same with example figures.
 *
 * A family that already pays by card compares what it pays now (with the discount its subscription
 * keeps) with a new annual subscription, which would be priced without it. One whose subscription
 * started before those terms were kept gets no figures: what it pays isn't known here. A parent another
 * parent's plan leaves out is told who has it, not offered a year.
 */

type Plan = PricedPlan & { id: string; name: string; trialDays: number | null };

type Current = {
  paid?: boolean;
  subscriptionPlanId?: string | null;
  byCard?: boolean;
  child?: boolean;
  retrying?: boolean;
  freeTrialDaysLeft?: number;
  trialOffer?: { active: boolean; endsAt: string } | null;
  telegram?: boolean;
  subjects?: { self: number; child: { count: number } | null };
  locked?: { percent: number; base: DiscountBase; telegram: boolean; interval: "MONTH" | "YEAR" } | null;
  seatHolder?: SeatHolderNote | null;
  serverNow?: string;
  pendingVoucher?: { ok: true; preview: CodePreview & { code: string } } | { ok: false } | null;
};

export default function AnnualPage() {
  const t = useTranslations("packagesAnnual");
  const tp = useTranslations("packages");
  const locale = useLocale();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<Current>({});
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { plans: Plan[]; current: Current } | null) => {
        if (!data) return;
        setPlans(data.plans ?? []);
        setCurrent(data.current ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setKey(new URLSearchParams(window.location.search).get("plan"));
    load();
  }, [load]);

  const bani = (minor: number) => fmtPrice(minor / 100, locale);
  const keyOf = (p: Plan) => resolveFamilyPlanFromRecord(p)?.key ?? null;
  const annualPlans = plans.filter((p) => p.interval === "YEAR" && keyOf(p));
  // The package the card pays for; else the one from the offer's link, else Family, else the first one
  // with a yearly price.
  const paidPlan = plans.find((p) => p.id === current.subscriptionPlanId);
  const paidKey = current.byCard && paidPlan ? keyOf(paidPlan) : null;
  const chosenKey =
    [paidKey, key, "FAMILY"].find((k) => k && annualPlans.some((p) => keyOf(p) === k)) ??
    (annualPlans[0] ? keyOf(annualPlans[0]) : null);
  const monthlyName = (k: string | null) => plans.find((x) => x.interval === "MONTH" && keyOf(x) === k)?.name;
  const annual = annualPlans.find((p) => keyOf(p) === chosenKey) ?? null;
  const monthly = plans.find((p) => p.interval === "MONTH" && keyOf(p) === chosenKey) ?? null;

  const busy = current.paid === true || current.retrying === true;
  const byCard = current.byCard === true;
  const code = current.pendingVoucher?.ok ? current.pendingVoucher.preview : null;
  const fresh: PricingFacts = {
    trialActive: current.trialOffer?.active === true && !busy,
    telegram: current.telegram === true,
    subjects: current.subjects,
  };
  // What the card subscription costs now: the discount it keeps. A subscription from before these terms
  // were kept has none recorded, and its price isn't known here (see `cardNoTerms` below).
  const kept = current.locked ?? null;
  const m = monthly ? packagePrice(monthly, byCard && kept ? { ...fresh, locked: kept } : fresh, byCard ? null : code) : null;
  const a = annual ? packagePrice(annual, fresh, code) : null;
  // A year from the second one on; the first payments differ only by a code that doesn't renew.
  const monthlyYear = m ? m.total * 12 : 0;
  const saving = m && a ? monthlyYear - a.total : 0;
  const normalYear = m ? m.normal * 12 : 0;
  const onceCode = a?.discount.onceCouponPercent && code ? code : null;
  const losesKept = byCard && kept !== null && a !== null && kept.percent > a.discount.pricesPercent;
  const holder = !current.child && current.seatHolder ? holderWords(current.seatHolder, locale !== "en") : null;

  const parts: string[] = [];
  if (a?.discount.base === "trial") parts.push(t("partTrial", { percent: TRIAL_PAYMENT_PERCENT }));
  if (a?.discount.base === "code" && code) {
    parts.push(onceCode ? t("partCodeOnce", { code: code.code, percent: code.discountPercent }) : t("partCode", { code: code.code, percent: code.discountPercent }));
  }
  if (a?.discount.telegram) parts.push(t("partTelegram", { percent: TELEGRAM_PERCENT }));
  if (a) parts.push(t("partSubjects", { n: a.subjects }));

  const pay = async () => {
    if (!annual) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: annual.id, voucherCode: a?.discount.codeUsed && code ? code.code : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      const voucherKey = VOUCHER_ERROR_KEYS[data.code as keyof typeof VOUCHER_ERROR_KEYS];
      if (voucherKey) {
        // The kept code stopped working (expired, used up): said in the family's language, and the
        // figures again — the account forgets a dead code, so the next payment goes without it.
        setError(voucherKey === "voucherWrongPlan" ? tp(voucherKey, { plan: "" }) : tp(voucherKey));
        load();
      } else {
        setError(data.error || t("payError"));
      }
    } catch {
      setError(t("payError"));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">{t("loading")}</div>;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/dashboard/packages" className="text-xs text-gray-400 hover:text-gray-200">
          ← {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{t("title")}</h1>
        {!current.child && !holder && parts.length > 0 && !byCard && <p className="mt-1 text-sm text-gray-400">{t("withYourDiscounts", { parts: parts.join(" · ") })}</p>}
      </div>

      {current.child ? (
        // A child is never offered a payment (UCPD Annex I point 28): who decides, nothing more.
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">{t("childManaged")}</div>
      ) : holder && current.seatHolder ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-300">
          {holder.plan}{" "}
          {current.seatHolder.upgrade ? tp("holderUpgrade", { who: holder.who, upgrade: current.seatHolder.upgrade }) : holder.noLargerPlan}
        </div>
      ) : byCard && current.locked?.interval === "YEAR" ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">{t("alreadyYearly")}</div>
      ) : byCard && !kept ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">{t("cardNoTerms")}</div>
      ) : !annual || !monthly || !m || !a ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">{t("notAvailable")}</div>
      ) : (
        <>
          {annualPlans.length > 1 && !byCard && (
            <div className="flex flex-wrap gap-2">
              {annualPlans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setKey(keyOf(p))}
                  className={`min-h-[36px] rounded-full border px-3 text-xs ${keyOf(p) === chosenKey ? "border-blue-500 bg-blue-900/40 text-white" : "border-gray-700 text-gray-400 hover:text-gray-200"}`}
                >
                  {monthlyName(keyOf(p)) ?? p.name}
                </button>
              ))}
            </div>
          )}

          {fresh.trialActive && current.trialOffer && current.serverNow && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-700/60 bg-gradient-to-r from-blue-900/40 to-emerald-900/25 px-4 py-3">
              <p className="text-sm font-semibold text-white">{t("trialOffer", { percent: TRIAL_PAYMENT_PERCENT })}</p>
              <TrialCountdown endsAt={current.trialOffer.endsAt} serverNow={current.serverNow} locale={locale} className="text-lg font-bold text-blue-100" onEnd={load} />
            </div>
          )}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="mb-3 inline-block rounded-md bg-blue-900/40 px-2 py-0.5 text-xs font-semibold text-blue-200">
              {monthly.name} · {t("subjects", { n: a.subjects })}
            </p>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-t border-gray-800">
                  <td className="py-2.5 text-gray-300">
                    {byCard ? t("monthlyNow") : t("monthly")}
                    <br />
                    <span className="text-xs text-gray-500">{t("monthlyTimes", { price: bani(m.total) })}</span>
                  </td>
                  <td className="py-2.5 text-right text-white">{bani(monthlyYear)} lei</td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="py-2.5 font-semibold text-white">
                    {byCard ? t("yearlyNew") : t("yearly")}
                    <br />
                    <span className="text-xs font-normal text-gray-500">{t("tenMonths", { months: MONTHS_PAID_PER_YEAR })}</span>
                  </td>
                  <td className={`py-2.5 text-right font-bold ${saving > 0 ? "text-emerald-400" : "text-white"}`}>{bani(a.total)} lei</td>
                </tr>
                <tr className="border-t-2 border-gray-700">
                  <td className="py-2.5 font-bold text-white">{saving > 0 ? t("saving") : t("noSaving")}</td>
                  <td className={`py-2.5 text-right font-bold ${saving > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                    {saving > 0 ? `${bani(saving)} lei` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
            {onceCode && (
              <p className="mt-2 text-xs text-amber-300/90">
                {t("firstYearCode", { code: onceCode.code, price: bani(a.first), renewal: bani(a.total) })}
              </p>
            )}
            {!byCard && normalYear > a.total && (
              <p className="mt-2 text-xs text-gray-500">{t("vsNormal", { normal: bani(normalYear), saving: bani(normalYear - a.total) })}</p>
            )}
            {losesKept && kept && <p className="mt-2 text-xs text-amber-200">{t("cardKeepsDiscount", { percent: kept.percent })}</p>}

            {byCard ? (
              <p className="mt-4 rounded-lg border border-amber-800/50 bg-amber-900/15 px-3 py-2 text-xs text-amber-200">
                {saving > 0 ? t("switchByCard") : t("cardStay")}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void pay()}
                disabled={paying || busy}
                className="mt-4 min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {paying ? t("preparing") : t("payYearly", { price: bani(a.first) })}
              </button>
            )}
            {!byCard && (current.freeTrialDaysLeft ?? 0) > 0 && (annual.trialDays ?? 0) > 0 && <p className="mt-2 text-xs text-gray-500">{t("freeDaysKept")}</p>}
            {!byCard && !onceCode && a.discount.pricesPercent > 0 && <p className="mt-1 text-xs text-gray-500">{t("discountsEveryYear")}</p>}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          {!byCard && (
            <Link
              href={`/dashboard/packages?plan=${chosenKey}`}
              className="block min-h-[44px] rounded-lg border border-gray-700 px-4 py-2.5 text-center text-sm text-gray-200 hover:bg-gray-800"
            >
              {t("stayMonthly", { price: bani(m.total) })}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
