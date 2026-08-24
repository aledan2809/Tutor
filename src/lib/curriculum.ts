// Programa parcursă — ce materie a apucat elevul să facă la școală.
//
// Problema: grilele oficiale de examen (EN VIII, BAC Subiectul I) testează toată
// materia acumulată, deci un elev aflat la ÎNCEPUTUL anului terminal primește
// întrebări din lecții nepredate încă. Soluția are două rânduri care merg în
// paralel, la cererea explicită a userului (2026-08-24):
//
//   rândul 1 — programa cu calendar: ce AR FI TREBUIT predat până în săptămâna
//              curentă, calculat din planificarea calendaristică oficială;
//              informativ, se mișcă singur săptămână de săptămână;
//   rândul 2 — bifele elevului: ce S-A predat efectiv la clasa lui; pre-completat
//              din rândul 1 la inițiere, apoi corectat de elev; ACESTA comandă
//              bazinul de grile.
//
// Sursele (salvate în ~/Downloads/temp/tutor eval nat/programa-calendar/):
//   - Programa școlară OMEN 3393/2017 (matematică V-VIII)
//   - Planificări calendaristice Sigma 2025-2026: cl. a VII-a (36 săpt.,
//     OM 3463/04.03.2025) și cl. a VIII-a (35 săpt. — anul terminal se termină
//     mai devreme)
//
// Maparea e scrisă de mână din aceste documente, deterministă și verificabilă —
// deliberat NU dedusă de un model. Săptămânile sunt ale anului 2025-2026;
// structura anului se schimbă prin ordin de ministru în fiecare an, de aceea
// există verificarea automată săptămânală sept-mai (scripts/curriculum-watch.mjs).

export type SubjectBand =
  | "mate-gimnaziu"
  | "romana-gimnaziu"
  | "bac-mate"
  | "bac-romana";

export type CurriculumUnit = {
  /** Cheie stabilă, stocată în DB — nu se redenumește fără migrare. */
  key: string;
  /** Numele văzut de elev — limbajul planificării, nu al aplicației. */
  label: string;
  /** Anul de studiu în care se predă unitatea (5-12). */
  year: number;
  /**
   * Intervalul de săptămâni din planificarea calendaristică a anului respectiv,
   * sau null unde nu avem încă planificare săptămânală (V, VI, română, liceu).
   * Fără săptămâni, unitatea nu poate fi pre-bifată în anul ei curent — doar
   * prin regula anilor anteriori. Fail-closed, nu ghicim.
   */
  weeks: readonly [number, number] | null;
  /** Capitolele (Question.topic) pe care le atinge unitatea. */
  chapters: readonly string[];
};

// ── Unitățile pe bandă ──────────────────────────────────────────────────────
//
// Gimnaziu matematică: V+VI din programa OMEN (conținuturi pe clasă, fără
// săptămâni); VII+VIII din planificările Sigma (cu săptămâni).

