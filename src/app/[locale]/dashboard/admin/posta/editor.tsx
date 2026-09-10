"use client";

/**
 * Formularul de editare a paginii `/posta`.
 *
 * Nu e un editor de JSON. Un editor de JSON ar fi fost de zece ori mai puțin de scris,
 * dar userul e cel care ajustează tonul înaintea unei întâlniri cu clientul — are
 * nevoie de câmpuri cu nume în românește, în ordinea în care apar pe pagină, nu de
 * acolade. Harta `SECTIUNI` de mai jos e chiar cuprinsul paginii publice.
 *
 * Câmpul gol înseamnă „lasă originalul". De aceea nu există buton de resetare: se
 * șterge textul și gata, iar sub fiecare câmp scrie ce zice originalul, ca omul să
 * știe la ce se întoarce.
 */

import { useMemo, useState } from "react";
import type { Copy } from "@/lib/posta-copy";

type Valoare = string | string[] | Record<string, unknown> | Record<string, unknown>[];
type Draft = Record<string, Valoare>;

/** Un câmp simplu: cheia din `Copy` + eticheta pe care o vede omul. */
type CampText = { cheie: keyof Copy; eticheta: string; lung?: boolean; nota?: string };

/** O listă repetabilă: cheia + ce câmpuri are fiecare element. */
type CampLista = {
  cheie: keyof Copy;
  eticheta: string;
  nota?: string;
  /** `null` = listă de texte simple; altfel, câmpurile fiecărui element. */
  subcampuri: { cheie: string; eticheta: string; lung?: boolean }[] | null;
  /** Câmpuri care se păstrează neatinse la salvare (date structurate, nu text). */
  pastreaza?: string[];
};

type Sectiune = { titlu: string; nota?: string; campuri: (CampText | CampLista)[] };

const esteLista = (c: CampText | CampLista): c is CampLista => "subcampuri" in c;

