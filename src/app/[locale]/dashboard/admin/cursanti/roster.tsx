"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

export type ModuleCol = { id: string; order: number; title: string };

export type RosterRow = {
  id: string;
  nume: string;
  functie: string | null;
  marca: string | null;
  unde: string | null;
  telefon: string;
  /** Vine de pe lista clientului? Dacă nu, a intrat pe codul comun. */
  dePeLista: boolean;
  /** Chiar nu știm cine e — fără nume, fără email, fără nume de utilizator. */
  anonim: boolean;
  /** Contul lui, dacă a intrat. Fără el nu există rezultate de deschis. */
  userId: string | null;
  stare: "netrimisa" | "trimisa" | "apasat" | "cont" | "invata" | "terminat";
  invitedAt: string | null;
  openedAt: string | null;
  moduleCells: {
    moduleId: string;
    lectieLa: string | null;
    corecte: number | null;
    total: number | null;
    testLa: string | null;
  }[];
};

/**
 * Treptele prin care trece un om, în ordine. Culoarea urcă odată cu ele, ca
 * managerul să vadă dintr-o privire unde s-a oprit fiecare — nu să citească
 * șase coloane ca să afle.
 */
const STARI: Record<RosterRow["stare"], { eticheta: string; clasa: string }> = {
  netrimisa: { eticheta: "Invitație netrimisă", clasa: "border-gray-700 bg-gray-800 text-gray-400" },
  trimisa:   { eticheta: "Invitație trimisă",   clasa: "border-sky-900 bg-sky-950/50 text-sky-300" },
  apasat:    { eticheta: "A apăsat linkul",     clasa: "border-blue-800 bg-blue-950/50 text-blue-300" },
  cont:      { eticheta: "Cont creat",          clasa: "border-indigo-800 bg-indigo-950/50 text-indigo-300" },
  invata:    { eticheta: "Învață",              clasa: "border-emerald-800 bg-emerald-950/50 text-emerald-300" },
  terminat:  { eticheta: "A terminat",          clasa: "border-emerald-600 bg-emerald-900/60 text-emerald-200" },
};

const ORDINE: RosterRow["stare"][] = ["netrimisa", "trimisa", "apasat", "cont", "invata", "terminat"];

function zi(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" });
}

/** Verde peste 70%, chihlimbar între 50 și 70, roșu sub — pragul de trecere obișnuit. */
function culoareScor(ok: number, total: number): string {
  if (total === 0) return "text-gray-500";
  const p = (ok / total) * 100;
  if (p >= 70) return "text-emerald-300";
  if (p >= 50) return "text-amber-300";
  return "text-red-300";
}

export function Roster({
  rows,
  cols,
  domainId,
}: {
  rows: RosterRow[];
  cols: ModuleCol[];
  domainId: string;
}) {
  const [q, setQ] = useState("");
  const [filtru, setFiltru] = useState<"toti" | RosterRow["stare"]>("toti");

  const numarate = useMemo(() => {
    const n: Record<string, number> = {};
    for (const s of ORDINE) n[s] = 0;
    for (const r of rows) n[r.stare] += 1;
    return n;
  }, [rows]);

  const vizibile = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filtru !== "toti" && r.stare !== filtru) return false;
      if (!t) return true;
      return [r.nume, r.functie, r.marca, r.unde, r.telefon || null]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(t));
    });
  }, [rows, q, filtru]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-8 text-center text-sm text-gray-300">
        Niciun cursant invitat încă la materia asta.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Numărătoarea pe trepte e și filtru: managerul vede „38 n-au apăsat încă"
          și apasă pe cifră ca să afle CINE sunt. */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltru("toti")}
          className={`rounded-lg border px-3 py-1.5 text-xs ${
            filtru === "toti" ? "border-gray-500 bg-gray-800 text-white" : "border-gray-700 text-gray-400"
          }`}
        >
          Toți ({rows.length})
        </button>
        {ORDINE.map((s) =>
          numarate[s] > 0 ? (
            <button
              key={s}
              onClick={() => setFiltru(filtru === s ? "toti" : s)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${STARI[s].clasa} ${
                filtru === s ? "ring-1 ring-white/40" : ""
              }`}
            >
              {STARI[s].eticheta} ({numarate[s]})
            </button>
          ) : null
        )}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Caută după nume, marcă, oficiu, județ…"
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 sm:max-w-sm"
      />

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2.5 font-semibold">Cursant</th>
              <th className="px-3 py-2.5 font-semibold">Stare</th>
              {cols.map((c) => (
                <th key={c.id} className="px-3 py-2.5 font-semibold">
                  M{c.order}
                  <span className="ml-1.5 font-normal normal-case text-gray-600">{c.title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vizibile.map((r) => (
              <tr key={r.id} className="border-t border-gray-800 align-top">
                <td className="px-3 py-3">
                  {r.userId ? (
                    <Link
                      href={`/dashboard/admin/cursanti/${r.userId}?materie=${domainId}`}
                      className="font-medium text-white hover:text-blue-300 hover:underline"
                    >
                      {r.nume}
                    </Link>
                  ) : (
                    <div className="font-medium text-white">{r.nume}</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {r.dePeLista
                      ? [r.functie, r.marca ? `marca ${r.marca}` : null].filter(Boolean).join(" · ")
                      : r.anonim
                        ? "a intrat pe codul comun — nu știm cine e"
                        : "nu e pe lista de invitații"}
                  </div>
                  {r.unde && <div className="text-xs text-gray-500">{r.unde}</div>}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-block whitespace-nowrap rounded-md border px-2 py-1 text-xs ${STARI[r.stare].clasa}`}>
                    {STARI[r.stare].eticheta}
                  </span>
                  <div className="mt-1 text-[11px] text-gray-600">
                    {r.openedAt ? `a apăsat ${zi(r.openedAt)}` : r.invitedAt ? `trimisă ${zi(r.invitedAt)}` : ""}
                  </div>
                </td>
                {r.moduleCells.map((c) => (
                  <td key={c.moduleId} className="px-3 py-3">
                    <div className="text-xs">
                      {c.lectieLa ? (
                        <span className="text-emerald-300">✓ lecția {zi(c.lectieLa)}</span>
                      ) : (
                        <span className="text-gray-600">lecția −</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs font-medium tabular-nums">
                      {c.total ? (
                        <span className={culoareScor(c.corecte ?? 0, c.total)}>
                          {c.corecte}/{c.total} · {zi(c.testLa)}
                        </span>
                      ) : (
                        <span className="text-gray-600">test −</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vizibile.length === 0 && (
        <p className="text-sm text-gray-500">Niciun cursant nu se potrivește filtrului.</p>
      )}
    </div>
  );
}
