"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  childDiscountPercent,
  FAMILY_PLANS,
  resolveFamilyPlanFromRecord,
  subjectDiscountPercent,
  type FamilyPlan,
} from "@/lib/family";
import { Link } from "@/i18n/navigation";
import { fmtPrice } from "@/lib/pricing";
import { previewAppliesToPlan, VOUCHER_ERROR_KEYS, type VoucherPreview } from "@/lib/voucher-checkout";
import { packagePrice } from "@/lib/package-price";
import {
  checkoutDiscount,
  MONTHS_PAID_PER_YEAR,
  TELEGRAM_PERCENT,
  TRIAL_PAYMENT_PERCENT,
} from "@/lib/checkout-price";
import { FREE_TRIAL_DAYS } from "@/lib/free-trial";
import type { SeatHolderNote } from "@/lib/access-server";
import { TrialCountdown } from "@/components/access/trial-countdown";
import { holderWords } from "@/components/access/holder-words";

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
    /** The payer's own free week: paying in it gives −30% for life (checkout-price.ts). Null for a child. */
    trialOffer?: { active: boolean; endsAt: string } | null;
    /** Telegram connected by anyone in the family: −10% more at payment. */
    telegram?: boolean;
    /** A child whose parent is in the account: no offer to pay now, no saving to chase (UCPD). */
    child?: boolean;
    /** Subjects each kind of plan bills: the payer's own (Elev) or the first linked child's. */
    subjects?: { self: number; child: { count: number } | null };
    subjectsPaid?: { count: number; self: boolean; name: string | null } | null;
    /** Another parent's plan covers the children without a seat for this one: who has it (no offer). */
    seatHolder?: SeatHolderNote | null;
    /** For the payer: an adult of the family is left out, and what the package that includes them costs. */
    parentUpgrade?: {
      planLabel: string;
      price: number;
      total: number;
      interval: "MONTH" | "YEAR";
      leftOut: { id: string; name: string | null }[];
      seats: number;
    } | null;
    /** The difference is still being paid next to a package that already includes the seat. */
    parentUpgradeRedundant?: boolean;
    /** With the difference paid, the package the family actually has (Family + diferența = Family Duo). */
    upgradedPlanName?: string | null;
    /** The subscriptions bought next to the plan, each stopped from its own portal. */
    addons?: { sessionId: string; type: "subject_addon" | "child_addon" | "parent_addon"; learnerName: string | null; subjectName: string | null; since: string }[];
    serverNow?: string;
    pendingVoucher?: { ok: true; preview: PreviewJson } | { ok: false; code: string; voucherCode: string | null } | null;
  };
}

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
  // The portal being opened: the plan's („plan”) or a separate subscription's (its checkout session).
  const [portalBusy, setPortalBusy] = useState<string | null>(null);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Plan the visitor picked on /preturi (?plan=<FamilyPlanKey>) — pre-highlight
  // + scroll to it so the pricing→signup→packages hand-off keeps continuity.
  const [preselect, setPreselect] = useState<string | null>(null);
  // Monthly or annual packages (annual = ten months of the monthly price, discounts included).
  const [billing, setBilling] = useState<"MONTH" | "YEAR">("MONTH");

  /** The prices again, e.g. when the trial offer ends while the page is open. */
  const reloadPlans = useCallback(() => {
    fetch("/api/plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PlansResponse | null) => {
        if (!data) return;
        setPlans(data.plans || []);
        setCurrent(data.current || { subscriptionStatus: null, subscriptionPlanId: null });
      })
      .catch(() => {});
  }, []);

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
    if (params.get("interval") === "YEAR") setBilling("YEAR");
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

  /** The plan's portal, or — with its checkout session — a separate subscription's (its own customer). */
  const openPortal = async (addonSessionId?: string) => {
    setPortalBusy(addonSessionId ?? "plan");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addonSessionId ? { addonSessionId } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || t("portalError"));
    } catch {
      setError(t("portalError"));
    } finally {
      setPortalBusy(null);
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

  // Prices come in major units (33.2); the amounts are computed in minor units (package-price.ts).
  /** „Treci pe Family Duo": the difference, as its own subscription (addon-checkout `type: "parent"`). */
  const buyParentUpgrade = async () => {
    setUpgradeBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/family/addon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "parent" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error ?? t("checkoutError"));
    } catch {
      setError(t("checkoutError"));
    } finally {
      setUpgradeBusy(false);
    }
  };

  /** The family reads a name, not an id; an account without one is „un adult al familiei". */
  const upgradeName = (p: { name: string | null }) => p.name?.trim() || t("parentUpgradeSomeone");

  const lei = (amount: number) => fmtPrice(amount, locale);
  const bani = (minorUnits: number) => fmtPrice(minorUnits / 100, locale);
  // The −30% offer runs while the payer's own free week does (a paying account has no offer, a child
  // is never made one).
  const isChild = current.child === true;
  const trialActive = current.trialOffer?.active === true && !isPaid && !isRetrying && !isChild;
  /** What a package costs this family, by the same rules as checkout (package-price.ts). Minor units. */
  const priceFor = (plan: Plan, opts: { telegram?: boolean } = {}) =>
    packagePrice(plan, { trialActive, telegram: current.telegram === true, subjects: current.subjects }, preview, opts);
  const trialFor = (plan: Plan): number =>
    plan.interval === "ONE_TIME" ? 0 : Math.min(plan.trialDays ?? 0, current.freeTrialDaysLeft ?? 0);

  const hasAnnual = plans.some((p) => p.interval === "YEAR");
  const shownPlans = hasAnnual ? plans.filter((p) => p.interval === billing) : plans;
  const bannerPlan = preview?.planKey
    ? shownPlans.find((p) => resolveFamilyPlanFromRecord(p)?.key === preview.planKey) ??
      plans.find((p) => resolveFamilyPlanFromRecord(p)?.key === preview.planKey)
    : null;
  const bannerPriced = bannerPlan ? priceFor(bannerPlan) : null;
  // How the kept code is used at payment: on the plan it names, or — a code for any plan — by the same
  // rule on every plan (the trial offer may be larger; a code that doesn't renew comes off once).
  const bannerDiscount = bannerPriced
    ? bannerPriced.discount
    : preview
      ? checkoutDiscount({ trialActive, code: { percent: preview.discountPercent, renews: preview.recurring }, telegram: current.telegram === true })
      : null;
  const addons = current.addons ?? [];
  const holder = !isChild && current.seatHolder ? holderWords(current.seatHolder, locale !== "en") : null;
  // No packages to choose from: a child, or a parent another parent's plan leaves out.
  const offersHidden = isChild || holder !== null;
  const trialEndText = current.trialOffer
    ? new Date(current.trialOffer.endsAt).toLocaleString(locale === "en" ? "en-GB" : "ro-RO", {
        timeZone: "Europe/Bucharest",
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (loading) {
    return <div className="py-12 text-center text-gray-500">{t("loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        {!offersHidden && <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>}
      </div>

      {holder && current.seatHolder && (
        <div className="rounded-xl border border-blue-900/60 bg-blue-950/30 px-4 py-3 text-sm text-blue-100">
          {holder.plan}{" "}
          {current.seatHolder.upgrade ? t("holderUpgrade", { who: holder.who, upgrade: current.seatHolder.upgrade }) : holder.noLargerPlan}
        </div>
      )}

      {isPaid && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-900/50 bg-green-900/10 px-4 py-3 text-sm text-green-400">
          <div>
            <span>
              {current.subscriptionStatus === "trialing" ? t("currentTrial") : t("currentActive")}
            </span>
            {cardSubscription && <p className="mt-1 text-xs text-green-300/80">{t("switchPlanByCard")}</p>}
            {current.parentUpgradeRedundant && current.upgradedPlanName && (
              <p className="mt-1 text-xs text-amber-300/90">{t("parentUpgradeRedundant", { plan: current.upgradedPlanName })}</p>
            )}
            {current.upgradedPlanName && (
              <p className="mt-1 text-xs text-green-300/80">{t("currentUpgraded", { plan: current.upgradedPlanName })}</p>
            )}
            {cardSubscription && current.subjectsPaid && (
              <p className="mt-1 text-xs text-green-300/80">
                {current.subjectsPaid.self
                  ? t("subjectsPaidSelf", { count: current.subjectsPaid.count })
                  : t("subjectsPaidChild", { count: current.subjectsPaid.count, name: current.subjectsPaid.name?.trim() || t("subjectsPaidChildNoName") })}
              </p>
            )}
          </div>
          <button
            onClick={() => void openPortal()}
            disabled={portalBusy !== null}
            className="min-h-[40px] rounded-lg border border-green-800/60 bg-green-900/20 px-4 py-2 text-sm font-medium text-green-200 transition-colors hover:bg-green-900/40 disabled:opacity-50"
          >
            {portalBusy === "plan" ? t("portalOpening") : t("manageSubscription")}
          </button>
        </div>
      )}

      {isRetrying && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800/60 bg-amber-900/15 px-4 py-3 text-sm text-amber-200">
          <span>{t("currentPastDue")}</span>
          <button
            onClick={() => void openPortal()}
            disabled={portalBusy !== null}
            className="min-h-[40px] rounded-lg border border-amber-700/60 bg-amber-900/30 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-900/50 disabled:opacity-50"
          >
            {portalBusy === "plan" ? t("portalOpening") : t("manageSubscription")}
          </button>
        </div>
      )}

      {/* An adult of the family left out of the package: the payer is told here too, where they pay —
          the adult themselves only ever sees who holds the package, never a price (access.ts seatHolder). */}
      {current.parentUpgrade && (
        <div className="rounded-xl border border-blue-900/60 bg-blue-950/30 px-4 py-3 text-sm">
          <p className="font-semibold text-white">
            {current.parentUpgrade.leftOut.length === 0
              ? t("parentUpgradeTitleNone", { plan: current.parentUpgrade.planLabel })
              : current.parentUpgrade.leftOut.length === 1
                ? t("parentUpgradeTitleOne", { name: upgradeName(current.parentUpgrade.leftOut[0]) })
                : t("parentUpgradeTitleMany", { count: current.parentUpgrade.leftOut.length })}
          </p>
          <p className="mt-1 text-gray-300">
            {current.parentUpgrade.leftOut.length === 0
              ? t("parentUpgradeBodyNone", { plan: current.parentUpgrade.planLabel, price: lei(current.parentUpgrade.price), interval: current.parentUpgrade.interval })
              : current.parentUpgrade.leftOut.length === 1
                ? t("parentUpgradeBodyOne", {
                    name: upgradeName(current.parentUpgrade.leftOut[0]),
                    plan: current.parentUpgrade.planLabel,
                    price: lei(current.parentUpgrade.price),
                    interval: current.parentUpgrade.interval,
                  })
                : t("parentUpgradeBodyMany", {
                    plan: current.parentUpgrade.planLabel,
                    first: upgradeName(current.parentUpgrade.leftOut[0]),
                    price: lei(current.parentUpgrade.price),
                    interval: current.parentUpgrade.interval,
                  })}
          </p>
          <button
            type="button"
            onClick={() => void buyParentUpgrade()}
            disabled={upgradeBusy}
            className="mt-3 min-h-[40px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {upgradeBusy
              ? t("preparing")
              : t("parentUpgradeCta", { plan: current.parentUpgrade.planLabel, price: lei(current.parentUpgrade.price) })}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            {t("parentUpgradeTotal", {
              total: lei(current.parentUpgrade.total),
              plan: current.parentUpgrade.planLabel,
              interval: current.parentUpgrade.interval,
            })}
          </p>
        </div>
      )}

      {/* A subject or a child's seat bought after the payment is its own Stripe subscription, under its
          own customer: the plan's portal doesn't show it, so each has its „Gestionează” here — also once
          the plan has ended, when they would otherwise keep being charged unseen. */}
      {addons.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm">
          <p className="font-semibold text-white">{t("addonsTitle")}</p>
          <p className="mt-0.5 text-xs text-gray-400">{isPaid || isRetrying ? t("addonsIntro") : t("addonsWithoutPlan")}</p>
          <ul className="mt-2 divide-y divide-gray-800">
            {addons.map((a) => (
              <li key={a.sessionId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-gray-200">
                  {a.type === "parent_addon"
                    ? t("addonParent", { plan: current.upgradedPlanName ?? "" })
                    : a.type === "child_addon"
                      ? t("addonChild")
                      : a.learnerName?.trim()
                        ? t("addonSubject", { subject: a.subjectName ?? t("addonSubjectUnknown"), name: a.learnerName.trim() })
                        : t("addonSubjectNoName", { subject: a.subjectName ?? t("addonSubjectUnknown") })}
                  <span className="ml-1 text-xs text-gray-500">
                    · {t("addonSince", { date: new Date(a.since).toLocaleDateString(locale === "en" ? "en-GB" : "ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", year: "numeric" }) })}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void openPortal(a.sessionId)}
                  disabled={portalBusy !== null}
                  className="min-h-[36px] rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-800 disabled:opacity-50"
                >
                  {portalBusy === a.sessionId ? t("portalOpening") : t("addonManage")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isPaid && !isRetrying && !offersHidden && preview && bannerDiscount && (
        <div className="rounded-xl border border-emerald-800/60 bg-emerald-900/15 px-4 py-3 text-sm text-emerald-200">
          <p className="font-semibold">
            {!bannerDiscount.codeUsed
              ? // The trial offer is larger: the code isn't used now and stays for later.
                t("voucherKeptTrialWins", { code: preview.code, percent: TRIAL_PAYMENT_PERCENT })
              : bannerPlan && bannerPriced
                ? t("voucherBanner", {
                    code: preview.code,
                    plan: bannerPlan.name,
                    price: bani(bannerPriced.first),
                    normal: bani(bannerPriced.normal),
                    interval: intervalLabel(bannerPlan.interval),
                  })
                : t("voucherBannerAnyPlan", { code: preview.code, percent: preview.discountPercent })}
          </p>
          {bannerDiscount.codeUsed && (
            <p className="mt-0.5 text-xs text-emerald-300/80">
              {bannerDiscount.onceCouponPercent ? t("voucherFirstPaymentOnly") : t("voucherEveryPayment")}
            </p>
          )}
        </div>
      )}

      {trialActive && current.trialOffer && current.serverNow && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-700/60 bg-gradient-to-r from-blue-900/40 to-emerald-900/25 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">{t("trialOfferTitle", { percent: TRIAL_PAYMENT_PERCENT })}</p>
            <p className="text-xs text-blue-100/80">{t("trialOfferEnds", { end: trialEndText })}</p>
          </div>
          <TrialCountdown
            endsAt={current.trialOffer.endsAt}
            serverNow={current.serverNow}
            locale={locale}
            className="text-lg font-bold text-blue-100"
            onEnd={reloadPlans}
          />
        </div>
      )}

      {hasAnnual && !offersHidden && (
        <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1" role="tablist" aria-label={t("billingLabel")}>
          {(["MONTH", "YEAR"] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={billing === b}
              onClick={() => setBilling(b)}
              className={`min-h-[40px] flex-1 rounded-lg px-3 text-sm ${billing === b ? "bg-gray-800 font-semibold text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              {b === "MONTH" ? t("billingMonthly") : t("billingYearly", { months: MONTHS_PAID_PER_YEAR })}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-900/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {offersHidden ? (
        // A child whose parent is in the account is never shown prices or asked to buy (UCPD Annex I
        // point 28): who decides, and the access code a school may have given them. A parent another
        // parent's plan leaves out has the note above instead — never a second package for the same
        // children. Banners above still manage a subscription the account pays itself.
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300">
          {isChild && !isPaid && !isRetrying && <p className="mb-2">{t("childManaged")}</p>}
          <Link href="/dashboard/activare" className="block text-xs text-blue-400 hover:text-blue-300">
            {t("activateLink")}
          </Link>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          {t("noPlans")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shownPlans.map((plan) => {
              const fam = resolveFamilyPlanFromRecord(plan);
              const isCurrent = current.subscriptionPlanId === plan.id;
              const isPreselected = !!preselect && !isCurrent && fam?.key === preselect;
              const features = planFeatures(plan.features);
              const priced = isCurrent ? null : priceFor(plan);
              const discounted = priced && priced.first < priced.normal ? priced : null;
              // What connecting Telegram before paying would bring (a family without it yet).
              const withTelegram = priced && !current.telegram && !isPaid && !isRetrying ? priceFor(plan, { telegram: true }) : null;
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
                      priced && (
                        <span className="flex flex-wrap justify-end gap-1">
                          {priced.discount.base === "trial" && (
                            <span className="rounded-md bg-emerald-900/40 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                              {t("tagTrial", { percent: TRIAL_PAYMENT_PERCENT })}
                            </span>
                          )}
                          {priced.discount.codeUsed && preview && (
                            <span className="rounded-md border border-dashed border-amber-400/60 px-2 py-0.5 text-xs font-semibold text-amber-300">
                              {t("voucherBadge", { code: preview.code, percent: preview.discountPercent })}
                            </span>
                          )}
                          {priced.discount.telegram && (
                            <span className="rounded-md bg-sky-900/40 px-2 py-0.5 text-xs font-semibold text-sky-300">
                              {t("tagTelegram", { percent: TELEGRAM_PERCENT })}
                            </span>
                          )}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mb-1">
                    {discounted && <span className="mr-2 text-base text-gray-500 line-through">{bani(discounted.normal)} lei</span>}
                    <span className="text-2xl font-bold text-white">{priced ? bani(priced.first) : lei(plan.price)} lei</span>
                    <span className="text-sm text-gray-400"> {intervalLabel(plan.interval)}</span>
                  </p>
                  {priced?.discount.onceCouponPercent && (
                    <p className="mb-1 text-xs text-amber-300/90">{t("firstPaymentThen", { price: bani(priced.total) })}</p>
                  )}
                  {plan.interval === "YEAR" && priced && (
                    <p className="mb-1 text-xs text-gray-400">{t("yearAsMonth", { price: bani(Math.round(priced.first / 12)) })}</p>
                  )}
                  <p className="mb-1 text-xs text-gray-500">
                    {priced && priced.subjects > 1
                      ? t("subjectsIncluded", { n: priced.subjects, second: subjectDiscountPercent(2), third: subjectDiscountPercent(3) })
                      : t("perSubject")}
                  </p>
                  {withTelegram && withTelegram.first < (priced?.first ?? 0) && (
                    <Link href="/dashboard/settings/notifications" className="mb-2 block text-xs text-sky-300 hover:text-sky-200">
                      {t("telegramHint", { price: bani(withTelegram.first), percent: TELEGRAM_PERCENT })}
                    </Link>
                  )}
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

                  {/* Alex 17.09: on the monthly price with the trial offer, the bigger saving of paying a year. */}
                  {billing === "MONTH" && hasAnnual && priced?.discount.base === "trial" && fam && (
                    <div className="mb-3 rounded-lg border border-dashed border-amber-500/50 bg-amber-900/10 px-3 py-2 text-xs text-amber-100">
                      <p className="font-semibold">{t("annualOfferTitle")}</p>
                      <p className="text-amber-100/80">{t("annualOfferBody")}</p>
                      <Link href={`/dashboard/packages/anual?plan=${fam.key}`} className="mt-1 inline-block font-semibold text-amber-300 hover:text-amber-200">
                        {t("annualOfferCta")}
                      </Link>
                    </div>
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
            {t("discounts", {
              trial: TRIAL_PAYMENT_PERCENT,
              days: FREE_TRIAL_DAYS,
              telegram: TELEGRAM_PERCENT,
              subject2: subjectDiscountPercent(2),
              subject3: subjectDiscountPercent(3),
              child2: childDiscountPercent(2),
              child3: childDiscountPercent(3),
              months: MONTHS_PAID_PER_YEAR,
            })}
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
