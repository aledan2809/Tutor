"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { needsParentConsent } from "@/lib/age";

/** What the dashboard asks of a learner on their own account (parent-consent.ts consentState). */
export type AgeConsentView =
  | { kind: "ask-age" }
  | { kind: "ask-parent" }
  | { kind: "waiting"; parentEmail: string; daysLeft: number }
  | { kind: "blocked"; reason: "no-answer" | "refused"; parentEmail: string | null };

const card = "rounded-2xl border border-gray-800 bg-gray-900 p-5";
const input =
  "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none";
const primary = "min-h-[44px] rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50";

function years(): number[] {
  const last = new Date().getFullYear() - 5;
  return Array.from({ length: last - 1919 }, (_, i) => last - i);
}

type Locale = "ro" | "en";

async function post(url: string, body: unknown, locale: Locale): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true };
    // The server's sentences are Romanian; an English page gets a general one.
    return { ok: false, error: locale === "ro" && typeof d.error === "string" ? d.error : locale === "ro" ? "N-a mers. Încearcă din nou." : "That didn't work. Please check and try again." };
  } catch {
    return { ok: false, error: locale === "ro" ? "Nu ne-am putut conecta. Verifică internetul și încearcă din nou." : "We couldn't connect. Check your internet and try again." };
  }
}

/** A parent's email: sent (again) or changed. */
function ParentEmailForm({ label, cta, onSent, locale }: { label: string; cta: string; onSent: () => void; locale: Locale }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await post("/api/me/parent-consent", { parentEmail: email, locale }, locale);
        setBusy(false);
        if (r.ok) onSent();
        else setError(r.error ?? null);
      }}
    >
      <label className="block text-sm text-gray-400" htmlFor="parent-email">{label}</label>
      <input id="parent-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={locale === "ro" ? "parinte@exemplu.ro" : "parent@example.com"} autoCapitalize="none" className={input} />
      <button type="submit" disabled={busy} className={primary}>{busy ? (locale === "ro" ? "Se trimite…" : "Sending…") : cta}</button>
      {error && <p className="text-sm text-amber-400">{error}</p>}
    </form>
  );
}

/**
 * The age question and the parent's consent (Alex, 28.09.2026). „ask-age”, „ask-parent” and „blocked”
 * take the whole page; „waiting” is a card above it.
 */