const MATE_GIMNAZIU: readonly CurriculumUnit[] = [
  // clasa a V-a — programa OMEN 3393/2017 (fără planificare săptămânală încă)
  { key: "v-naturale", label: "Numere naturale. Operații, puteri, divizibilitate", year: 5, weeks: null, chapters: ["Numere întregi și operații"] },
  { key: "v-fractii", label: "Fracții ordinare și zecimale", year: 5, weeks: null, chapters: ["Fracții și numere raționale"] },
  { key: "v-geometrie", label: "Elemente de geometrie: punct, dreaptă, unghi, figuri", year: 5, weeks: null, chapters: ["Geometrie plană"] },
  // clasa a VI-a — programa OMEN
  { key: "vi-rapoarte", label: "Rapoarte și proporții. Procente", year: 6, weeks: null, chapters: ["Rapoarte, proporții și procente"] },
  { key: "vi-intregi", label: "Numere întregi. Operații", year: 6, weeks: null, chapters: ["Numere întregi și operații"] },
  { key: "vi-rationale", label: "Numere raționale. Operații", year: 6, weeks: null, chapters: ["Fracții și numere raționale"] },
  { key: "vi-statistica", label: "Organizarea datelor. Medii", year: 6, weeks: null, chapters: ["Statistică, medii și probleme practice"] },
  { key: "vi-geometrie", label: "Drepte, unghiuri, congruență. Triunghiul", year: 6, weeks: null, chapters: ["Geometrie plană"] },
  // clasa a VII-a — planificarea Sigma 2025-2026 (36 săptămâni)
  { key: "vii-recap-numere", label: "Numere și operații aritmetice. Rădăcina pătrată", year: 7, weeks: [1, 3], chapters: ["Numere întregi și operații", "Numere reale și radicali"] },
  { key: "vii-patrulatere", label: "Patrulatere: paralelogram, dreptunghi, romb, pătrat, trapez", year: 7, weeks: [4, 7], chapters: ["Geometrie plană"] },
  { key: "vii-numere-reale", label: "Mulțimea numerelor reale. Radicali. Operații", year: 7, weeks: [8, 12], chapters: ["Numere reale și radicali"] },
  { key: "vii-arii", label: "Lungimi, perimetre, arii (paralelogram, triunghi, trapez)", year: 7, weeks: [12, 14], chapters: ["Geometrie plană"] },
  { key: "vii-cercul", label: "Cercul. Unghiuri, coarde, tangente, poligoane înscrise", year: 7, weeks: [15, 19], chapters: ["Geometrie plană"] },
  { key: "vii-asemanare", label: "Asemănarea triunghiurilor. Teorema lui Thales", year: 7, weeks: [21, 25], chapters: ["Geometrie plană"] },
  { key: "vii-ecuatii", label: "Ecuații și sisteme de ecuații liniare", year: 7, weeks: [27, 29], chapters: ["Ecuații, inecuații și mulțimi"] },
  { key: "vii-metrice", label: "Relații metrice în triunghiul dreptunghic. Teorema lui Pitagora", year: 7, weeks: [30, 33], chapters: ["Geometrie plană"] },
  { key: "vii-date", label: "Organizarea datelor. Sisteme de axe, grafice", year: 7, weeks: [34, 35], chapters: ["Statistică, medii și probleme practice"] },
  // clasa a VIII-a — planificarea Sigma 2025-2026 (35 săptămâni)
  { key: "viii-multimi", label: "Mulțimi de numere reale. Intervale. Inecuații", year: 8, weeks: [2, 7], chapters: ["Numere reale și radicali", "Ecuații, inecuații și mulțimi"] },
  // Deliberat FĂRĂ capitol: unitatea predă doar reprezentarea corpurilor, iar
  // grilele din banca "Geometrie în spațiu" sunt calcul de arii/volume/unghiuri
  // (S8+). A o lăsa să poarte capitolul ar deschide în S2 întrebări din mai
  // — exact problema pe care poarta o rezolvă (finding review 2026-08-24).
  { key: "viii-corpuri-intro", label: "Puncte, drepte, plane. Piramida, prisma: reprezentare", year: 8, weeks: [2, 7], chapters: [] },
  { key: "viii-calcul-algebric", label: "Calcul algebric în ℝ: operații, formule de calcul prescurtat", year: 8, weeks: [8, 13], chapters: ["Numere reale și radicali"] },
  { key: "viii-perpendicularitate", label: "Perpendicularitate în spațiu", year: 8, weeks: [8, 13], chapters: ["Geometrie în spațiu"] },
  { key: "viii-ecuatii-gr2", label: "Ecuații de forma ax² + bx + c = 0", year: 8, weeks: [15, 20], chapters: ["Ecuații, inecuații și mulțimi"] },
  { key: "viii-unghiuri-spatiu", label: "Unghiul dintre o dreaptă și un plan. Unghiul a două plane", year: 8, weeks: [15, 20], chapters: ["Geometrie în spațiu"] },
  { key: "viii-fractii-algebrice", label: "Fracții algebrice. Ecuații reductibile la gradul II", year: 8, weeks: [21, 25], chapters: ["Ecuații, inecuații și mulțimi"] },
  { key: "viii-distante-arii", label: "Distanțe pe fețe. Arie și volum: cub, paralelipiped", year: 8, weeks: [21, 25], chapters: ["Geometrie în spațiu"] },
  { key: "viii-functii", label: "Funcții definite pe mulțimi finite / pe ℝ. Grafic", year: 8, weeks: [27, 32], chapters: ["Ecuații, inecuații și mulțimi"] },
  { key: "viii-poliedre", label: "Arii și volume ale poliedrelor (piramida, prisma)", year: 8, weeks: [27, 28], chapters: ["Geometrie în spațiu"] },
  { key: "viii-rotunde", label: "Corpuri rotunde: cilindru, con, sferă — arii și volume", year: 8, weeks: [29, 32], chapters: ["Geometrie în spațiu"] },
];

