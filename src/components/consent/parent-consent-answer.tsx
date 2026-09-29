"use client";

import { useState } from "react";

/**
 * The parent's two buttons. The answer is recorded in the Legal Hub against the text shown
 * (versionId); a „no” erases the child's account — at once, or, when something was paid on it, within
 * 30 days (`paid`: a person ends the subscription first and the payment records are kept).
 */
export function ParentConsentAnswer({
  token,
  versionId,
  locale,
  paid = false,
}: {
  token: string;
  versionId: string;
  locale: "ro" | "en";
  paid?: boolean;
}) {
  const ro = locale === "ro";
  const [busy, setBusy] = useState(false);
  // `decision` is missing when the account was already gone: nobody's answer is named then.
  type Done = { decision?: "GIVEN" | "REFUSED"; asked: "GIVEN" | "REFUSED"; erased: boolean; held: boolean; closed: boolean };
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A „no” erases the child's account for good: asked once more, so a misclick doesn't.
  const [confirmRefuse, setConfirmRefuse] = useState(false);

  const answer = async (decision: "GIVEN" | "REFUSED") => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/parent-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision, versionId }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setDone({
          decision: d.decision === "REFUSED" ? "REFUSED" : d.decision === "GIVEN" ? "GIVEN" : undefined,
          asked: decision,
          erased: d.erased === true,
          held: d.held === true,
          closed: d.closed === true,
        });
      } else setError(typeof d.error === "string" && ro ? d.error : ro ? "N-a mers. Încearcă din nou." : "That didn't work. Please try again.");
    } catch {
      setError(ro ? "Nu ne-am putut conecta. Încearcă din nou." : "We couldn't connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    // An earlier answer on this link is the one recorded (a lost reply, a second press): say so.
    const earlier =
      !done.closed && done.decision && done.decision !== done.asked
        ? ro
          ? `Pe acest link ai răspuns deja „${done.decision === "GIVEN" ? "sunt de acord" : "nu sunt de acord"}”, iar acel răspuns rămâne înregistrat. `
          : `You already answered „${done.decision === "GIVEN" ? "I agree" : "I don't agree"}” on this link, and that answer is the one recorded. `
        : "";
    const text = done.closed
      ? ro
        ? "Contul copilului a fost deja închis și șters."
        : "Your child's account has already been closed and erased."
      : done.decision === "GIVEN"
        ? ro
          ? "Mulțumim! Am înregistrat acordul tău: contul copilului nu se mai oprește și nu se mai șterge din lipsa lui. Dacă vrei să-i urmărești progresul, îți poți face și tu cont de părinte pe eTutor.ro."
          : "Thank you! Your consent is recorded: your child's account is no longer stopped or erased for lack of it. To follow their progress, you can make a parent's account on eTutor.ro too."
        : done.erased
          ? ro
            ? "Am înregistrat răspunsul și am șters contul copilului, cu tot ce a lucrat pe platformă."
            : "We've recorded your answer and erased your child's account, with everything they did on the platform."
          : done.held
            ? ro
              ? "Am înregistrat răspunsul și am oprit contul copilului. Pentru că pe cont s-a plătit un abonament, îl încheiem și ștergem contul în cel mult 30 de zile; păstrăm doar documentele de plată."
              : "We've recorded your answer and stopped your child's account. As a subscription was paid on it, we end it and erase the account within 30 days, keeping only the payment records."
            : ro
              ? "Am înregistrat răspunsul și am oprit contul copilului. Îl ștergem în câteva ore, cu tot ce a lucrat pe platformă."
              : "We've recorded your answer and stopped your child's account. We erase it within a few hours, with everything they did on the platform.";
    return (
      <p className="mt-6 rounded-lg bg-gray-100 p-4 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {earlier}
        {text}
      </p>
    );
  }
  if (confirmRefuse) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {paid
            ? ro
              ? "Sigur? Contul copilului se oprește acum. Pentru că pe el s-a plătit un abonament, îl încheiem și ștergem contul, cu tot ce a lucrat pe platformă, în cel mult 30 de zile; păstrăm doar documentele de plată. Ștergerea nu se poate anula."
              : "Are you sure? Your child's account stops now. As a subscription was paid on it, we end it and erase the account, with everything they did on the platform, within 30 days, keeping only the payment records. This cannot be undone."
            : ro
              ? "Sigur? Contul copilului și tot ce a lucrat pe platformă se șterg imediat. Ștergerea nu se poate anula."
              : "Are you sure? Your child's account and everything they did on the platform are erased right away. This cannot be undone."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => answer("REFUSED")}
            disabled={busy}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {ro ? "Da, nu sunt de acord — șterge contul" : "Yes, I don't agree — erase the account"}
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
