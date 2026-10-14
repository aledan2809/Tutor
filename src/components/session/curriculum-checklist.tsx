"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CURRICULUM_LAG_THRESHOLD } from "@/lib/curriculum";

// Checklistul programei parcurse — cele două rânduri în paralel (cerință user):
//   rândul 1 (●/○) = programa cu calendar: ce ar fi trebuit predat până azi;
//                    informativ, se mișcă singur cu săptămânile;
//   rândul 2 (checkbox) = declarația elevului: s-a predat sau nu la clasa lui;
//                    ACESTA comandă bazinul de grile.
// Prima completare (flow-ul de inițiere) e obligatorie înaintea oricărei
// sesiuni pe un domeniu cu programă — ruta de start refuză cu 409 până atunci.

type Row = {
  key: string;
  label: string;
  year: number;
  weeks: [number, number] | null;
  expectedByNow: boolean;
  taught: boolean;
};

type ApiState = {
  band: string;
  initiated: boolean;
  schoolYear: number | null;
  week: number;
  revision: string | null;
  bandYears: number[];
  rows: Row[];
  /** Clasa e doar propusă, după data nașterii (nimic salvat încă). */
  yearFromBirthDate?: boolean;
};

// Etichetele claselor vin din i18n (curriculum.year5..year12) — ordinalele
// românești hardcodate ar apărea și în interfața EN (finding review).