// Gimnaziu română — capitolele sunt cumulative (se reiau și se adâncesc anual);
// anul = prima predare, per programa de gimnaziu. Fără planificare săptămânală
// încă (de cules — vezi TODO). Poarta abia mușcă aici (89-100% deschis, măsurat),
// dar checklistul tot există pentru consistența experienței.
const ROMANA_GIMNAZIU: readonly CurriculumUnit[] = [
  { key: "ro-v-fonetica", label: "Fonetică și ortografie: sunete, silabe, diftong, triftong, hiat", year: 5, weeks: null, chapters: ["Fonetică și ortografie"] },
  { key: "ro-v-vocabular", label: "Vocabular: sinonime, antonime, sensuri, câmp lexical", year: 5, weeks: null, chapters: ["Vocabular și semantică"] },
  { key: "ro-v-text", label: "Înțelegerea textului literar și nonliterar", year: 5, weeks: null, chapters: ["Înțelegerea textului"] },
  { key: "ro-vi-formare", label: "Formarea cuvintelor: derivare, compunere, conversiune", year: 6, weeks: null, chapters: ["Formarea cuvintelor"] },
  { key: "ro-vi-morfologie", label: "Morfologie: părțile de vorbire", year: 6, weeks: null, chapters: ["Morfologie"] },
  { key: "ro-vii-sintaxa", label: "Sintaxă: propoziția, fraza, subordonatele", year: 7, weeks: null, chapters: ["Sintaxă"] },
];

// BAC — grilele existente (Subiectul I) sunt integral materie de clasele IX-X
// (măsurat 2026-08-24 pe toate capitolele; XI-XII trăiesc în Subiectele II-III,
// care nu sunt grile). Lista de mai jos e EXTRASĂ din scripturile de import
// (`scripts/import-grile-bac-*.mjs`) — sursa care scrie Question.topic — nu
// transcrisă de mână; testul "capitolele BAC acoperă exact importerele" o ține
// sincronă. Un topic absent de aici ar fi INVIZIBIL pentru orice elev, oricâte
// bife ar avea (prima versiune, transcrisă din agregare trunchiată, pierdea
// 25 din 46 — prins de review, 2026-08-24).
//
// year=10 = "predat cel târziu până la finalul clasei a X-a". Pentru a XI-a /
// a XII-a totul devine an anterior (pre-bifat, se poate debifa); pentru a IX-a
// / a X-a nimic nu se pre-bifează — elevul bifează manual ce a parcurs.
const BAC_CHAPTER_UNITS = (chapters: readonly string[]): CurriculumUnit[] =>
  chapters.map((c) => ({
    key: "bac-" + c.toLowerCase().replace(/[^a-z0-9ăâîșț]+/gi, "-").replace(/^-|-$/g, ""),
    label: c,
    year: 10,
    weeks: null,
    chapters: [c],
  }));

export const BAC_MATE_CHAPTERS: readonly string[] = [
  "Combinatorică",
  "Ecuații cu radicali",
  "Ecuații exponențiale",
  "Ecuații logaritmice",
  "Elemente de combinatorică",
  "Funcția de gradul II",
  "Funcția de gradul II. Semnul",
  "Funcția de gradul II. Simetrie",
  "Funcția de gradul II. Tangentă",
  "Funcții",
  "Funcții. Compunere",
  "Funcții. Grafic",
  "Funcții. Punct comun",
  "Geometrie analitică",
  "Geometrie analitică. Dreapta",
  "Geometrie analitică. Paralelism",
  "Geometrie analitică. Paralelogram",
  "Geometrie analitică. Perpendicularitate",
  "Geometrie analitică. Triunghi isoscel",
  "Geometrie analitică. Vectori",
  "Geometrie. Aria triunghiului",
  "Geometrie. Triunghi dreptunghic",
  "Geometrie. Triunghi isoscel",
  "Logaritmi",
  "Numere complexe",
  "Numere reale",
  "Numere reale. Medii",
  "Numere reale. Radicali",
  "Probabilități",
  "Probabilități. Funcții",
  "Procente",
  "Progresii aritmetice",
  "Progresii geometrice",
  "Progresii geometrice. Radicali",
  "Radicali",
  "Trigonometrie",
  "Trigonometrie. Cercul circumscris",
  "Trigonometrie. Ecuații",
  "Trigonometrie. Expresii",
  "Trigonometrie. Teorema sinusurilor",
  "Trigonometrie. Triunghi dreptunghic",
  "Trigonometrie. Triunghiul",
  "Trigonometrie. Triunghiul dreptunghic",
  "Vectori",
  "Vectori. Coliniaritate",
  "Vectori. Geometrie analitică",
];

