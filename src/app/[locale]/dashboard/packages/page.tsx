"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FAMILY_PLANS, resolveFamilyPlanFromRecord, type FamilyPlan } from "@/lib/family";
import { Link } from "@/i18n/navigation";
import { fmtPrice } from "@/lib/pricing";
import { discountedMinorUnits, previewAppliesToPlan, type VoucherPreview } from "@/lib/voucher-checkout";

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

/** The preview as it comes over JSON (dates are strings). */
type PreviewJson = Omit<VoucherPreview, "expiresAt"> & { expiresAt: string | null };

interface PlansResponse {
  plans: Plan[];
  current: {
    subscriptionStatus: string | null;
    /** Paid right now (active or trialing, not past its end). A cancelled or expired package isn't. */
    paid?: boolean;
    /** The plan paid for right now; null once it has ended, so it can be bought again. */
    subscriptionPlanId: string | null;
    /** The current subscription is paid by card: another package would start a second one. */
    byCard?: boolean;
    /** A declined renewal Stripe is still retrying (within the grace). */
    retrying?: boolean;
    freeTrialDaysLeft?: number;
    pendingVoucher?: { ok: true; preview: PreviewJson } | { ok: false; code: string; voucherCode: string | null } | null;
  };
}

// Checkout and the pending-code API answer a refused voucher with a stable `code` (see
// lib/voucher-checkout.ts); the page shows it in the user's language instead of the API's English.
const VOUCHER_ERROR_KEYS = {
  VOUCHER_INVALID: "voucherInvalid",
  VOUCHER_EXPIRED: "voucherExpired",
  VOUCHER_LIMIT_REACHED: "voucherLimitReached",
  VOUCHER_WRONG_PLAN: "voucherWrongPlan",
  VOUCHER_ALREADY_USED: "voucherAlreadyUsed",
  VOUCHER_FREE_ACCESS: "voucherFreeAccess",
  VOUCHER_TOO_MANY: "voucherTooMany",
} as const;

function planFeatures(features: unknown): string[] {
  return Array.isArray(features) ? features.filter((f): f is string => typeof f === "string") : [];
}

