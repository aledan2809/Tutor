"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Brand } from "@/components/Brand";

/**
 * Recuperarea accesului, în doi pași, fără să ieși din aplicație.
 *
 * Omul de teren n-are email de serviciu, deci se identifică prin ce știe pe de
 * rost: telefonul, numele de utilizator sau marca. Codul vine pe WhatsApp, pe
 * numărul de pe lista angajatorului — nu pe cel tastat acum, ca nimeni să nu-și
 * poată trimite singur codul altcuiva.
 */
export default function RecuperarePage() {
  const router = useRouter();
  const [pas, setPas] = useState<1 | 2>(1);
  const [identificator, setIdentificator] = useState("");
  const [cod, setCod] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [arata, setArata] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gata, setGata] = useState(false);

  const cere = async () => {
    if (busy || !identificator.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await fetch("/api/auth/recuperare/cere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificator }),
      });
      setPas(2);
    } catch {
      setErr("Nu am putut trimite codul. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  };

  const schimba = async () => {
    if (busy) return;
    setErr(null);
    if (p1 !== p2) {
      setErr("Cele două parole nu sunt la fel.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/recuperare/schimba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificator, cod, parolaNoua: p1 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error || "Codul nu e bun.");
        return;
      }
      setGata(true);
      setTimeout(() => router.replace("/auth/signin"), 2500);
    } catch {
      setErr("Nu am putut schimba parola.");
    } finally {
      setBusy(false);
    }
  };

  const camp = "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder:text-gray-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center"><Brand className="text-2xl" /></div>

        <div className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          {gata ? (
            <>
              <h1 className="text-xl font-bold">Parola e schimbată</h1>
              <p className="text-sm text-gray-400">Te ducem la ecranul de intrare…</p>
            </>
          ) : pas === 1 ? (
            <>
              <div>
                <h1 className="text-xl font-bold">Ți-ai uitat parola</h1>
                <p className="mt-2 text-sm text-gray-400">
                  Scrie numărul de telefon, numele de utilizator sau marca. Îți trimitem
                  un cod pe WhatsApp, pe numărul de la serviciu.
                </p>
              </div>
              <div>
                <label htmlFor="ident" className="mb-1 block text-sm text-gray-400">
                  Telefon, nume de utilizator sau marcă
                </label>
                <input id="ident" value={identificator} autoCapitalize="none" spellCheck={false}
                  onChange={(e) => setIdentificator(e.target.value)} className={camp} />
              </div>
              {err && <p role="status" className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">{err}</p>}
              <button onClick={cere} disabled={busy || !identificator.trim()}
                className="min-h-[44px] w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                {busy ? "Se trimite…" : "Trimite codul"}
              </button>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold">Scrie codul</h1>
                <p className="mt-2 text-sm text-gray-400">
                  Dacă datele sunt bune, ai primit pe WhatsApp un cod din șase cifre.
                  E valabil zece minute.
                </p>
              </div>
              <div>
                <label htmlFor="cod" className="mb-1 block text-sm text-gray-400">Codul</label>
                <input id="cod" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={cod} onChange={(e) => setCod(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456" className={`${camp} text-center text-2xl tracking-[0.4em]`} />
              </div>
              <div>
                <label htmlFor="np1" className="mb-1 block text-sm text-gray-400">Parola nouă</label>
                <input id="np1" type={arata ? "text" : "password"} value={p1} autoComplete="new-password"
                  onChange={(e) => setP1(e.target.value)} className={camp} />
                <p className="mt-1 text-xs text-gray-500">Cel puțin 8 caractere.</p>
              </div>
              <div>
                <label htmlFor="np2" className="mb-1 block text-sm text-gray-400">Scrie parola încă o dată</label>
                <input id="np2" type={arata ? "text" : "password"} value={p2} autoComplete="new-password"
                  onChange={(e) => setP2(e.target.value)} className={camp} />
              </div>
              <button type="button" onClick={() => setArata((v) => !v)} className="text-xs text-blue-400 hover:text-blue-300">
                {arata ? "Ascunde parola" : "Arată parola"}
              </button>
              {err && <p role="status" className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">{err}</p>}
              <button onClick={schimba} disabled={busy || cod.length !== 6 || !p1 || !p2}
                className="min-h-[44px] w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                {busy ? "Se schimbă…" : "Schimbă parola"}
              </button>
              <button type="button" onClick={() => { setPas(1); setCod(""); setErr(null); }}
                className="w-full text-xs text-gray-500 hover:text-gray-300">
                Nu ai primit codul? Încearcă din nou
              </button>
            </>
          )}

          <div className="border-t border-gray-800 pt-4 text-center">
            <Link href="/auth/signin" className="text-sm text-blue-400 hover:text-blue-300">
              Înapoi la intrare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