const BAC_MATE: readonly CurriculumUnit[] = BAC_CHAPTER_UNITS(BAC_MATE_CHAPTERS);

const BAC_ROMANA: readonly CurriculumUnit[] = BAC_CHAPTER_UNITS([
  "Înțelegerea textului", "Vocabular și semantică",
]);

export const CURRICULUM: Record<SubjectBand, readonly CurriculumUnit[]> = {
  "mate-gimnaziu": MATE_GIMNAZIU,
  "romana-gimnaziu": ROMANA_GIMNAZIU,
  "bac-mate": BAC_MATE,
  "bac-romana": BAC_ROMANA,
};

/** Anii de studiu acoperiți de bandă — validarea clasei declarate de elev. */
export const BAND_YEARS: Record<SubjectBand, readonly number[]> = {
  "mate-gimnaziu": [5, 6, 7, 8],
  "romana-gimnaziu": [5, 6, 7, 8],
  "bac-mate": [9, 10, 11, 12],
  "bac-romana": [9, 10, 11, 12],
};

const DOMAIN_BAND: Readonly<Record<string, SubjectBand>> = {
  "matematica-v-viii": "mate-gimnaziu",
  "romana-cl-viii": "romana-gimnaziu",
  "matematica-m1-ix-xii": "bac-mate",
  "matematica-m2-ix-xii": "bac-mate",
  "matematica-m3-ix-xii": "bac-mate",
  "romana-ix-xii": "bac-romana",
};

/** Banda unui domeniu, sau null = domeniu fără programă (aviație etc.) → fără poartă. */
export function bandForDomainSlug(slug: string | null | undefined): SubjectBand | null {
  if (!slug) return null;
  return DOMAIN_BAND[slug] ?? null;
}

/**
 * Slug-urile domeniilor unei benzi — DERIVATE din aceeași hartă pe care o
 * folosește bandForDomainSlug, ca un domeniu adăugat acolo să intre automat și
 * aici. Prima versiune ținea inversul scris de mână în curriculum-lag și un
 * domeniu nou ar fi primit poartă dar nu și atenționări (finding review).
 */
export function domainSlugsForBand(band: SubjectBand): string[] {
  return Object.entries(DOMAIN_BAND)
    .filter(([, b]) => b === band)
    .map(([slug]) => slug);
}

// ── Structura anului școlar (module datate → săptămâna curentă) ─────────────
//
// Din planificările Sigma 2025-2026 (OM 3463/04.03.2025). Se actualizează la
// fiecare ordin nou — curriculum-watch semnalează schimbarea; NU o aplică singur.

export type SchoolYearStructure = {
  /** Eticheta anului școlar, ex. "2026-2027". */
  label: string;
  /** Module de cursuri: [dată start ISO, dată sfârșit ISO, prima săptămână]. */
  modules: readonly { start: string; end: string; firstWeek: number }[];
};

// Structurile cunoscute, în ordine cronologică. Fiecare vine dintr-un ordin de
// ministru; una nouă se ADAUGĂ (nu se înlocuiește) când apare ordinul — datele
// vechi rămân pentru reproducibilitate. curriculum-watch alertează când anul
// curent nu mai e acoperit de nicio structură.
export const SCHOOL_YEARS: readonly SchoolYearStructure[] = [
  {
    // OM 3463/04.03.2025 (via planificările Sigma 2025-2026).
    label: "2025-2026",
    modules: [
      { start: "2025-09-08", end: "2025-10-24", firstWeek: 1 },
      { start: "2025-11-03", end: "2025-12-19", firstWeek: 8 },
      { start: "2026-01-08", end: "2026-02-13", firstWeek: 15 },
      { start: "2026-02-23", end: "2026-04-03", firstWeek: 21 },
      { start: "2026-04-15", end: "2026-06-19", firstWeek: 27 },
    ],
  },
  {
    // OM 3.194/2026 (MO nr. 126/16.02.2026) — 36 săptămâni, cursuri din 7 sept.
    // Modulele 3-4 au margini LA DECIZIA inspectoratelor (12/19/26 feb, resp.
    // 22 feb/1 mar/8 mar); folosim prima variantă, ca planificările editurilor.
    // Încă un motiv pentru care rândul elevului comandă, nu calendarul.
    // PDF-ul ordinului: ~/Downloads/temp/tutor eval nat/programa-calendar/.
    label: "2026-2027",
    // firstWeek per modul e DERIVABIL din date (ancorare la luni) și trebuie
    // să se lege în lanț: prima versiune avea 15/20/29 la modulele 3-5 (sumă
    // 35, nu 36 ca ordinul) — modulul 2 ține S8-S15 (22 dec e marți), deci
    // ianuarie începe la S16. Cu slip-ul, patru luni consecutive produceau
    // aceeași săptămână "15" și dedup-ul atenționărilor tăcea exact în prima
    // săptămână de predare din ianuarie (finding review 2026-08-25). Testul
    // "modulele se leagă în lanț" ține acum invarianta pe TOATE structurile.
    modules: [
      { start: "2026-09-07", end: "2026-10-23", firstWeek: 1 },
      { start: "2026-11-02", end: "2026-12-22", firstWeek: 8 },
      { start: "2027-01-11", end: "2027-02-12", firstWeek: 16 },
      { start: "2027-02-22", end: "2027-04-23", firstWeek: 21 },
      { start: "2027-05-05", end: "2027-06-18", firstWeek: 30 },
    ],
  },
];

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;

