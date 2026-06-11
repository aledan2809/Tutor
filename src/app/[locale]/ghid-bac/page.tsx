// Lead-magnet landing (Money Machine S2): the reel/ad CTA lands here. Romanian-only marketing
// page (the audience is RO regardless of locale segment). Public path — whitelisted in middleware.
import type { Metadata } from "next";
import { Suspense } from "react";
import { GhidBacForm } from "@/components/ghid-bac-form";

export const metadata: Metadata = {
  title: "Ghid gratuit: Top 10 greșeli la Bac matematică | etutor.ro",
  description:
    "Descarcă gratuit ghidul cu cele 10 greșeli care costă puncte la Bac matematică — și cum le eviți. Bazat pe baremele oficiale.",
};

const BULLETS = [
  "Greșelile de calcul care apar la 7 din 10 lucrări — și reflexul simplu care le elimină",
  "Capcanele de la subiectul II: „arătați că” vs „calculați” și cum se punctează diferit",
  "Cum citești baremul ca un corector — punctele pe metodă pe care le lași pe masă",
  "Planul de timp pentru examen: de ce subiectul III începe cu puncte aproape gratuite",
];

export default function GhidBacPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0a1a] via-[#1e1b4b] to-[#0b0a1a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
          Ghid PDF gratuit · 4 pagini · fără fluff
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
          Plătești meditații și <span className="text-indigo-400">tot pierzi puncte</span> la Bac mate?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-indigo-100">
          7 din 10 candidați pierd puncte pe greșeli evitabile — nu pe lipsa de cunoștințe. Ghidul
          îți arată exact unde se duc punctele și cum le ții la tine, după baremele oficiale.
        </p>

        <ul className="mt-8 space-y-3">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-3 text-indigo-50">
              <span className="mt-1 text-indigo-400">✔</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Primește ghidul pe email</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Îl primești instant + 2 emailuri scurte cu sfaturi din barem. Zero spam.
          </p>
          <Suspense fallback={null}>
            <GhidBacForm />
          </Suspense>
        </div>

        <p className="mt-8 text-center text-sm text-indigo-300">
          etutor.ro — meditații cu profesori verificați · recenzii reale · preț afișat de la început
        </p>
      </div>
    </main>
  );
}
