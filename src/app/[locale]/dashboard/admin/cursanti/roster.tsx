"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

export type ModuleCol = { id: string; order: number; title: string };

export type RosterRow = {
  id: string;
  nume: string;
  functie: string | null;
  marca: string | null;
  unde: string | null;
  telefon: string;
  /** Rândul de pe lista de invitații — singurul care se poate corecta de aici. */
  recipientId: string | null;
  numeFamilie: string | null;
  prenume: string | null;
  judet: string | null;
  oras: string | null;
  oficiu: string | null;
  /** Cu ce se loghează (nume de utilizator sau email) — pentru cine și-a uitat contul. */
  utilizator: string | null;
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
    /** Câte întrebări STĂPÂNEȘTE acum (le-a nimerit măcar o dată). */
    stieAcum: number | null;
    /** Câte a atins. */
    atinse: number | null;
    /** Dintre ele, câte corecte de la prima încercare. */
    dinPrima: number | null;
    /** Câte a greșit întâi și a corectat pe urmă — numărul de susținut. */
    recuperari: number | null;
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
  const [editId, setEditId] = useState<string | null>(null);
  const router = useRouter();
  const [filtru, setFiltru] = useState<"toti" | RosterRow["stare"]>("toti");

  const numarate = useMemo(() => {
    const n: Record<string, number> = {};
    for (const s of ORDINE) n[s] = 0;
    for (const r of rows) n[r.stare] += 1;
    return n;
  }, [rows]);

  const vizibile = useMemo(() => {
    // Căutare pe ORICE câmp, fără diacritice: la mii de oameni, „Ploiesti" trebuie să
    // găsească „Ploiești", iar un telefon trebuie găsit scris și „0749…", nu doar „40749…".
    const t = fara(q.trim());
    return rows.filter((r) => {
      if (filtru !== "toti" && r.stare !== filtru) return false;
      if (!t) return true;
      const campuri = [
        r.nume, r.prenume, r.numeFamilie, r.functie, r.marca, r.unde, r.oficiu, r.oras, r.judet,
        r.telefon, r.telefon ? telefonAfisat(r.telefon) : null, r.utilizator, STARI[r.stare].eticheta,
      ];
      return campuri.some((v) => v && fara(v).includes(t));
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
        placeholder="Caută după orice: nume, telefon, utilizator, funcție, marcă, oficiu, oraș, județ…"
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
              <Fragment key={r.id}>
              <tr className="border-t border-gray-800 align-top">
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
                  <div className="mt-1 space-y-0.5 text-xs">
                    {r.telefon && (
                      <div className="text-gray-400">
                        <span className="text-gray-600">tel.</span> {telefonAfisat(r.telefon)}
                      </div>
                    )}
                    <div className="text-gray-400">
                      <span className="text-gray-600">cont</span>{" "}
                      {r.utilizator ? (
                        <span className="font-mono text-gray-300">{r.utilizator}</span>
                      ) : (
                        <span className="text-gray-600">încă necreat</span>
                      )}
                    </div>
                  </div>
                  {r.recipientId && (
                    <button
                      type="button"
                      onClick={() => setEditId(editId === r.id ? null : r.id)}
                      className="mt-1.5 text-xs text-blue-400 hover:underline"
                    >
                      {editId === r.id ? "Închide" : "Corectează datele"}
                    </button>
                  )}
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
                    {/*
                      Trei numere, nu unul. Înainte era `corecte/încercări`, adunat: cine
                      făcea 2/4 și apoi învăța cele două greșite apărea cu 4/6 = 67%, deși
                      ajunsese să știe 4 din 4. Acum scorul spune ce ȘTIE, iar reluarea se
                      vede separat, ca merit — nu ca pată.
                    */}
                    <div className="mt-0.5 text-xs font-medium tabular-nums">
                      {c.atinse ? (
                        <>
                          <span className={culoareScor(c.stieAcum ?? 0, c.atinse)}>
                            {c.stieAcum}/{c.atinse}
                          </span>
                          {c.recuperari ? (
                            <span
                              className="ml-1.5 text-amber-300"
                              title={`A greșit întâi și a corectat pe urmă ${c.recuperari} ${
                                c.recuperari === 1 ? "întrebare" : "întrebări"
                              }. Din prima: ${c.dinPrima}.`}
                            >
                              ↻{c.recuperari}
                            </span>
                          ) : null}
                          <span className="ml-1.5 text-gray-600">{zi(c.testLa)}</span>
                        </>
                      ) : (
                        <span className="text-gray-600">test −</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              {editId === r.id && r.recipientId && (
                <tr className="bg-gray-900/70">
                  <td colSpan={2 + cols.length} className="px-3 py-4">
                    <EditareDestinatar
                      row={r}
                      onGata={() => {
                        setEditId(null);
                        router.refresh();
                      }}
                    />
                  </td>
                </tr>
              )}
              </Fragment>
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

/** Fără diacritice și fără majuscule — căutarea nu trebuie să depindă de cum a scris cineva. */
function fara(v: string): string {
  return v.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** 40749591399 → 0749 591 399: cum își știe omul numărul, nu cum îl ține sistemul. */
function telefonAfisat(tel: string): string {
  const local = tel.startsWith("40") ? `0${tel.slice(2)}` : tel;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local;
}

const CAMPURI_EDITABILE: { cheie: string; eticheta: string; din: (r: RosterRow) => string }[] = [
  { cheie: "lastName", eticheta: "Nume", din: (r) => r.numeFamilie ?? "" },
  { cheie: "firstName", eticheta: "Prenume", din: (r) => r.prenume ?? "" },
  { cheie: "jobTitle", eticheta: "Funcție", din: (r) => r.functie ?? "" },
  { cheie: "badgeNo", eticheta: "Marcă", din: (r) => r.marca ?? "" },
  { cheie: "phone", eticheta: "Telefon", din: (r) => (r.telefon ? telefonAfisat(r.telefon) : "") },
  { cheie: "postOffice", eticheta: "Oficiu", din: (r) => r.oficiu ?? "" },
  { cheie: "city", eticheta: "Oraș", din: (r) => r.oras ?? "" },
  { cheie: "county", eticheta: "Județ", din: (r) => r.judet ?? "" },
];

function EditareDestinatar({ row, onGata }: { row: RosterRow; onGata: () => void }) {
  const [valori, setValori] = useState<Record<string, string>>(() =>
    Object.fromEntries(CAMPURI_EDITABILE.map((c) => [c.cheie, c.din(row)]))
  );
  const [stare, setStare] = useState<string | null>(null);
  const [salvez, setSalvez] = useState(false);

  async function salveaza() {
    // Se trimit doar câmpurile schimbate: o corectură de nume nu rescrie și telefonul.
    const initial = Object.fromEntries(CAMPURI_EDITABILE.map((c) => [c.cheie, c.din(row)]));
    const schimbate = Object.fromEntries(
      Object.entries(valori).filter(([k, v]) => v.trim() !== (initial[k] ?? "").trim())
    );
    if (Object.keys(schimbate).length === 0) {
      setStare("Nu ai schimbat nimic.");
      return;
    }
    setSalvez(true);
    setStare(null);
    const res = await fetch(`/api/admin/destinatari/${row.recipientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schimbate),
    });
    setSalvez(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setStare(typeof j.error === "string" ? j.error : `Nu s-a salvat (${res.status}).`);
      return;
    }
    onGata();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CAMPURI_EDITABILE.map((c) => (
          <label key={c.cheie} className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {c.eticheta}
            </span>
            <input
              value={valori[c.cheie]}
              onChange={(e) => setValori({ ...valori, [c.cheie]: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </label>
        ))}
      </div>
      {valori.phone.replace(/\D/g, "") !== (row.telefon ? telefonAfisat(row.telefon) : "").replace(/\D/g, "") && (
        <p className="text-xs text-amber-300">
          Invitația deja trimisă a plecat pe numărul vechi. Schimbarea contează pentru următoarea.
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={salveaza}
          disabled={salvez}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {salvez ? "Salvez…" : "Salvează"}
        </button>
        {stare && <span className="text-sm text-red-400">{stare}</span>}
      </div>
    </div>
  );
}