// Toată aritmetica se face pe "zile calendaristice românești" reprezentate ca
// miezul nopții UTC al acelei zile. Datele ordinelor sunt deja zile românești;
// data curentă (ceas de server, posibil UTC) se convertește întâi la ziua ei
// din Europe/Bucharest prin Intl — corect inclusiv peste schimbarea de oră.
// Prima versiune amesteca offseturi fixe cu getUTCDay și decala modulele care
// încep joi cu o săptămână întreagă (prins de testul de ancorare).
const dayUTC = (iso: string) => new Date(iso + "T00:00:00Z");

const RO_DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Bucharest",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Ziua românească în care cade momentul `d`, ca miezul nopții UTC. */
const roDayOf = (d: Date): Date => dayUTC(RO_DAY_FMT.format(d)); // en-CA → YYYY-MM-DD

/** Lunea săptămânii în care cade ziua (săptămânile școlare sunt Lu-Vi). */
const mondayOf = (day: Date): Date => {
  const dow = (day.getUTCDay() + 6) % 7; // Lu=0 … Du=6
  return new Date(day.getTime() - dow * MS_DAY);
};

/**
 * Structura anului școlar în care cade data: cea al cărei interval de cursuri
 * [startul primului modul, finalul ultimului modul] conține ziua. Vacanțele
 * dintre module cad în interval; vara dintre doi ani NU — vara dinaintea unui
 * an nou întoarce null → săptămâna 0 → nimic pre-completat (fail-closed).
 * Primul draft ținea anul vechi "viu" până la 31 august, deci pe 24 aug 2026
 * un elev nou primea săptămâna 36 a anului DEJA ÎNCHEIAT și tot checklistul
 * pre-bifat (finding review 2026-08-24).
 */
export function schoolYearStructureAt(
  date: Date,
  structures: readonly SchoolYearStructure[] = SCHOOL_YEARS
): SchoolYearStructure | null {
  const day = roDayOf(date);
  for (const st of structures) {
    const first = dayUTC(st.modules[0].start);
    const last = dayUTC(st.modules[st.modules.length - 1].end);
    if (day >= first && day <= last) return st;
  }
  return null;
}

/**
 * Săptămâna de școală în care cade `date`:
 *  - în timpul unui modul → numărul săptămânii (ancorat la LUNEA săptămânii de
 *    start a modulului — modulele care încep joi/miercuri nu desincronizează
 *    numerotarea de săptămânile reale Lu-Vi);
 *  - în vacanțe / după finalul anului → ultima săptămână încheiată;
 *  - în afara oricărui an configurat (ex. vara dinaintea unui an fără ordin
 *    introdus încă) → 0: FAIL-CLOSED, nimic nu apare ca predat. Înainte de
 *    acest fail-closed, un an expirat raporta săptămâna 36 pentru totdeauna și
 *    pre-completa integral checklistul noului elev (finding review 2026-08-24).
 */