const SECTIUNI: Sectiune[] = [
  {
    titlu: "Deschiderea",
    campuri: [
      { cheie: "badge", eticheta: "Eticheta de sus" },
      { cheie: "hero", eticheta: "Titlul mare", lung: true },
      { cheie: "subtitle", eticheta: "Paragraful de sub titlu", lung: true },
      { cheie: "ctaPdf", eticheta: "Butonul de descărcare" },
    ],
  },
  {
    titlu: "Caseta „Conținut simulat”",
    nota: "Avertismentul că materialul e scris din surse publice. E și argumentul de vânzare: fiecare presupunere e marcată.",
    campuri: [
      { cheie: "avertismentTitlu", eticheta: "Titlul casetei" },
      { cheie: "avertisment", eticheta: "Textul casetei", lung: true },
    ],
  },
  {
    titlu: "De ce nu se poate face în sală",
    campuri: [
      { cheie: "scaraTitlu", eticheta: "Titlu" },
      { cheie: "scaraLead", eticheta: "Introducere", lung: true },
      {
        cheie: "scaraCifre",
        eticheta: "Cele trei cifre",
        subcampuri: [
          { cheie: "valoare", eticheta: "Cifra" },
          { cheie: "eticheta", eticheta: "Ce înseamnă" },
        ],
      },
      { cheie: "scaraConcluzie", eticheta: "Concluzia", lung: true },
      { cheie: "scaraSursa", eticheta: "Sursa cifrelor", lung: true },
    ],
  },
  {
    titlu: "Drumul complet (graficul vertical)",
    campuri: [
      { cheie: "fluxTitlu", eticheta: "Titlu" },
      { cheie: "fluxLead", eticheta: "Introducere", lung: true },
      { cheie: "fluxAutomatEticheta", eticheta: "Eticheta pașilor automați" },
      {
        cheie: "flux",
        eticheta: "Pașii",
        nota: "Bifează „automat” la pașii care se întâmplă fără ca cineva de la client să apese ceva.",
        subcampuri: [
          { cheie: "titlu", eticheta: "Titlul pasului" },
          { cheie: "text", eticheta: "Explicația", lung: true },
        ],
        pastreaza: ["automat"],
      },
    ],
  },
  {
    titlu: "Cele trei trasee",
    campuri: [
      { cheie: "cursuriTitlu", eticheta: "Titlu" },
      { cheie: "cursuriLead", eticheta: "Introducere", lung: true },
      {
        cheie: "cursuri",
        eticheta: "Cursurile",
        subcampuri: [
          { cheie: "rol", eticheta: "Rolul" },
          { cheie: "titlu", eticheta: "Titlul cursului" },
          { cheie: "descriere", eticheta: "Descrierea", lung: true },
        ],
        pastreaza: ["module"],
      },
    ],
  },
  {
    titlu: "Ce-l face să deschidă a doua oară",
    nota: "Atenție: textele astea conțin cifrele motorului (puncte, praguri). Dacă le rescrii, cifrele rămân înghețate la valoarea de acum — în cod ele se actualizează singure.",
    campuri: [
      { cheie: "motorTitlu", eticheta: "Titlu" },
      { cheie: "motorLead", eticheta: "Introducere", lung: true },
      {
        cheie: "motor",
        eticheta: "Cardurile",
        subcampuri: [
          { cheie: "titlu", eticheta: "Titlul cardului" },
          { cheie: "text", eticheta: "Textul", lung: true },
        ],
      },
      { cheie: "motorNota", eticheta: "Nota de subsol", lung: true },
    ],
  },
  {
    titlu: "Punctajul reluării",
    nota: "Cifrele din legendă și din coloana de calcul trebuie să rămână în acord cu ce face motorul de puncte. Dacă le schimbi aici, nu se schimbă și în produs.",
    campuri: [
      { cheie: "scorTitlu", eticheta: "Titlu" },
      { cheie: "scorLead", eticheta: "Raționamentul", lung: true },
      {
        cheie: "scorLegenda",
        eticheta: "Legenda punctajului",
        subcampuri: [
          { cheie: "valoare", eticheta: "Cât valorează" },
          { cheie: "cand", eticheta: "Când se dă", lung: true },
        ],
      },
      {
        cheie: "scorCazuri",
        eticheta: "Exemplele",
        subcampuri: [
          { cheie: "caz", eticheta: "Cazul" },
          { cheie: "calcul", eticheta: "Cum se calculează" },
          { cheie: "puncte", eticheta: "Puncte" },
          { cheie: "raport", eticheta: "Ce vede conducerea" },
        ],
      },
      { cheie: "scorConcluzie", eticheta: "Concluzia", lung: true },
      { cheie: "scorNota", eticheta: "Nota de final", lung: true },
    ],
  },
  {
    titlu: "Cine rămâne în urmă",
    nota: "Treptele cascadei (ce canal, la câte minute) se citesc din codul motorului și nu se editează aici — altfel pagina ar putea spune altceva decât face produsul.",
    campuri: [
      { cheie: "cascadaTitlu", eticheta: "Titlu" },
      { cheie: "cascadaLead", eticheta: "Introducere", lung: true },
      { cheie: "cascadaOprire", eticheta: "Cum se oprește cascada", lung: true },
      { cheie: "cascadaRitm", eticheta: "Despre ritm", lung: true },
      { cheie: "cascadaDovadaTitlu", eticheta: "Titlul casetei de dovadă" },
      { cheie: "cascadaDovada", eticheta: "Textul dovezii", lung: true },
    ],
  },
  {
    titlu: "Tabloul managerului",
    campuri: [
      { cheie: "tabloTitlu", eticheta: "Titlu" },
      { cheie: "tabloLead", eticheta: "Introducere", lung: true },
      {
        cheie: "tabloRanduri",
        eticheta: "Rândurile din tablou",
        nota: "Numele sunt inventate. Bifele pe module (lecție / scor) rămân cum sunt — sunt date de demonstrație, nu text.",
        subcampuri: [
          { cheie: "nume", eticheta: "Numele" },
          { cheie: "detaliu", eticheta: "Marca și oficiul" },
          { cheie: "stare", eticheta: "Starea" },
          { cheie: "stareNota", eticheta: "Nota de sub stare" },
        ],
        pastreaza: ["module"],
      },
      { cheie: "tabloLegenda", eticheta: "Explicația de sub tablou", lung: true },
      { cheie: "tabloConducere", eticheta: "Ce vede conducerea", subcampuri: null },
    ],
  },
  {
    titlu: "Obiecțiile",
    nota: "Întrebările pe care le-ar pune clientul. Scrie-le cu ghilimele românești: „…”",
    campuri: [
      { cheie: "obiectiiTitlu", eticheta: "Titlu" },
      { cheie: "obiectiiLead", eticheta: "Introducere", lung: true },
      {
        cheie: "obiectii",
        eticheta: "Întrebările și răspunsurile",
        subcampuri: [
          { cheie: "intrebare", eticheta: "Întrebarea" },
          { cheie: "raspuns", eticheta: "Răspunsul", lung: true },
        ],
      },
    ],
  },
  {
    titlu: "Cât costă să porniți",
    campuri: [
      { cheie: "costTitlu", eticheta: "Titlu" },
      { cheie: "costLead", eticheta: "Introducere", lung: true },
      {
        cheie: "cost",
        eticheta: "Cele patru puncte",
        subcampuri: [
          { cheie: "titlu", eticheta: "Eticheta" },
          { cheie: "text", eticheta: "Textul", lung: true },
        ],
      },
    ],
  },
  {
    titlu: "De ce acum",
    campuri: [
      { cheie: "deCeTitlu", eticheta: "Titlu" },
      {
        cheie: "deCe",
        eticheta: "Cifrele de piață",
        subcampuri: [
          { cheie: "text", eticheta: "Afirmația", lung: true },
          { cheie: "sursa", eticheta: "Sursa" },
        ],
      },
    ],
  },
  {
    titlu: "Ce urmează",
    campuri: [
      { cheie: "pilotTitlu", eticheta: "Titlu" },
      { cheie: "pilotLead", eticheta: "Introducere", lung: true },
      { cheie: "pilot", eticheta: "Pașii pilotului", subcampuri: null },
    ],
  },
  {
    titlu: "Contact și încheiere",
    campuri: [
      { cheie: "contactTitlu", eticheta: "Titlul secțiunii de contact" },
      { cheie: "contactLead", eticheta: "Textul de contact", lung: true },
      { cheie: "finalTitlu", eticheta: "Titlul de final" },
      { cheie: "finalSub", eticheta: "Textul de final", lung: true },
      { cheie: "finalCta", eticheta: "Butonul de final" },
      { cheie: "finalCursant", eticheta: "Linia pentru cursanți" },
    ],
  },
];