export function AgeConsent({ view, locale = "ro" }: { view: AgeConsentView; locale?: Locale }) {
  const router = useRouter();
  const ro = locale === "ro";
  const [year, setYear] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState(false);
  const [sent, setSent] = useState(false);
  const minor = year !== "" && needsParentConsent(Number(year));
  const sendCta = ro ? "Trimite" : "Send";
  const parentLabel = ro ? "Emailul părintelui" : "The parent's email";

  if (view.kind === "ask-age") {
    return (
      <div className={`${card} mx-auto max-w-md`}>
        <h1 className="text-xl font-bold text-white">{ro ? "Încă o întrebare" : "One more question"}</h1>
        <p className="mt-2 text-sm text-gray-300">
          {ro
            ? "În ce an te-ai născut? Sub 16 ani, legea cere acordul unui părinte pentru cont."
            : "What year were you born? Under 16, the law asks for a parent's consent for the account."}
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!year) return setError(ro ? "Alege anul nașterii." : "Choose your year of birth.");
            setBusy(true);
            setError(null);
            const r = await post("/api/me/age", { birthYear: Number(year), parentEmail: minor ? parentEmail : undefined, locale }, locale);
            setBusy(false);
            if (r.ok) router.refresh();
            else setError(r.error ?? null);
          }}
        >
          <label className="block text-sm text-gray-400" htmlFor="birth-year">{ro ? "Anul nașterii" : "Year of birth"}</label>
          <select id="birth-year" value={year} onChange={(e) => setYear(e.target.value)} className={input}>
            <option value="">{ro ? "Alege anul" : "Choose the year"}</option>
            {years().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {minor && (
            <div>
              <label className="block text-sm text-gray-400" htmlFor="parent-email-first">{ro ? "Emailul unui părinte" : "A parent's email"}</label>
              <input id="parent-email-first" type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder={ro ? "parinte@exemplu.ro" : "parent@example.com"} autoCapitalize="none" className={input} />
              <p className="mt-1 text-xs text-gray-500">
                {ro ? "Îi trimitem un email cu un link. Până răspunde, contul merge normal 7 zile." : "We email them a link. Until they answer, the account works normally for 7 days."}
              </p>
            </div>
          )}
          <button type="submit" disabled={busy} className={primary}>{busy ? (ro ? "Se salvează…" : "Saving…") : ro ? "Continuă" : "Continue"}</button>
          {error && <p className="text-sm text-amber-400">{error}</p>}
        </form>
      </div>
    );
  }

  if (view.kind === "ask-parent") {
    return (
      <div className={`${card} mx-auto max-w-md`}>
        <h1 className="text-xl font-bold text-white">{ro ? "Acordul unui părinte" : "A parent's consent"}</h1>
        <p className="mt-2 text-sm text-gray-300">
          {ro
            ? "Pentru vârsta ta, legea cere acordul unui părinte. Scrie emailul unui părinte: îi trimitem un link, iar până răspunde contul merge normal 7 zile."
            : "At your age, the law asks for a parent's consent. Enter a parent's email: we send them a link, and until they answer the account works normally for 7 days."}
        </p>
        <ParentEmailForm label={parentLabel} cta={sendCta} onSent={() => router.refresh()} locale={locale} />
      </div>
    );
  }

  if (view.kind === "waiting") {
    const days =
      view.daysLeft <= 0
        ? ro ? "Părintele n-a răspuns încă; roagă-l să deschidă emailul." : "The parent hasn't answered yet; ask them to open the email."
        : ro
          ? `Contul merge încă ${view.daysLeft === 1 ? "o zi" : `${view.daysLeft} zile`} fără răspunsul lui.`
          : `The account works ${view.daysLeft === 1 ? "one more day" : `${view.daysLeft} more days`} without their answer.`;
    return (
      <div className="mb-4 rounded-xl border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        <p>
          {sent
            ? ro ? "Am trimis din nou. " : "Sent again. "
            : ro
              ? `Am trimis un email la ${view.parentEmail}, ca părintele tău să-și dea acordul. `
              : `We emailed ${view.parentEmail} so your parent can give their consent. `}
          {days}
        </p>
        {!resend ? (
          <button onClick={() => setResend(true)} className="mt-1 text-xs font-semibold text-amber-300 hover:text-amber-200">
            {ro ? "Retrimite sau scrie altă adresă" : "Send again or use another address"}
          </button>
        ) : (
          <ParentEmailForm
            label={parentLabel}
            cta={sendCta}
            locale={locale}
            onSent={() => {
              setSent(true);
              setResend(false);
              router.refresh();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`${card} mx-auto max-w-md`}>
      <h1 className="text-xl font-bold text-white">{ro ? "Contul așteaptă un părinte" : "The account is waiting for a parent"}</h1>
      <p className="mt-2 text-sm text-gray-300">
        {view.reason === "refused"
          ? ro
            ? "Părintele căruia i-am scris n-a fost de acord, așa că, deocamdată, contul e oprit. Tot ce ai lucrat rămâne salvat. Contul se deschide dacă un părinte își dă acordul."
            : "The parent we wrote to didn't agree, so for now the account is stopped. Everything you did stays saved. It opens again if a parent gives their consent."
          : ro
            ? `Pentru vârsta ta, legea cere acordul unui părinte. Am scris${view.parentEmail ? ` la ${view.parentEmail}` : ""}, dar n-a răspuns încă. Roagă-l să deschidă emailul de la eTutor.ro; tot ce ai lucrat rămâne salvat.`
            : `At your age, the law asks for a parent's consent. We wrote${view.parentEmail ? ` to ${view.parentEmail}` : ""}, but there's no answer yet. Ask them to open the email from eTutor.ro; everything you did stays saved.`}
      </p>
      {sent && (
        <p className="mt-3 text-sm text-green-300">
          {ro ? "Am trimis. Contul se deschide când părintele își dă acordul." : "Sent. The account opens once the parent gives their consent."}
        </p>
      )}
      <ParentEmailForm
        label={view.reason === "refused" ? (ro ? "Poți scrie celuilalt părinte" : "You can write to your other parent") : ro ? "Retrimite sau scrie altă adresă" : "Send again or use another address"}
        cta={sendCta}
        locale={locale}
        onSent={() => {
          setSent(true);
          router.refresh();
        }}
      />
    </div>
  );
}
