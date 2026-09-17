"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type TrialState = {
  enabled: boolean;
  startsAt: string | null;
  counts?: { freeForever: number; withoutOwnPlan: number };
};

/**
 * The switch for the 7-day trial and the day-8 pause (see /api/admin/access-trial). It changes
 * what every unpaid family can do, so it says what happens and asks before doing it.
 */
export function AccessTrialPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, setState] = useState<TrialState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/access-trial");
    if (res.ok) setState(await res.json());
  };

  // Reloads when the list below marks or unmarks an account (the counts change).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/access-trial")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TrialState | null) => {
        if (!cancelled && d) setState(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const toggle = async (enabled: boolean) => {
    if (!window.confirm(enabled ? t("trialConfirmOn") : t("trialConfirmOff"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/access-trial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError(t("trialSaveError"));
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;
  const since = state.startsAt
    ? new Date(state.startsAt).toLocaleString(locale === "en" ? "en-GB" : "ro-RO", {
        timeZone: "Europe/Bucharest",
        dateStyle: "long",
        timeStyle: "short",
      })
    : null;

  return (
    <section
      aria-labelledby="access-trial-title"
      className={`rounded-lg border p-4 ${state.enabled ? "border-amber-600/50 bg-amber-950/20" : "border-gray-800 bg-gray-900"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id="access-trial-title" className="text-base font-semibold text-white">
            {t("trialPanelTitle")}
          </h2>
          <p className="mt-1 text-sm text-gray-300">{state.enabled ? t("trialOn", { date: since ?? "" }) : t("trialOff")}</p>
          {state.counts && (
            <p className="mt-1 text-xs text-gray-400">
              {t("trialCounts", { freeForever: state.counts.freeForever, withoutPlan: state.counts.withoutOwnPlan })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void toggle(!state.enabled)}
          disabled={busy}
          className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            state.enabled
              ? "border border-gray-600 text-gray-200 hover:bg-gray-800"
              : "bg-amber-600 text-white hover:bg-amber-500"
          }`}
        >
          {state.enabled ? t("trialTurnOff") : t("trialTurnOn")}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
