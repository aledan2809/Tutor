"use client";

// Lead-magnet capture form for /ghid-bac (Money Machine S2). Posts to the local relay
// (/api/lead-magnet) which forwards to MarketingAutomation. UTM params are read from the URL so
// reel/ad clicks keep their attribution all the way into the CRM.
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function GhidBacForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const utm: Record<string, string> = {};
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
        const v = params?.get(k);
        if (v) utm[k.replace("utm_", "")] = v.slice(0, 100);
      }
      const res = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, consent, utm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Ceva n-a mers — încearcă din nou.");
        return;
      }
      setDone(true);
    } catch {
      setError("Ceva n-a mers — încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
        <p className="text-lg font-semibold text-indigo-900">✅ Ghidul e pe drum spre inboxul tău!</p>
        <p className="mt-2 text-sm text-indigo-700">
          Nu-l vezi în 2 minute? Verifică folderul Spam/Promotions. Sau descarcă-l direct:
        </p>
        <a
          href="/ghid-bac.pdf"
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          download
        >
          Descarcă PDF-ul acum
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="text"
        placeholder="Prenumele tău (opțional)"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none"
        maxLength={80}
      />
      <input
        type="email"
        required
        placeholder="Emailul tău"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
          required
        />
        <span>
          Sunt de acord să primesc ghidul și emailuri ocazionale cu sfaturi pentru Bac de la etutor.ro.
          Mă pot dezabona oricând. <a href="/privacy" className="underline">Politica de confidențialitate</a>
        </span>
      </label>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? "Se trimite…" : "Vreau ghidul gratuit →"}
      </button>
    </form>
  );
}