function Textarea({
  valoare,
  original,
  lung,
  onChange,
}: {
  valoare: string;
  original: string;
  lung?: boolean;
  onChange: (v: string) => void;
}) {
  const modificat = valoare !== original;
  return (
    <div>
      {lung ? (
        <textarea
          value={valoare}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(8, Math.max(2, Math.ceil(valoare.length / 90)))}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <input
          value={valoare}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
        />
      )}
      {modificat && (
        <p className="mt-1 text-xs text-gray-500">
          <span className="text-amber-400">modificat</span> · original:{" "}
          <span className="text-gray-400">{original.slice(0, 160)}{original.length > 160 ? "…" : ""}</span>
        </p>
      )}
    </div>
  );
}

export function EditorPosta({
  implicit,
  salvat,
  locale,
}: {
  implicit: Copy;
  salvat: Record<string, unknown>;
  locale: string;
}) {
  const pornire = useMemo<Draft>(() => {
    const d: Draft = {};
    for (const [k, v] of Object.entries(implicit as unknown as Record<string, unknown>)) {
      const s = salvat[k];
      d[k] = (s !== undefined ? s : v) as Valoare;
    }
    return structuredClone(d);
  }, [implicit, salvat]);

  const [draft, setDraft] = useState<Draft>(pornire);
  const [stare, setStare] = useState<"gata" | "salvez" | "salvat" | "eroare">("gata");
  const [mesaj, setMesaj] = useState("");

  const orig = implicit as unknown as Record<string, unknown>;

  function setText(cheie: string, v: string) {
    setDraft((d) => ({ ...d, [cheie]: v }));
    setStare("gata");
  }
  function setElement(cheie: string, i: number, sub: string, v: string) {
    setDraft((d) => {
      const lista = [...((d[cheie] as Record<string, unknown>[]) ?? [])];
      lista[i] = { ...lista[i], [sub]: v };
      return { ...d, [cheie]: lista };
    });
    setStare("gata");
  }
  function setTextSimplu(cheie: string, i: number, v: string) {
    setDraft((d) => {
      const lista = [...((d[cheie] as string[]) ?? [])];
      lista[i] = v;
      return { ...d, [cheie]: lista };
    });
    setStare("gata");
  }
  function stergeElement(cheie: string, i: number) {
    setDraft((d) => {
      const lista = [...((d[cheie] as unknown[]) ?? [])];
      lista.splice(i, 1);
      return { ...d, [cheie]: lista as Valoare };
    });
    setStare("gata");
  }
  function adaugaElement(cheie: string, sablon: unknown) {
    setDraft((d) => {
      const lista = [...((d[cheie] as unknown[]) ?? [])];
      lista.push(structuredClone(sablon));
      return { ...d, [cheie]: lista as Valoare };
    });
    setStare("gata");
  }

  async function salveaza() {
    setStare("salvez");
    setMesaj("");
    try {
      const r = await fetch("/api/admin/posta-copy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy: draft }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStare("eroare");
        setMesaj(j?.error ?? `Eroare ${r.status}`);
        return;
      }
      setStare("salvat");
      setMesaj(`Salvat. ${j.campuriSchimbate ?? 0} câmpuri diferă de original.`);
    } catch (e) {
      setStare("eroare");
      setMesaj(e instanceof Error ? e.message : "Eroare de rețea");
    }
  }

  return (
    <div className="mt-8 space-y-10 pb-24">
      {SECTIUNI.map((sec) => (
        <section key={sec.titlu} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-gray-100">{sec.titlu}</h2>
          {sec.nota && <p className="mt-1 text-xs text-gray-500">{sec.nota}</p>}

          <div className="mt-5 space-y-5">
            {sec.campuri.map((camp) => {
              const cheie = camp.cheie as string;

              if (!esteLista(camp)) {
                return (
                  <label key={cheie} className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-300">{camp.eticheta}</span>
                    <Textarea
                      valoare={(draft[cheie] as string) ?? ""}
                      original={(orig[cheie] as string) ?? ""}
                      lung={camp.lung}
                      onChange={(v) => setText(cheie, v)}
                    />
                    {camp.nota && <span className="mt-1 block text-xs text-gray-500">{camp.nota}</span>}
                  </label>
                );
              }

              const lista = (draft[cheie] as unknown[]) ?? [];
              const listaOrig = (orig[cheie] as unknown[]) ?? [];
              const sablon = listaOrig[0];

              return (
                <div key={cheie}>
                  <p className="text-sm font-medium text-gray-300">{camp.eticheta}</p>
                  {camp.nota && <p className="mt-0.5 text-xs text-gray-500">{camp.nota}</p>}

                  <div className="mt-3 space-y-3">
                    {lista.map((el, i) => (
                      <div key={i} className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => stergeElement(cheie, i)}
                            className="min-h-[32px] rounded px-2 text-xs text-red-400 hover:bg-red-950/40"
                          >
                            Șterge
                          </button>
                        </div>

                        {camp.subcampuri === null ? (
                          <Textarea
                            valoare={(el as string) ?? ""}
                            original={(listaOrig[i] as string) ?? ""}
                            lung
                            onChange={(v) => setTextSimplu(cheie, i, v)}
                          />
                        ) : (
                          <div className="space-y-3">
                            {camp.subcampuri.map((sc) => (
                              <label key={sc.cheie} className="block">
                                <span className="mb-1 block text-xs text-gray-400">{sc.eticheta}</span>
                                <Textarea
                                  valoare={((el as Record<string, unknown>)?.[sc.cheie] as string) ?? ""}
                                  original={
                                    ((listaOrig[i] as Record<string, unknown>)?.[sc.cheie] as string) ?? ""
                                  }
                                  lung={sc.lung}
                                  onChange={(v) => setElement(cheie, i, sc.cheie, v)}
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {sablon !== undefined && (
                    <button
                      type="button"
                      onClick={() => adaugaElement(cheie, camp.subcampuri === null ? "" : sablon)}
                      className="mt-3 min-h-[36px] rounded-lg border border-gray-700 px-3 text-sm text-gray-300 hover:border-gray-500"
                    >
                      + Adaugă
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-xs text-gray-500">
            {mesaj || "Câmpul golit se întoarce la textul original."}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={`/${locale}/posta`}
              target="_blank"
              rel="noreferrer"
              className="min-h-[40px] rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500"
            >
              Vezi pagina
            </a>
            <button
              type="button"
              onClick={salveaza}
              disabled={stare === "salvez"}
              className={`min-h-[40px] rounded-lg px-5 py-2 text-sm font-semibold text-white ${
                stare === "eroare" ? "bg-red-600" : "bg-blue-600 hover:bg-blue-500"
              } disabled:opacity-60`}
            >
              {stare === "salvez" ? "Salvez…" : stare === "salvat" ? "Salvat ✓" : "Salvează"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