export function schoolWeekAt(
  date: Date,
  structures: readonly SchoolYearStructure[] = SCHOOL_YEARS
): number {
  const structure = schoolYearStructureAt(date, structures);
  if (!structure) return 0;
  const day = roDayOf(date);
  let lastCompleted = 0;
  for (const m of structure.modules) {
    const start = dayUTC(m.start);
    const end = dayUTC(m.end);
    if (day < start) return lastCompleted;
    const anchor = mondayOf(start);
    const weeksInModule = Math.floor((mondayOf(end).getTime() - anchor.getTime()) / MS_WEEK) + 1;
    if (day <= end) {
      const into = Math.floor((mondayOf(day).getTime() - anchor.getTime()) / MS_WEEK);
      return m.firstWeek + Math.min(into, weeksInModule - 1);
    }
    lastCompleted = m.firstWeek + weeksInModule - 1;
  }
  return lastCompleted;
}

// ── Checklist ───────────────────────────────────────────────────────────────

export type ChecklistRow = {
  unit: CurriculumUnit;
  /** Rândul 1 — programa: ar fi trebuit predată până în săptămâna curentă? */
  expectedByNow: boolean;
  /** Rândul 2 — bifa elevului (la inițiere = pre-completată din rândul 1). */
  taught: boolean;
};

/**
 * Unitățile benzii pentru clasa declarată: anii anteriori + anul curent.
 * Dacă filtrarea pe an lasă lista GOALĂ pentru un an valid al benzii (cazul
 * real: elev de a IX-a pe BAC, unde toate unitățile au year=10), se întorc
 * TOATE unitățile benzii — altfel inițierea ar scrie zero rânduri și elevul
 * ar rămâne blocat pe 409 pentru totdeauna (finding review 2026-08-24).
 */
export function unitsForStudent(band: SubjectBand, schoolYear: number): CurriculumUnit[] {
  const filtered = CURRICULUM[band].filter((u) => u.year <= schoolYear);
  return filtered.length > 0 ? filtered : [...CURRICULUM[band]];
}

/**
 * Rândul 1 al checklistului: o unitate "ar fi trebuit predată" dacă e dintr-un
 * an anterior, sau dacă e din anul curent și intervalul ei de săptămâni a
 * ÎNCEPUT (prima lecție a fost atinsă — deblocare la primul contact, regula
 * stabilită cu userul). Unitățile anului curent fără săptămâni cunoscute NU se
 * marchează — nu ghicim.
 */
export function expectedByWeek(unit: CurriculumUnit, schoolYear: number, week: number): boolean {
  if (unit.year < schoolYear) return true;
  if (unit.year > schoolYear) return false;
  if (!unit.weeks) return false;
  return week >= unit.weeks[0];
}

/**
 * Checklistul complet pentru un elev: fiecare unitate cu ambele rânduri.
 * `taughtOverrides` = bifele salvate ale elevului (unitKey → taught); unde nu
 * există override, rândul 2 = rândul 1 (pre-completare din calendar).
 */
export function buildChecklist(
  band: SubjectBand,
  schoolYear: number,
  week: number,
  taughtOverrides: ReadonlyMap<string, boolean> = new Map()
): ChecklistRow[] {
  return unitsForStudent(band, schoolYear).map((unit) => {
    const expectedByNow = expectedByWeek(unit, schoolYear, week);
    return {
      unit,
      expectedByNow,
      taught: taughtOverrides.get(unit.key) ?? expectedByNow,
    };
  });
}

/**
 * Decalajul dintre programă și bifele elevului: unitățile pe care calendarul
 * le arată predate (rândul 1) dar elevul NU le-a bifat (rândul 2) — scenariul
 * "elevul a uitat să bifeze" (cerință user 2026-08-24). Peste prag, elevul,
 * părinții și meditatorii primesc o atenționare.
 */
export function curriculumLag(rows: readonly ChecklistRow[]): {
  lag: number;
  missing: CurriculumUnit[];
} {
  const missing = rows.filter((r) => r.expectedByNow && !r.taught).map((r) => r.unit);
  return { lag: missing.length, missing };
}

/** Pragul: notificăm doar la MAI MULT de atâtea bife lipsă (decizie user). */
export const CURRICULUM_LAG_THRESHOLD = 2;

/**
 * Capitolele vizibile în bazinul de grile = capitolele atinse de cel puțin o
 * unitate BIFATĂ de elev (rândul 2 comandă — decizia userului). Fără nicio
 * bifă → nimic vizibil; poarta e închisă implicit.
 */
export function visibleChaptersFromChecklist(rows: readonly ChecklistRow[]): string[] {
  const out = new Set<string>();
  for (const r of rows) {
    if (!r.taught) continue;
    for (const c of r.unit.chapters) out.add(c);
  }
  return [...out];
}
