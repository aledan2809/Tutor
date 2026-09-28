"use client";

import { useState } from "react";

/** The parent's two buttons. The answer is kept as evidence (ParentalConsent). */
export function ParentConsentAnswer({ token, locale }: { token: string; locale: "ro" | "en" }) {
  const ro = locale === "ro";
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"GIVEN" | "REFUSED" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A „no” stops the child's account: asked once more, so a misclick doesn't.
  const [confirmRefuse, setConfirmRefuse] = useState(false);

  const answer = async (decision: "GIVEN" | "REFUSED") => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/parent-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) setDone(decision);
      else setError(typeof d.error === "string" ? d.error : ro ? "N-a mers. Încearcă din nou." : "That didn't work. Please try again.");
    } catch {
      setError(ro ? "Nu ne-am putut conecta. Încearcă din nou." : "We couldn't connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <p className="mt-6 rounded-lg bg-gray-100 p-4 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {done === "GIVEN"
          ? ro
            ? "Mulțumim! Contul copilului merge mai departe. Dacă vrei să-i urmărești progresul, îți poți face și tu cont de părinte pe eTutor.ro."
            : "Thank you! Your child's account carries on. To follow their progress, you can make a parent's account on eTutor.ro too."
          : ro
            ? "Am înregistrat răspunsul. Contul copilului se oprește. Dacă te răzgândești, copilul îți poate trimite din nou linkul."
            : "We've recorded your answer. Your child's account stops. If you change your mind, your child can send you the link again."}
      </p>
    );
  }
  if (confirmRefuse) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {ro ? "Sigur? Contul copilului se oprește până când un părinte își dă acordul." : "Are you sure? Your child's account stops until a parent gives consent."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => answer("REFUSED")}
            disabled={busy}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {ro ? "Da, nu sunt de acord" : "Yes, I don't agree"}
          </button>
          <button
            onClick={() => setConfirmRefuse(false)}
            disabled={busy}
            className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {ro ? "Înapoi" : "Back"}
          </button>
        </div>
        {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => answer("GIVEN")}
          disabled={busy}
          className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {ro ? "Sunt de acord" : "I agree"}
        </button>
        <button
          onClick={() => setConfirmRefuse(true)}
          disabled={busy}
          className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {ro ? "Nu sunt de acord" : "I don't agree"}
        </button>
      </div>
      {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}
    </div>
  );
}
