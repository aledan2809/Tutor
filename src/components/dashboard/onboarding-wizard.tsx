"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/**
 * Learning onboarding for a brand-new student (no enrollments yet). Replaces the
 * old "browse the domains list" dead-end with a guided 2-tap flow shown right on
 * the home page: pick your subject → start a short calibration session. Step 3
 * (the plan) happens naturally: once the first session exists, the "Astăzi" home
 * takes over with the weak-area-driven action.
 *
 * Reuses the existing APIs only: GET /api/student/domains (available list),
 * POST /api/student/domains/{id} (enroll), POST /api/{slug}/session/start.
 */

interface AvailableDomain {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description?: string | null;
}

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [available, setAvailable] = useState<AvailableDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [chosen, setChosen] = useState<AvailableDomain | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAvailable(d?.available ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Step 1: enroll in the chosen subject.
  const choose = async (dom: AvailableDomain) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/domains/${dom.id}`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || t("enrollFailed"));
        return;
      }
      setChosen(dom);
    } catch {
      setError(t("enrollFailed"));
    } finally {
      setBusy(false);
    }
  };

  // Step 2: start the short calibration session (a normal quick session).
  const startCalibration = async () => {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/${chosen.slug}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quick" }),
      });
      const result = await res.json();
      if (res.ok && result.sessionId) {
        localStorage.setItem(`session_${result.sessionId}`, JSON.stringify(result));
        router.push(`/dashboard/practice/${result.sessionId}`);
        return;
      }
      setError(result.error || t("startFailed"));
    } catch {
      setError(t("startFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">…</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-extrabold text-white">{t("welcome")}</h2>
        <p className="text-sm text-gray-400">{t("intro")}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold">
        <span className={chosen ? "text-green-400" : "text-blue-400"}>
          {chosen ? "✓" : "1"} {t("step1Short")}
        </span>
        <span className="text-gray-600">→</span>
        <span className={chosen ? "text-blue-400" : "text-gray-500"}>2 {t("step2Short")}</span>
        <span className="text-gray-600">→</span>
        <span className="text-gray-500">3 {t("step3Short")}</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-300">{error}</div>
      )}

      {!chosen ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">{t("pickSubject")}</h3>
          {available.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">
              {t("noSubjects")}
            </div>
          ) : (
            <div className="space-y-2">
              {available.map((d) => (
                <button
                  key={d.id}
                  onClick={() => choose(d)}
                  disabled={busy}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-left hover:border-blue-600/60 hover:bg-gray-800 disabled:opacity-60 min-h-[52px]"
                >
                  <span className="text-xl">{d.icon ?? "📘"}</span>
                  <span className="text-sm font-semibold text-white">{d.name}</span>
                  <span className="ml-auto text-blue-400">→</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push("/dashboard/domains")}
            className="w-full pt-1 text-center text-xs text-gray-500 hover:text-gray-300"
          >
            {t("browseAll")}
          </button>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl border border-blue-700/60 bg-gradient-to-br from-blue-950 to-gray-950 p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
            {t("step2Tag")}
          </p>
          <h3 className="mt-1.5 text-lg font-extrabold text-white">
            {t("calibrationTitle", { subject: chosen.name })}
          </h3>
          <p className="mt-1 text-sm text-blue-200/80">{t("calibrationWhy")}</p>
          <button
            onClick={startCalibration}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 min-h-[44px]"
          >
            {busy ? "…" : t("startCalibration")}
          </button>
          <p className="mt-2 text-center text-xs text-blue-200/60">{t("calibrationSkipNote")}</p>
        </section>
      )}
    </div>
  );
}
