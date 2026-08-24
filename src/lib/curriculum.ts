// Programa parcursă — ce materie a apucat elevul să facă la școală.
//
// Problema pe care o rezolvă: grilele oficiale de Evaluare Națională testează
// TOATĂ materia V–VIII deodată, fiindcă se dau la finalul clasei a VIII-a. Un
// elev care intră în septembrie în clasa a VIII-a primește deci, din prima zi,
// întrebări din lecții pe care nu le-a făcut încă. La fel la BAC pentru a XII-a.
//
// Soluția: fiecare capitol are anul în care se predă; elevul (sau meditatorul /
// părintele) bifează capitolele parcurse; bazinul de întrebări conține doar
// capitolele bifate. Capitolele anilor ANTERIORI clasei curente se consideră
// parcurse implicit — altfel elevul ar trebui să bifeze manual patru ani de
// materie înainte să poată exersa ceva.
//
// Maparea e scrisă de mână, deterministă și verificabilă la bucată — deliberat
// NU generată de un model. Capitolele sunt exact cele produse de
// `scripts/lib/macro-topic.mjs`, deci `Question.topic` se potrivește direct.

export type SubjectBand = "mate-gimnaziu" | "romana-gimnaziu";

/**
 * Capitol → anul de studiu în care apare PRIMA DATĂ în programă.
 *
 * „Prima dată" e regula aleasă deliberat: un capitol reluat în mai mulți ani
 * (geometria plană se face din clasa a VI-a până într-a VIII-a) se deblochează
 * la primul contact, nu la ultimul. Vezi nota despre limita acestei alegeri în
 * `docs` de mai jos — pe capitole cumulative, deblocarea e mai generoasă decât
 * nivelul real al unora dintre întrebări.
 */
export const CHAPTER_YEAR: Record<SubjectBand, Readonly<Record<string, number>>> = {
  "mate-gimnaziu": {
    "Numere întregi și operații": 5,
    "Fracții și numere raționale": 5,
    "Rapoarte, proporții și procente": 6,
    "Statistică, medii și probleme practice": 6,
    "Geometrie plană": 6,
    "Numere reale și radicali": 7,
    "Ecuații, inecuații și mulțimi": 7,
    "Geometrie în spațiu": 8,
  },
  "romana-gimnaziu": {
    "Fonetică și ortografie": 5,
    "Vocabular și semantică": 5,
    "Înțelegerea textului": 5,
    "Formarea cuvintelor": 6,
    "Morfologie": 6,
    "Sintaxă": 7,
  },
};

/** Anii de studiu acoperiți de fiecare bandă (pentru validarea clasei declarate). */
export const BAND_YEARS: Record<SubjectBand, readonly number[]> = {
  "mate-gimnaziu": [5, 6, 7, 8],
  "romana-gimnaziu": [5, 6, 7, 8],
};

const DOMAIN_BAND: Readonly<Record<string, SubjectBand>> = {
  "matematica-v-viii": "mate-gimnaziu",
  "romana-cl-viii": "romana-gimnaziu",
};

/**
 * Banda unui domeniu, sau null dacă domeniul nu e sub programă (aviație,
 * licență, drept etc.). Null înseamnă „fără poartă" — bazinul rămâne întreg.
 */
export function bandForDomainSlug(slug: string | null | undefined): SubjectBand | null {
  if (!slug) return null;
  return DOMAIN_BAND[slug] ?? null;
}

/** Anul în care se predă capitolul, sau null dacă nu-l cunoaștem. */
export function chapterYear(band: SubjectBand, chapter: string | null | undefined): number | null {
  if (!chapter) return null;
  return CHAPTER_YEAR[band][chapter] ?? null;
}

/** Toate capitolele benzii, ordonate an crescător apoi alfabetic — ordinea din UI. */
export function chaptersForBand(band: SubjectBand): { chapter: string; year: number }[] {
  return Object.entries(CHAPTER_YEAR[band])
    .map(([chapter, year]) => ({ chapter, year }))
    .sort((a, b) => a.year - b.year || a.chapter.localeCompare(b.chapter, "ro"));
}

/**
 * Capitolele considerate parcurse implicit pentru un elev aflat în `schoolYear`:
 * tot ce se predă în anii ANTERIORI. Capitolele anului curent rămână nebifate —
 * exact acelea sunt cele pe care elevul le parcurge acum, una câte una.
 *
 * `schoolYear` din afara benzii (null, 0, 13) → listă goală: nu ghicim.
 */
export function defaultCoveredChapters(band: SubjectBand, schoolYear: number | null | undefined): string[] {
  if (typeof schoolYear !== "number" || !Number.isFinite(schoolYear)) return [];
  return chaptersForBand(band)
    .filter((c) => c.year < schoolYear)
    .map((c) => c.chapter);
}

/**
 * Capitolele vizibile pentru un elev = cele bifate, intersectate cu capitolele
 * benzii. Intersecția contează: o bifă rămasă în baza de date pentru un capitol
 * scos din programă nu trebuie să deblocheze nimic.
 */
export function visibleChapters(band: SubjectBand, covered: readonly string[]): string[] {
  const known = new Set(Object.keys(CHAPTER_YEAR[band]));
  return [...new Set(covered)].filter((c) => known.has(c));
}