export function CurriculumChecklist({
  domainSlug,
  childId,
  forceOpen,
  onSaved,
}: {
  domainSlug: string;
  /**
   * Checklistul unui COPIL, editat de părinte (Guardian) sau meditator
   * (instructor pe domeniu) — decizia user: bifa poate veni de la oricare,
   * în paralel cu elevul. Serverul verifică relația și stampează markedBy.
   */
  childId?: string;
  /** Pagina o setează când start-ul a răspuns 409 needsCurriculumSetup. */
  forceOpen?: boolean;
  /** `first`: a fost inițierea (prima salvare) — pagina pornește atunci testul promis de buton. */
  onSaved?: (info: { first: boolean }) => void;
}) {
  const t = useTranslations("curriculum");
  const [state, setState] = useState<ApiState | null>(null);
  const [open, setOpen] = useState(false);
  const [schoolYear, setSchoolYear] = useState<number | null>(null);
  const [taught, setTaught] = useState<Map<string, boolean>>(new Map());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Inițierea elevului e un singur buton (Alex 14.10.2026); lista întreagă doar la cerere.
  const [showAll, setShowAll] = useState(false);
  // Between picking a grade and its rows arriving, the ticks on screen belong to the old grade.
  const [loadingYear, setLoadingYear] = useState(false);

  // Rândurile serverului sunt sursa unică — nu ținem o copie separată (o copie
  // "rows" în paralel cu state.rows a ascuns exact bug-ul listei goale la
  // review, fiecare cititor uitându-se la alta).
  const rows: Row[] = state?.rows ?? [];

  const load = useCallback(
    async (year?: number) => {
      setError(null);
      // ?schoolYear= cere serverului rândurile pentru anul abia ales — un user
      // nou n-are an salvat, iar fără parametru ar primi rows:[] (lockout).
      const params = new URLSearchParams();
      if (year !== undefined) params.set("schoolYear", String(year));
      if (childId) params.set("childId", childId);
      // NU .size: e API din 2023 (Safari 17+); pe un browser mai vechi ar fi
      // undefined → falsy → query-ul ar dispărea și componenta ar încărca (și
      // la salvare AR SUPRASCRIE) checklistul ADULTULUI în locul copilului.
      const qs = params.toString();
      const res = await fetch(`/api/${domainSlug}/curriculum${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        // 404 = domeniu fără programă; alte erori — componenta tace, sesiunile
        // pe domenii fără bandă nu depind de ea.
        setState(null);
        return;
      }
      const data: ApiState = await res.json();
      setState(data);
      setSchoolYear(data.schoolYear ?? null);
      setTaught(new Map(data.rows.map((r) => [r.key, r.taught])));
      // Auto-deschidere: elevul neinițiat cu clasă cunoscută; iar pe paginile
      // părintelui/meditatorului (childId) și copilul FĂRĂ clasă declarată —
      // altfel un copil neinițiat n-ar arăta nimic acolo și adultul n-ar putea
      // face inițierea în locul lui (exact dreptul decis de user).
      if (!data.initiated && (data.schoolYear !== null || childId)) setOpen(true);
    },
    [domainSlug, childId]
  );

  useEffect(() => {
    setState(null);
    setOpen(false);
    void load();
  }, [load]);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  // Clasa aleasă → refetch cu anul cerut: serverul construiește rândurile și
  // pre-completarea din calendar pentru acel an (rândul 1 + rândul 2 implicit).
  const pickYear = async (year: number) => {
    setSchoolYear(year);
    setLoadingYear(true);
    try {
      await load(year);
    } finally {
      setLoadingYear(false);
    }
    setOpen(true);
  };

  const save = async () => {
    if (schoolYear === null || loadingYear) return;
    setSaving(true);
    setError(null);
    const first = !state?.initiated;
    try {
      const params = new URLSearchParams();
      if (childId) params.set("childId", childId);
      const qs = params.toString();
      const res = await fetch(`/api/${domainSlug}/curriculum${qs ? `?${qs}` : ""}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolYear,
          taught: Object.fromEntries(taught),
          // Revizia văzută la încărcare — checklistul are trei scriitori
          // (elev/părinte/meditator); serverul refuză cu 409 dacă altcineva a
          // salvat între timp, ca ultimul Salvează să nu-i șteargă tăcut bifele.
          revision: state?.revision ?? null,
        }),
      });
      if (res.status === 409) {
        await load(schoolYear ?? undefined);
        setOpen(true);
        setError(t("conflictReloaded"));
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? t("saveError"));
        return;
      }
      await load();
      setOpen(false);
      onSaved?.({ first });
    } finally {
      setSaving(false);
    }
  };

  // Fără stare (domeniu fără programă / fetch eșuat / încă se încarcă): nimic — dar dacă pagina a cerut
  // lista (start refuzat cu 409), măcar motivul, ca apăsarea pe „Începe” să nu pară că nu face nimic.
  if (!state) {
    return forceOpen ? (
      <p role="status" className="mb-3 rounded-lg border border-amber-800 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
        {t("gateSetup")}
      </p>
    ) : null;
  }

  const visibleRows = schoolYear === null ? [] : rows.filter((r) => r.year <= schoolYear);
  const taughtCount = visibleRows.filter((r) => taught.get(r.key)).length;
  // Decalajul programă↔bife (starea SALVATĂ, nu editarea în curs): aceeași
  // regulă ca atenționarea săptămânală — vizibil aici oricând, nu doar lunea.
  const lag = state.rows.filter((r) => r.expectedByNow && !r.taught).length;
  const lagVisible = lag > CURRICULUM_LAG_THRESHOLD;
  const years = [...new Set(visibleRows.map((r) => r.year))].sort((a, b) => a - b);

  // Card compact după inițiere — permanent vizibil, click = editare.
  if (!open && state.initiated) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-left hover:border-gray-700"
      >
        <span className="text-sm text-gray-300">
          📚 {t("summary", { count: taughtCount, total: visibleRows.length })}
          {lagVisible && (
            <span className="ml-2 rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
              {t("lagBadge", { count: lag })}
            </span>
          )}
          {state.schoolYear !== null && (
            <span className="ml-2 text-gray-500">
              · {t("classLabel")} {t(`year${state.schoolYear}`)}
            </span>
          )}
        </span>
        <span className="min-h-[44px] min-w-[44px] content-center text-right text-blue-400">
          {t("edit")} →
        </span>
      </button>
    );
  }

  if (!open) return null;

  const yearSelect = (
    <select
      id="curriculum-year"
      value={schoolYear ?? ""}
      onChange={(e) => void pickYear(Number(e.target.value))}
      className="min-h-[44px] w-full max-w-xs rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
    >
      <option value="" disabled>
        {t("pickClass")}
      </option>
      {state.bandYears.map((y) => (
        <option key={y} value={y}>
          {t("classLabel")} {t(`year${y}`)}
        </option>
      ))}
    </select>
  );

  // Inițierea elevului: clasa (propusă după data nașterii) + capitolele pre-bifate după programă,
  // confirmate cu un buton. Regula din 24.08 rămâne: se confirmă în aplicație înaintea primului test.
  // Nu și pe paginile părintelui/meditatorului (childId) și nu când nimic nu e încă în programă.
  if (!childId && !state.initiated && !showAll && schoolYear !== null && taughtCount > 0) {
    return (
      <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-900 p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300">{t("firstTag")}</p>
        <h2 className="mt-1.5 text-lg font-extrabold text-white">
          {t("firstTitle", { year: t(`year${schoolYear}`) })}
        </h2>
        <label htmlFor="curriculum-year" className="sr-only">
          {t("whichClass")}
        </label>
        <div className="mt-2">{yearSelect}</div>
        {state.yearFromBirthDate && <p className="mt-1 text-xs text-gray-500">{t("yearFromBirth")}</p>}
        <p className="mt-4 text-sm leading-relaxed text-gray-300">
          {t.rich("firstSummary", { count: taughtCount, b: (c) => <b className="text-white">{c}</b> })}
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || loadingYear}
          className="mt-4 min-h-[48px] w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t("saving") : t("firstConfirm")}
        </button>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          disabled={loadingYear}
          className="mt-2 min-h-[44px] w-full rounded-xl border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          {t("firstChange")}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-white">{t("title")}</h2>
      {/* Prima completare a elevului: spune și de ce nu a pornit testul (pagina nu mai repetă). */}
      {!childId && !state.initiated && <p className="mt-1 text-sm text-amber-200">{t("gateSetup")}</p>}
      <p className="mt-1 text-sm text-gray-400">{t("intro")}</p>
      {lagVisible && (
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          ⚠️ {t("lagBanner", { count: lag })}
        </p>
      )}

      {/* Pasul 1: clasa */}
      <div className="mt-4">
        <label htmlFor="curriculum-year" className="mb-1 block text-sm text-gray-400">
          {t("whichClass")}
        </label>
        {yearSelect}
        {/* Also for a parent or tutor: the grade shown is only a proposal until someone saves it. */}
        {state.yearFromBirthDate && <p className="mt-1 text-xs text-gray-500">{t("yearFromBirth")}</p>}
      </div>

      {/* Pasul 2: cele două rânduri, grupate pe an */}
      {schoolYear !== null && (
        <>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span>
              <span className="text-blue-400">●</span> {t("legendExpected")}
            </span>
            <span>☑ {t("legendTaught")}</span>
          </div>

          {years.map((y) => (
            <div key={y} className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("classLabel")} {t(`year${y}`)}
                {y === schoolYear && <span className="ml-2 text-blue-400">{t("currentYear")}</span>}
              </h3>
              <ul className="space-y-1">
                {visibleRows
                  .filter((r) => r.year === y)
                  .map((r) => (
                    <li key={r.key}>
                      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-800">
                        {/* rândul 1 — programa (informativ) */}
                        <span
                          className={r.expectedByNow ? "text-blue-400" : "text-gray-600"}
                          title={r.expectedByNow ? t("expectedYes") : t("expectedNo")}
                          aria-label={r.expectedByNow ? t("expectedYes") : t("expectedNo")}
                        >
                          {r.expectedByNow ? "●" : "○"}
                        </span>
                        {/* rândul 2 — bifa elevului (comandă bazinul) */}
                        <input
                          type="checkbox"
                          checked={taught.get(r.key) ?? false}
                          onChange={(e) =>
                            setTaught((m) => new Map(m).set(r.key, e.target.checked))
                          }
                          className="h-5 w-5 rounded border-gray-600 bg-gray-800"
                        />
                        <span className="flex-1 text-sm text-gray-300">
                          {r.label}
                          {r.weeks && r.year === schoolYear && (
                            <span className="ml-2 text-xs text-gray-500">
                              S{r.weeks[0]}–S{r.weeks[1]}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || loadingYear}
              className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t("saving") : t("save")}
            </button>
            {state.initiated && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              >
                {t("cancel")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
