"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

type Rand = {
  linie: number;
  lastName: string;
  firstName: string;
  jobTitle: string | null;
  badgeNo: string | null;
  phone: string;
  county: string | null;
  city: string | null;
  postOffice: string | null;
  probleme: string[];
};

type Previzualizare = {
  coloane: string[];
  necunoscute: string[];
  total: number;
  noi: number;
  actualizati: number;
  sarite: number;
  randuri: Rand[];
};

const ETICHETE: Record<string, string> = {
  lastName: "Nume", firstName: "Prenume", jobTitle: "Funcția", badgeNo: "Marca",
  phone: "Telefon", county: "Județ", city: "Localitate", postOffice: "Oficiu",
};

/**
 * Import în doi timpi. Pasul de previzualizare nu e politețe: la mii de rânduri,
 * o coloană încurcată înseamnă mii de oameni greșiți, iar dacă telefonul e greșit
 * omul nu primește nimic și nimeni nu observă.
 */
export function ImportForm({ domains }: { domains: { id: string; name: string }[] }) {
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "");
  const [text, setText] = useState("");
  const [prev, setPrev] = useState<Previzualizare | null>(null);
  const [gata, setGata] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trimite = async (aplica: boolean) => {
    if (busy || !text.trim()) return;
    setBusy(true);
    setErr(null);
    if (aplica) setGata(null);
    try {
      const res = await fetch("/api/admin/import-destinatari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, text, aplica }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error || "Nu am putut citi lista.");
        return;
      }
      if (aplica) {
        setGata(`${data.noi} adăugați, ${data.actualizati} actualizați, ${data.sarite} săriți.`);
        setPrev(null);
      } else {
        setPrev(data);
      }
    } catch {
      setErr("Nu am putut citi lista.");
    } finally {
      setBusy(false);
    }
  };

  const incarca = async (f: File | null) => {
    if (!f) return;
    setText(await f.text());
    setPrev(null);
    setGata(null);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div>
          <label htmlFor="materie" className="mb-1 block text-sm text-gray-400">Materia</label>
          <select id="materie" value={domainId} onChange={(e) => { setDomainId(e.target.value); setPrev(null); }}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white">
            {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="lista" className="mb-1 block text-sm text-gray-400">
            Lista (primul rând = numele coloanelor)
          </label>
          <textarea id="lista" value={text} rows={8}
            onChange={(e) => { setText(e.target.value); setPrev(null); setGata(null); }}
            placeholder={"Nume;Prenume;Functie;Marca;Telefon;Judet;Localitate;Oficiu\nPopescu;Ion;factor;PR-1042;0712383492;Olt;Slatina;OP Slatina 3"}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 font-mono text-xs text-white placeholder:text-gray-600" />
          <p className="mt-1 text-xs text-gray-500">
            Merge cu virgulă, punct-virgulă sau tab. Coloanele se recunosc după nume,
            în orice ordine; ce nu recunosc, îți spun.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => incarca(e.target.files?.[0] ?? null)}
            className="text-xs text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-800 file:px-3 file:py-2 file:text-xs file:text-gray-200" />
          <button onClick={() => trimite(false)} disabled={busy || !text.trim()}
            className="min-h-[44px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {busy ? "Se citește…" : "Vezi ce am înțeles"}
          </button>
        </div>

        {err && <p role="status" className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">{err}</p>}
        {gata && (
          <div role="status" className="rounded-lg border border-green-800 bg-green-900/20 px-3 py-2 text-sm text-green-300">
            Gata: {gata}{" "}
            <Link href="/dashboard/admin/cursanti" className="underline">Vezi cursanții</Link>
          </div>
        )}
      </div>

      {prev && (
        <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-gray-300"><b className="text-white tabular-nums">{prev.noi}</b> de adăugat</span>
            <span className="text-gray-300"><b className="text-white tabular-nums">{prev.actualizati}</b> de actualizat</span>
            <span className={prev.sarite > 0 ? "text-amber-300" : "text-gray-500"}>
              <b className="tabular-nums">{prev.sarite}</b> sărite
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Coloane recunoscute: {prev.coloane.map((c) => ETICHETE[c] ?? c).join(", ") || "niciuna"}
            {prev.necunoscute.length > 0 && (
              <> · <span className="text-amber-400">ignorate: {prev.necunoscute.join(", ")}</span></>
            )}
          </p>

          <div className="max-h-96 overflow-auto rounded-lg border border-gray-800">
            <table className="w-full min-w-[40rem] text-left text-xs">
              <thead className="sticky top-0 bg-gray-900 text-gray-500">
                <tr>
                  <th className="px-2 py-2">Rând</th>
                  <th className="px-2 py-2">Nume</th>
                  <th className="px-2 py-2">Telefon</th>
                  <th className="px-2 py-2">Funcția / oficiul</th>
                  <th className="px-2 py-2">Probleme</th>
                </tr>
              </thead>
              <tbody>
                {prev.randuri.map((r) => (
                  <tr key={r.linie} className={`border-t border-gray-800 ${r.probleme.length ? "bg-amber-950/20" : ""}`}>
                    <td className="px-2 py-1.5 tabular-nums text-gray-500">{r.linie}</td>
                    <td className="px-2 py-1.5 text-gray-200">{r.lastName} {r.firstName}</td>
                    <td className="px-2 py-1.5 tabular-nums text-gray-300">{r.phone || "—"}</td>
                    <td className="px-2 py-1.5 text-gray-500">
                      {[r.jobTitle, r.postOffice].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-2 py-1.5 text-amber-300">{r.probleme.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {prev.total > prev.randuri.length && (
            <p className="text-xs text-gray-500">
              Se arată primele {prev.randuri.length} din {prev.total}. Se importă toate.
            </p>
          )}

          <button onClick={() => trimite(true)} disabled={busy || prev.noi + prev.actualizati === 0}
            className="min-h-[44px] w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
            {busy ? "Se importă…" : `Importă ${prev.noi + prev.actualizati} cursanți`}
          </button>
          <p className="text-center text-xs text-gray-500">
            Nu se trimite niciun mesaj. Invitațiile se trimit separat.
          </p>
        </div>
      )}
    </div>
  );
}
