"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fmtPrice } from "@/lib/pricing";

/** The price of one more subject, on its own subscription (checkout-facts subjectAddonQuote). */
export type AddonQuote = { subjectIndex: number; minor: number; interval: "MONTH" | "YEAR" };

/** A subject past the paid ones, with its price: what a 402 SUBJECT_ADDON answer offers. */
export type SubjectAddon = { domainId: string; name: string; quote: AddonQuote };

/**
 * The offer of one more subject to whoever pays the card subscription — a parent on the child's
 * subject list, or a learner paying for themselves on their own — and its payment
 * (subject-addon-checkout). One component for both lists, so the two can't tell a family different
 * things. `childId`: the child it is for, on a parent's page.
 */
export function SubjectAddonOffer({
  addon,
  childId,
  onClose,
  onError,
}: {
  addon: SubjectAddon;
  childId?: string;
  onClose: () => void;
  onError: (message: string | null) => void;
}) {
  const t = useTranslations("subjectAddon");
  const locale = useLocale();
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    onError(null);
    try {
      const res = await fetch("/api/dashboard/family/subject-addon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, domainId: addon.domainId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      onError(data?.error ?? t("payError"));
      // A place freed up meanwhile: nothing to pay, the subject can be added as it is.
      if (res.status === 409) onClose();
    } catch {
      onError(t("payError"));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="rounded-lg border border-blue-800/60 bg-blue-900/15 p-3 text-sm sm:p-4">
      <p className="text-blue-100">
        {t("price", { index: addon.quote.subjectIndex, price: fmtPrice(addon.quote.minor / 100, locale), interval: addon.quote.interval })}
      </p>
      <p className="mt-1 text-xs text-gray-400">{t("separate")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void pay()}
          disabled={paying}
          className="min-h-[40px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {paying ? t("preparing") : t("pay", { name: addon.name })}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={paying}
          className="min-h-[40px] rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

/** When to look again after the payment page returns: the payment service confirms within seconds. */
const CHECKS_MS = [3000, 8000, 15000, 30000];

/**
 * Back from paying for a subject: `?subject=paid&domain=<id>`, read once and taken out of the address,
 * so a reload or a shared link doesn't announce the payment again. `match` narrows it (the child the
 * payment was for). Null when the page wasn't opened from that payment.
 */
export function takePaidSubjectFromUrl(match?: (query: URLSearchParams) => boolean): { domainId: string | null } | null {
  const query = new URLSearchParams(window.location.search);
  if (query.get("subject") !== "paid" || (match && !match(query))) return null;
  const domainId = query.get("domain");
  query.delete("subject");
  query.delete("domain");
  const rest = query.toString();
  const clean = `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`;
  // After the effects of this render: on a page's first load Next hooks history.replaceState in its own
  // effect, which runs after the page's. Through that hook the router learns the new address and keeps its
  // state on the entry; with no state of our own, it copies its own (passing it back would make the router
  // take the call as internal and write the old address back later).
  window.setTimeout(() => window.history.replaceState(null, "", clean), 0);
  return { domainId };
}

/**
 * Looks again while the payment is being confirmed, and stops as soon as the subject is there — or
 * after the last look (`found` false). Returns the function that stops it.
 */
export function watchPaidSubject(isThere: () => Promise<boolean>, done: (found: boolean) => void): () => void {
  let stopped = false;
  let timer = 0;
  const look = (i: number) => {
    timer = window.setTimeout(async () => {
      const found = await isThere().catch(() => false);
      if (stopped) return;
      if (found || i + 1 >= CHECKS_MS.length) done(found);
      else look(i + 1);
    }, CHECKS_MS[i]);
  };
  look(0);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}
