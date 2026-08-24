// Stratul cu baza de date al programei parcurse. Nucleul pur (fără IO) e în
// src/lib/curriculum.ts; aici se leagă de user: bifele salvate, starea de
// inițiere, capitolele vizibile pentru o sesiune de Grile.

import { prisma } from "@/lib/prisma";
import {
  bandForDomainSlug,
  buildChecklist,
  schoolWeekAt,
  visibleChaptersFromChecklist,
  unitsForStudent,
  BAND_YEARS,
  type ChecklistRow,
  type SubjectBand,
} from "@/lib/curriculum";

export type CurriculumState = {
  band: SubjectBand;
  /** A trecut prin flow-ul de inițiere pe banda asta? */
  initiated: boolean;
  /** Clasa PENTRU banda asta (din bifele salvate; fallback User.schoolYear). */
  schoolYear: number | null;
  /** Săptămâna de școală curentă (0 = în afara oricărui an configurat). */
  week: number;
  rows: ChecklistRow[];
};

/**
 * Starea checklistului pentru un user pe un domeniu. null = domeniul nu e sub
 * programă (aviație, licență...) — fără poartă, fără flow.
 *
 * `previewYear` construiește rândurile pentru un an cerut de UI (flow-ul de
 * inițiere: elevul tocmai a ales clasa, dar n-a salvat încă nimic) — fără el,
 * un user nou (fără an salvat) ar primi rows:[] și ar vedea un checklist gol
 * pe care l-ar salva gol = lockout permanent (finding review 2026-08-24).
 */
export async function getCurriculumState(
  userId: string,
  domainSlug: string,
  previewYear?: number
): Promise<CurriculumState | null> {
  const band = bandForDomainSlug(domainSlug);
  if (!band) return null;

  // Un singur round-trip: userul + bifele benzii prin include (hot path —
  // rulează la fiecare pornire de sesiune pe domeniile cu programă).
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      schoolYear: true,
      curriculumChecks: { where: { band } },
    },
  });
  const checks = user?.curriculumChecks ?? [];

  // Anul benzii vine din bifele EI (per-bandă), nu din câmpul global — un cont
  // cu gimnaziu + liceu ar face altfel ping-pong între cele două checklisturi.
  const savedBandYear = checks[0]?.schoolYear ?? null;
  const fallbackYear =
    user?.schoolYear !== null && user?.schoolYear !== undefined && BAND_YEARS[band].includes(user.schoolYear)
      ? user.schoolYear
      : null;
  const schoolYear =
    previewYear !== undefined && BAND_YEARS[band].includes(previewYear)
      ? previewYear
      : savedBandYear ?? fallbackYear;

  const week = schoolWeekAt(new Date());
  const initiated = savedBandYear !== null && checks.length > 0;

  const overrides = new Map(checks.map((c) => [c.unitKey, c.taught]));
  const rows =
    schoolYear !== null ? buildChecklist(band, schoolYear, week, overrides) : [];

  return { band, initiated, schoolYear, week, rows };
}

/**
 * Salvează flow-ul de inițiere / o editare a checklistului: clasa + toate
 * bifele explicit. Starea completă trăiește în DB (delete + createMany), nu
 * împrăștiată între calendar și override-uri.
 */
export async function saveChecklist(
  userId: string,
  band: SubjectBand,
  schoolYear: number,
  taughtByUnitKey: ReadonlyMap<string, boolean>,
  markedBy: "SELF" | "GUARDIAN" | "INSTRUCTOR" = "SELF"
): Promise<{ error?: string }> {
  if (!BAND_YEARS[band].includes(schoolYear)) {
    return { error: "schoolYear outside band" };
  }
  const validUnits = unitsForStudent(band, schoolYear);
  // Gardă absolută: o salvare cu zero unități ar șterge banda și ar lăsa
  // userul neinițiabil. unitsForStudent nu mai poate întoarce gol pentru un an
  // valid, dar invarianta merită păzită aici, la scriere, nu doar acolo.
  if (validUnits.length === 0) {
    return { error: "band has no units for this schoolYear" };
  }
  const validKeys = new Set(validUnits.map((u) => u.key));
  for (const key of taughtByUnitKey.keys()) {
    if (!validKeys.has(key)) return { error: `unknown unit: ${key}` };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { schoolYear } }),
    // Starea benzii se rescrie integral: mai simplu și mai ieftin decât N
    // upserturi, și elimină din construcție rândurile orfane la schimbarea
    // clasei (nu mai există notIn cu semantica lui capcană pe listă goală).
    prisma.curriculumCheck.deleteMany({ where: { userId, band } }),
    prisma.curriculumCheck.createMany({
      data: validUnits.map((u) => ({
        userId,
        band,
        unitKey: u.key,
        schoolYear,
        taught: taughtByUnitKey.get(u.key) ?? false,
        markedBy,
      })),
    }),
  ]);
  return {};
}

/**
 * Capitolele vizibile pentru o sesiune de Grile:
 *  - null  → domeniu fără programă SAU neinițiat — apelantul decide (fără
 *            poartă / cere inițierea);
 *  - array → filtrează Question.topic pe acestea. Poate fi gol (nimic bifat).
 */
export async function visibleTopicsFor(
  userId: string,
  domainSlug: string
): Promise<string[] | null> {
  const state = await getCurriculumState(userId, domainSlug);
  if (!state || !state.initiated) return null;
  return visibleChaptersFromChecklist(state.rows);
}
