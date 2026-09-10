"use client";

import { useRef, useState } from "react";

/**
 * Formularul de încărcare. Nimic inteligent: câmpurile strict necesare ca să știm cu cine
 * vorbim, plus fișierele. Fiecare câmp în plus e un motiv de abandon exact în momentul în
 * care omul se hotărâse.
 */
export function FormularProceduri({ locale }: { locale: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [stare, setStare] = useState<"gata" | "trimit" | "trimis" | "eroare">("gata");
  const [mesaj, setMesaj] = useState("");
  const [fisiere, setFisiere] = useState<string[]>([]);

  async function trimite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStare("trimit");
    setMesaj("");
    try {
      const r = await fetch("/api/posta/proceduri", { method: "POST", body: new FormData(e.currentTarget) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStare("eroare");
        setMesaj(j?.error ?? "Nu am putut prelua fișierele. Încercați din nou.");
        return;
      }
      setStare("trimis");
      setMesaj(`Am primit ${j.fisiere} ${j.fisiere === 1 ? "fișier" : "fișiere"}.`);
      ref.current?.reset();
      setFisiere([]);
    } catch {
      setStare("eroare");
      setMesaj("Conexiunea a căzut. Încercați din nou.");
    }
  }

  if (stare === "trimis") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-800 bg-emerald-950/30 p-8 text-center">
        <p className="text-xl font-semibold text-emerald-200">Am primit documentele.</p>
        <p className="mt-2 text-sm text-gray-300">{mesaj}</p>
        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-400">
          Vă scriem în cel mult două zile lucrătoare, cu modulul rescris în frazele
          dumneavoastră. Dacă între timp aveți de adăugat ceva, răspundeți la e-mailul nostru.
        </p>
        <a
          href={`/${locale}/posta`}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-xl border border-gray-700 px-5 py-2.5 text-sm text-gray-200 hover:border-gray-500"
        >
          Înapoi la prezentare
        </a>
      </div>
    );
  }

  const camp = "w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-gray-100 focus:border-blue-500 focus:outline-none";

  return (
    <form ref={ref} onSubmit={trimite} className="mt-8 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-300">Numele dumneavoastră *</span>
          <input name="name" required maxLength={120} className={camp} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-300">Funcția</span>
          <input name="role" maxLength={120} placeholder="ex. director resurse umane" className={camp} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-300">E-mail *</span>
          <input name="email" type="email" required maxLength={160} className={camp} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-300">Telefon</span>
          <input name="phone" maxLength={40} className={camp} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-300">Procedurile *</span>
        <input
          name="files"
          type="file"
          multiple
          required
          accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.zip,.jpg,.jpeg,.png"
          onChange={(e) => setFisiere(Array.from(e.target.files ?? []).map((f) => f.name))}
          className="block w-full text-sm text-gray-400 file:mr-4 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-blue-600 file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
        />
        <span className="mt-1.5 block text-xs text-gray-500">
          PDF, Word, text, imagini sau o arhivă ZIP. Cel mult 10 fișiere, până în 15 MB fiecare.
        </span>
        {fisiere.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-gray-400">
            {fisiere.map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-300">Ceva ce ar trebui să știm</span>
        <textarea name="note" rows={4} maxLength={4000} className={camp} placeholder="Opțional — de exemplu ce e mai important să prindem primul." />
      </label>

      {stare === "eroare" && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{mesaj}</p>
      )}

      <button
        type="submit"
        disabled={stare === "trimit"}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60 sm:w-auto"
      >
        {stare === "trimit" ? "Se încarcă…" : "Trimite procedurile"}
      </button>
    </form>
  );
}
