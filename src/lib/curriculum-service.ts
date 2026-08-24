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
  /**
   * Revizia stării salvate (max updatedAt, ISO) — checklistul are acum TREI
   * scriitori (elev, părinte, meditator); PUT-ul o trimite înapoi, iar o
   * nepotrivire înseamnă că altcineva a salvat între timp → 409, clientul
   * reîncarcă. Fără ea, ultimul care apasă Salvează ștergea tăcut bifele
   * celuilalt (lost update — finding review 2026-08-25). null = bandă goală.
   */
  revision: string | null;
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

  const revision =
    checks.length > 0
      ? new Date(Math.max(...checks.map((c) => c.updatedAt.getTime()))).toISOString()
      : null;

  const overrides = new Map(checks.map((c) => [c.unitKey, c.taught]));
  const rows =
    schoolYear !== null ? buildChecklist(band, schoolYear, week, overrides) : [];

  return { band, initiated, schoolYear, week, revision, rows };
}

/**
 * Salvează checklistul: clasa + bifele. NU mai e delete-all + createMany:
 * scrierea e un MERGE per unitate care păstrează proveniența —
 *  - rândurile a căror valoare NU se schimbă rămân neatinse (markedBy/By-Id
 *    ale autorului original supraviețuiesc; înainte, o corectură de meditator
 *    ștampila INSTRUCTOR pe toate cele ~28 de rânduri și următoarea salvare a
 *    elevului le flip-uia pe toate înapoi la SELF — coloana de audit nu spunea
 *    niciodată adevărul; finding review 2026-08-25);
 *  - rândurile schimbate + cele noi primesc actorul curent (rol + id);
 *  - rândurile devenite invalide la schimbarea clasei se șterg țintit.
 *
 * Concurență: `expectedRevision` = revizia văzută de client la încărcare.
 * Nepotrivire cu starea curentă → { conflict: true }, nimic scris.
 *
 * Politici (review 2026-08-25):
 *  - schimbarea CLASEI e permisă doar SELF și GUARDIAN (părintele face
 *    inițierea; meditatorul corectează bife, nu declară clasa copilului);
 *  - User.schoolYear (fallback informativ global) se actualizează doar pe
 *    SELF/GUARDIAN — un meditator care atinge banda BAC nu mută clasa
 *    globală a copilului.
 */
export async function saveChecklist(
  userId: string,
  band: SubjectBand,
  schoolYear: number,
  taughtByUnitKey: ReadonlyMap<string, boolean>,
  markedBy: "SELF" | "GUARDIAN" | "INSTRUCTOR" = "SELF",
  opts: { markedById?: string; expectedRevision?: string | null } = {}
): Promise<{ error?: string; conflict?: boolean }> {
  if (!BAND_YEARS[band].includes(schoolYear)) {
    return { error: "schoolYear outside band" };
  }
  const validUnits = unitsForStudent(band, schoolYear);
  if (validUnits.length === 0) {
    return { error: "band has no units for this schoolYear" };
  }
  const validKeys = new Set(validUnits.map((u) => u.key));
  for (const key of taughtByUnitKey.keys()) {
    if (!validKeys.has(key)) return { error: `unknown unit: ${key}` };
  }

  const existing = await prisma.curriculumCheck.findMany({ where: { userId, band } });
  const currentRevision =
    existing.length > 0
      ? new Date(Math.max(...existing.map((c) => c.updatedAt.getTime()))).toISOString()
      : null;
  if (
    opts.expectedRevision !== undefined &&
    opts.expectedRevision !== currentRevision
  ) {
    return { conflict: true };
  }

  const savedYear = existing[0]?.schoolYear ?? null;
  if (savedYear !== null && savedYear !== schoolYear && markedBy === "INSTRUCTOR") {
    return { error: "instructors correct ticks, not the declared class" };
  }

  const byKey = new Map(existing.map((c) => [c.unitKey, c]));
  const markedById = opts.markedById ?? (markedBy === "SELF" ? userId : undefined);

  const writes = [];
  // Rândurile devenite invalide (an schimbat) — șterse țintit, pe chei.
  const staleKeys = existing.filter((c) => !validKeys.has(c.unitKey)).map((c) => c.unitKey);
  if (staleKeys.length > 0) {
    writes.push(
      prisma.curriculumCheck.deleteMany({ where: { userId, band, unitKey: { in: staleKeys } } })
    );
  }
  const toCreate = [];
  for (const u of validUnits) {
    const want = taughtByUnitKey.get(u.key) ?? false;
    const have = byKey.get(u.key);
    if (!have) {
      toCreate.push({ userId, band, unitKey: u.key, schoolYear, taught: want, markedBy, markedById });
    } else if (have.taught !== want || have.schoolYear !== schoolYear) {
      writes.push(
        prisma.curriculumCheck.update({
          where: { id: have.id },
          data: { taught: want, schoolYear, markedBy, markedById },
        })
      );
    }
    // valoare identică + an identic → rândul rămâne neatins (proveniența ține)
  }
  if (toCreate.length > 0) {
    writes.push(prisma.curriculumCheck.createMany({ data: toCreate }));
  }
  if (markedBy !== "INSTRUCTOR") {
    writes.push(prisma.user.update({ where: { id: userId }, data: { schoolYear } }));
  }
  if (writes.length > 0) await prisma.$transaction(writes);
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
