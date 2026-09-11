"use client";

import { useState } from "react";
import { FIRME_EMITENTE, EMITENTI, type EmitentSlug } from "@/lib/firme-emitente";

export type FirmaRand = {
  id: string;
  name: string;
  slug: string;
  materii: number;
  cursanti: number;
  meteredIncluded: boolean;
  billingPlan: string | null;
  billingAmount: number | null;
  billingCurrency: string;
  billingPeriod: "LUNAR" | "TRIMESTRIAL" | "ANUAL" | null;
  billingStartsAt: string | null;
  billingNote: string | null;
  billingEntity: string;
  whatsappLunaAsta: number;
  smsLunaAsta: number;
};

const RITMURI = [
  { v: "", e: "— nestabilit —" },
  { v: "LUNAR", e: "Lunar" },
  { v: "TRIMESTRIAL", e: "Trimestrial" },
  { v: "ANUAL", e: "Anual" },
] as const;

/** Suma se ține în bani întregi; la afișare devine lei cu două zecimale. */
function lei(bani: number | null, moneda: string) {
  if (bani === null) return "—";
  return `${(bani / 100).toLocaleString("ro-RO", { minimumFractionDigits: 2 })} ${moneda}`;
}

export function FirmeManager({ firme, luna }: { firme: FirmaRand[]; luna: string }) {
  const [deschis, setDeschis] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h2 className="text-lg font-semibold text-white">Firme facturate separat</h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-400">
          Un client B2B nu are abonamente individuale: își înscrie oamenii și primește o
          factură. Aici se stabilesc condițiile și se vede ce s-a consumat pe ele în luna{" "}
          <span className="text-gray-200">{luna}</span>. Firma vede ce plătește; schimbă
          doar cine are dreptul, adică noi.
        </p>
      </div>

      {firme.length === 0 ? (
        <p className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-8 text-center text-sm text-gray-400">
          Nicio firmă înregistrată încă.
        </p>
      ) : (
        <div className="space-y-3">
          {firme.map((f) => (
            <div key={f.id} className="rounded-xl border border-gray-800 bg-gray-900">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{f.name}</span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs ${
                        f.meteredIncluded
                          ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
                          : "border-gray-700 bg-gray-800 text-gray-400"
                      }`}
                    >
                      {f.meteredIncluded ? "WhatsApp + SMS incluse" : "fără canale plătite"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Emite factura:{" "}
                    <span className="text-gray-300">
                      {FIRME_EMITENTE[f.billingEntity as EmitentSlug]?.nume ?? f.billingEntity}
                    </span>
                    {" "}· {f.materii} materii · {f.cursanti} cursanți ·{" "}
                    {f.billingPlan || <span className="text-gray-600">plan nestabilit</span>}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="text-white">{lei(f.billingAmount, f.billingCurrency)}</div>
                    <div className="text-xs text-gray-500">
                      {RITMURI.find((r) => r.v === (f.billingPeriod ?? ""))?.e}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-300">
                      {f.whatsappLunaAsta} WhatsApp · {f.smsLunaAsta} SMS
                    </div>
                    <div className="text-xs text-gray-500">trimise luna asta</div>
                  </div>
                  <button
                    onClick={() => setDeschis(deschis === f.id ? null : f.id)}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
                  >
                    {deschis === f.id ? "Închide" : "Schimbă"}
                  </button>
                </div>
              </div>
              {deschis === f.id && <Formular firma={f} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Formular({ firma }: { firma: FirmaRand }) {
  const [plan, setPlan] = useState(firma.billingPlan ?? "");
  // Se editează în LEI, se trimite în bani: ce vede omul în formular e ce scrie pe factură.
  const [suma, setSuma] = useState(firma.billingAmount === null ? "" : String(firma.billingAmount / 100));
  const [moneda, setMoneda] = useState(firma.billingCurrency);
  const [ritm, setRitm] = useState<string>(firma.billingPeriod ?? "");
  const [start, setStart] = useState(firma.billingStartsAt ?? "");
  const [nota, setNota] = useState(firma.billingNote ?? "");
  const [incluse, setIncluse] = useState(firma.meteredIncluded);
  const [emitent, setEmitent] = useState(firma.billingEntity);
  const [stare, setStare] = useState<"gata" | "salvez" | "salvat" | string>("gata");

  async function salveaza() {
    const brut = suma.trim().replace(",", ".");
    if (brut !== "" && !/^\d+(\.\d{1,2})?$/.test(brut)) {
      setStare("Suma se scrie în lei, cu cel mult două zecimale (ex. 1250 sau 1250,50).");
      return;
    }
    setStare("salvez");
    const res = await fetch(`/api/admin/organizations/${firma.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setBilling",
        meteredIncluded: incluse,
        billingPlan: plan.trim() || null,
        billingAmount: brut === "" ? null : Math.round(parseFloat(brut) * 100),
        billingCurrency: moneda,
        billingPeriod: ritm === "" ? null : ritm,
        billingStartsAt: start === "" ? null : new Date(start + "T00:00:00.000Z").toISOString(),
        billingNote: nota.trim() || null,
        billingEntity: emitent,
      }),
    });
    if (!res.ok) {
      setStare(`Nu s-a salvat (${res.status}).`);
      return;
    }
    setStare("salvat");
    location.reload();
  }

  return (
    <div className="space-y-3 border-t border-gray-800 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Camp eticheta="Plan (cum îi spunem în discuție)">
          <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="B2B — factură separată" className={INPUT} />
        </Camp>
        <Camp eticheta="Preț, în lei">
          <div className="flex gap-2">
            <input value={suma} onChange={(e) => setSuma(e.target.value)} placeholder="ex. 1250" inputMode="decimal" className={INPUT} />
            <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={INPUT + " w-24"}>
              <option value="RON">RON</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </Camp>
        <Camp eticheta="Ritm">
          <select value={ritm} onChange={(e) => setRitm(e.target.value)} className={INPUT}>
            {RITMURI.map((r) => (
              <option key={r.v} value={r.v}>{r.e}</option>
            ))}
          </select>
        </Camp>
        <Camp eticheta="Prima factură de la">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={INPUT} />
        </Camp>
        <Camp eticheta="Emite factura">
          <select value={emitent} onChange={(e) => setEmitent(e.target.value)} className={INPUT}>
            {EMITENTI.map((slug) => (
              <option key={slug} value={slug}>
                {FIRME_EMITENTE[slug].nume} — {FIRME_EMITENTE[slug].tva ? "plătitoare de TVA" : "neplătitoare de TVA"}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-500">
            CUI {FIRME_EMITENTE[emitent as EmitentSlug]?.cui} · {FIRME_EMITENTE[emitent as EmitentSlug]?.regCom}
          </span>
        </Camp>
        <Camp eticheta="Canale contorizate">
          <label className="flex items-center gap-2 py-2 text-sm text-gray-300">
            <input type="checkbox" checked={incluse} onChange={(e) => setIncluse(e.target.checked)} className="h-4 w-4" />
            WhatsApp și SMS incluse pentru cursanții firmei
          </label>
        </Camp>
      </div>
      <Camp eticheta="Notă (ce s-a convenit, în cuvintele voastre)">
        <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} className={INPUT} />
      </Camp>
      <div className="flex items-center gap-3">
        <button
          onClick={salveaza}
          disabled={stare === "salvez"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {stare === "salvez" ? "Salvez…" : "Salvează"}
        </button>
        {stare !== "gata" && stare !== "salvez" && (
          <span className={`text-sm ${stare === "salvat" ? "text-emerald-400" : "text-red-400"}`}>
            {stare === "salvat" ? "Salvat." : stare}
          </span>
        )}
      </div>
    </div>
  );
}

const INPUT =
  "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600";

function Camp({ eticheta, children }: { eticheta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">{eticheta}</span>
      {children}
    </label>
  );
}