export default function PackagesPage() {
  const t = useTranslations("packages");
  const locale = useLocale();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<PlansResponse["current"]>({
    subscriptionStatus: null,
    subscriptionPlanId: null,
  });
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState("");
  // The last code checked for this account (and kept on it).
  const [savedPreview, setSavedPreview] = useState<PreviewJson | null>(null);
  // A discount is shown only while that code is what the box says: the box is what the parent
  // believes they are paying with, so editing it hides the discount until the new code is checked.
  const preview = savedPreview && voucher.trim().toUpperCase() === savedPreview.code ? savedPreview : null;
  const [voucherBusy, setVoucherBusy] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Plan the visitor picked on /preturi (?plan=<FamilyPlanKey>) — pre-highlight
  // + scroll to it so the pricing→signup→packages hand-off keeps continuity.
  const [preselect, setPreselect] = useState<string | null>(null);

  const voucherErrorText = (code: string | undefined, fallback?: string): string => {
    const key = VOUCHER_ERROR_KEYS[code as keyof typeof VOUCHER_ERROR_KEYS];
    if (!key) return fallback || t("checkoutError");
    return key === "voucherWrongPlan" ? t(key, { plan: "" }) : t(key);
  };

  /**
   * Checks a code for this account and keeps it on the account (it survives a reload or a later
   * visit). An empty code forgets it. Answers the preview when the code may be shown as a discount.
   */
  const applyVoucher = async (
    raw: string,
    opts?: { fromLink?: boolean; kept?: PreviewJson | null },
  ): Promise<PreviewJson | null> => {
    const code = raw.trim().toUpperCase();
    setVoucher(code);
    setVoucherBusy(true);
    try {
      if (!code) {
        await fetch("/api/vouchers/pending", { method: "DELETE" });
        setSavedPreview(null);
        setError(null);
        return null;
      }
      const res = await fetch("/api/vouchers/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.preview) {
        setSavedPreview(data.preview as PreviewJson);
        setError(null);
        return data.preview as PreviewJson;
      }
      if (opts?.fromLink) {
        // Nobody typed this code: leaving it in the box would re-check and refuse it on every
        // click on a package, and the parent couldn't pay at all. A refusal doesn't touch the code
        // already kept on the account, so a valid one goes back in the box and still applies.
        const kept = opts.kept ?? null;
        setVoucher(kept?.code ?? "");
        setSavedPreview(kept);
        const reason = voucherErrorText(data.code, data.error);
        setError(kept ? t("voucherLinkRefusedKept", { code, reason, kept: kept.code }) : t("voucherLinkRefused", { code, reason }));
        return kept;
      }
      setSavedPreview(null);
      setError(voucherErrorText(data.code, data.error));
      return null;
    } catch {
      setSavedPreview(null);
      setError(t("checkoutError"));
      return null;
    } finally {
      setVoucherBusy(false);
    }
  };

  const wrongPlanText = (planKey: string | null | undefined): string => {
    // Name the plan the code is for, as the parent sees it on this page.
    const forPlan = plans.find((p) => resolveFamilyPlanFromRecord(p)?.key === planKey);
    const label = FAMILY_PLANS[planKey as keyof typeof FAMILY_PLANS]?.label;
    return t("voucherWrongPlan", { plan: forPlan?.name ?? label ?? String(planKey ?? "") });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("plan");
    if (p) setPreselect(p);
    // From a campaign link (flyer QR, signup hand-off): same "?voucher=" a visitor would
    // otherwise have to retype — checked and kept on the account straight away.
    const fromLink = params.get("voucher");

    fetch("/api/plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PlansResponse | null) => {
        if (!data) return;
        setPlans(data.plans || []);
        setCurrent(data.current || { subscriptionStatus: null, subscriptionPlanId: null });
        const pending = data.current?.pendingVoucher;
        if (fromLink && fromLink.trim().toUpperCase() !== (pending?.ok ? pending.preview.code : pending?.voucherCode)) {
          void applyVoucher(fromLink, { fromLink: true, kept: pending?.ok ? pending.preview : null });
        } else if (pending?.ok) {
          setVoucher(pending.preview.code);
          setSavedPreview(pending.preview);
        } else if (pending && !pending.ok && pending.voucherCode) {
          // Kept since signup but no longer usable (expired, already used). The account has already
          // forgotten it; say why, once. The box stays empty, so checkout can't send a dead code.
          setError(t("voucherRemovedFromAccount", { code: pending.voucherCode, reason: voucherErrorText(pending.code) }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!preselect || plans.length === 0) return;
    const match = plans.find((pl) => resolveFamilyPlanFromRecord(pl)?.key === preselect);
    if (match) {
      const el = document.getElementById(`plan-card-${match.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [preselect, plans]);

  const subscribe = async (plan: Plan) => {
    setCheckingOut(plan.id);
    setError(null);
    try {
      const planKey = resolveFamilyPlanFromRecord(plan)?.key ?? null;
      let active = preview;
      if (!active && voucher.trim()) {
        // Typed but not checked yet: check it now. The parent meant this code, so a refusal — or a
        // code for another plan — stops here with the reason, instead of charging the full price.
        active = await applyVoucher(voucher);
        if (!active) return;
        if (!previewAppliesToPlan(active, planKey)) {
          setError(wrongPlanText(active.planKey));
          return;
        }
      }
      // Only the code whose discount this card shows goes to checkout. A code for another plan
      // (this card shows the full price) stays out, rather than turning the payment into a refusal.
      const voucherCode = active && previewAppliesToPlan(active, planKey) ? active.code : undefined;
      const res = await fetch("/api/admin/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, voucherCode }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      const voucherKey = VOUCHER_ERROR_KEYS[data.code as keyof typeof VOUCHER_ERROR_KEYS];
      if (voucherKey) {
        // The code stopped working after it was checked (used in another tab, just expired). Drop it,
        // so the next click pays the price the card then shows instead of hitting the same refusal.
        setSavedPreview(null);
        setVoucher("");
        setError(voucherKey === "voucherWrongPlan" ? wrongPlanText(data.planKey) : t(voucherKey));
      } else {
        setError(data.error || t("checkoutError"));
      }
    } catch {
      setError(t("checkoutError"));
    } finally {
      setCheckingOut(null);
    }
  };

  const openPortal = async () => {
    setPortalBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || t("portalError"));
    } catch {
      setError(t("portalError"));
    } finally {
      setPortalBusy(false);
    }
  };

  const isPaid =
    current.paid ?? (current.subscriptionStatus === "active" || current.subscriptionStatus === "trialing");
  // A renewal the bank declined while Stripe keeps retrying: the way out is a new card, not a
  // second package.
  // Past the grace nothing is retried any more: the family chooses a package again.
  const isRetrying = current.retrying ?? current.subscriptionStatus === "past_due";
  // Paid by card: the broker can't switch the plan, so another package would be a second subscription.
  const cardSubscription = isPaid && current.byCard === true;

  const intervalLabel = (interval: Plan["interval"]) =>
    interval === "YEAR" ? t("perYear") : interval === "ONE_TIME" ? t("oneTime") : t("perMonth");

  const seatSummary = (fam: FamilyPlan): string => {
    const parts: string[] = [];
    parts.push(fam.maxParents === 1 ? t("oneParent") : t("nParents", { n: fam.maxParents }));
    parts.push(fam.maxChildren === 1 ? t("oneChild") : t("nChildren", { n: fam.maxChildren }));
    if (fam.features.tutorAccess && fam.maxTutors > 0) parts.push(t("oneTutor"));
    return parts.join(" • ");
  };

  // Prices come in major units (33.2); integer minor units keep 33,20 − 25% at exactly 24,90.
  const minor = (lei: number) => Math.round(lei * 100);
  const lei = (amount: number) => fmtPrice(amount, locale);
  const discountFor = (plan: Plan): number | null => {
    if (!preview) return null;
    const key = resolveFamilyPlanFromRecord(plan)?.key ?? null;
    if (!previewAppliesToPlan(preview, key)) return null;
    return discountedMinorUnits(minor(plan.price), preview.discountPercent) / 100;
  };
  const trialFor = (plan: Plan): number =>
    plan.interval === "ONE_TIME" ? 0 : Math.min(plan.trialDays ?? 0, current.freeTrialDaysLeft ?? 0);

  const bannerPlan = preview?.planKey ? plans.find((p) => resolveFamilyPlanFromRecord(p)?.key === preview.planKey) : null;
  const bannerPrice = bannerPlan ? discountFor(bannerPlan) : null;

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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-900/50 bg-green-900/10 px-4 py-3 text-sm text-green-400">
          <div>
            <span>
              {current.subscriptionStatus === "trialing" ? t("currentTrial") : t("currentActive")}
            </span>
            {cardSubscription && <p className="mt-1 text-xs text-green-300/80">{t("switchPlanByCard")}</p>}
          </div>
          <button
            onClick={openPortal}
            disabled={portalBusy}
            className="min-h-[40px] rounded-lg border border-green-800/60 bg-green-900/20 px-4 py-2 text-sm font-medium text-green-200 transition-colors hover:bg-green-900/40 disabled:opacity-50"
          >
            {portalBusy ? t("portalOpening") : t("manageSubscription")}
          </button>
        </div>
      )}

      {isRetrying && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800/60 bg-amber-900/15 px-4 py-3 text-sm text-amber-200">
          <span>{t("currentPastDue")}</span>
          <button
            onClick={openPortal}
            disabled={portalBusy}
            className="min-h-[40px] rounded-lg border border-amber-700/60 bg-amber-900/30 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-900/50 disabled:opacity-50"
          >
            {portalBusy ? t("portalOpening") : t("manageSubscription")}
          </button>
        </div>
      )}

      {!isPaid && !isRetrying && preview && (
        <div className="rounded-xl border border-emerald-800/60 bg-emerald-900/15 px-4 py-3 text-sm text-emerald-200">
          <p className="font-semibold">
            {bannerPlan && bannerPrice !== null
              ? t("voucherBanner", {
                  code: preview.code,
                  plan: bannerPlan.name,
                  price: lei(bannerPrice),
                  normal: lei(bannerPlan.price),
                  interval: intervalLabel(bannerPlan.interval),
                })
              : t("voucherBannerAnyPlan", { code: preview.code, percent: preview.discountPercent })}
          </p>
          {preview.recurring && <p className="mt-0.5 text-xs text-emerald-300/80">{t("voucherEveryPayment")}</p>}
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
              const discounted = isCurrent ? null : discountFor(plan);
              const trial = trialFor(plan);
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
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                    {isCurrent ? (
                      <span className="rounded bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                        {t("currentPlan")}
                      </span>
                    ) : (
                      discounted !== null &&
                      preview && (
                        <span className="rounded-md border border-dashed border-amber-400/60 px-2 py-0.5 text-xs font-semibold text-amber-300">
                          {t("voucherBadge", { code: preview.code, percent: preview.discountPercent })}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mb-1">
                    {discounted !== null && (
                      <span className="mr-2 text-base text-gray-500 line-through">{lei(plan.price)} lei</span>
                    )}
                    <span className="text-2xl font-bold text-white">{lei(discounted ?? plan.price)} lei</span>
                    <span className="text-sm text-gray-400"> {intervalLabel(plan.interval)}</span>
                  </p>
                  <p className="mb-1 text-xs text-gray-500">{t("perSubject")}</p>
                  {trial > 0 ? (
                    <p className="mb-3 text-xs text-blue-400">{t("trial", { n: trial })}</p>
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
                    onClick={() => subscribe(plan)}
                    // Never a second subscription next to one the card pays or retries (banner above).
                    disabled={checkingOut === plan.id || isCurrent || voucherBusy || isRetrying || cardSubscription}
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

          <form
            className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void applyVoucher(voucher);
            }}
          >
            <label className="mb-1 block text-xs font-medium text-gray-400" htmlFor="voucher">
              {t("voucher")}
            </label>
            <div className="flex gap-2">
              <input
                id="voucher"
                type="text"
                value={voucher}
                onChange={(e) => setVoucher(e.target.value)}
                placeholder={t("voucherPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              />
              <button
                type="submit"
                disabled={voucherBusy}
                className="min-h-[40px] shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-4 text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-50"
              >
                {voucherBusy ? t("voucherChecking") : t("voucherApply")}
              </button>
            </div>
            {/* Also for a refused code: a typed code is re-checked on every click, so without this the
                parent could only pay after emptying the box by hand. */}
            {voucher.trim() && (
              <button
                type="button"
                onClick={() => void applyVoucher("")}
                className="mt-2 text-xs text-gray-400 underline-offset-2 hover:text-gray-200 hover:underline"
              >
                {t("voucherRemove")}
              </button>
            )}
            {/* "Activare acces" and "Pachete" were two menu entries for one intention.
                They merged into Abonament (this page); the per-subject 100% voucher
                flow stays a live route and is reachable from here. */}
            <Link
              href="/dashboard/activare"
              className="mt-2 block text-xs text-blue-400 hover:text-blue-300"
            >
              {t("activateLink")}
            </Link>
          </form>
        </>
      )}
    </div>
  );
}
