/**
 * macro-topic.mjs — deterministic micro-topic → macro "capitol/competență" mapper.
 *
 * WHY: official exam-bank items carry a fine-grained `topic` (Matematică: ~290 distinct
 * micro-topics like "Cub. Volum", "Segmente. Mijloc"; Limba română: "Diftong", "Omonime").
 * When copied into the Grile bank as `Question.topic` they are either too sparse to give a
 * meaningful Weak-Areas signal (n=1..2 per micro-topic) or, worse, the section label
 * ("Subiectul I", "I.B") — which tells a student nothing about WHICH skill is weak.
 *
 * This maps each item to a chapter-level capitol so progress + weak areas + repair-session
 * targeting group on a real competence. It is PURELY deterministic keyword mapping of the
 * OFFICIAL micro-topic (no AI) — consistent with L07a (official ground-truth over generation).
 *
 * Diacritics: Romanian text in the DB uses comma-below ț/ș (U+021B/U+0219) but some sources
 * use cedilla ţ/ş (U+0163/U+015F). Every rule matches BOTH forms via [țţ] / [șş] classes.
 */

// ─── Macro capitole (RO content strings — same language as the questions) ───
export const MATE_CAPITOLE = {
  NUMERE: "Numere întregi și operații",
  FRACTII: "Fracții și numere raționale",
  REALE: "Numere reale și radicali",
  PROPORTII: "Rapoarte, proporții și procente",
  ECUATII: "Ecuații, inecuații și mulțimi",
  STATISTICA: "Statistică, medii și probleme practice",
  GEO_PLANA: "Geometrie plană",
  GEO_SPATIU: "Geometrie în spațiu",
};

export const RO_CAPITOLE = {
  FONETICA: "Fonetică și ortografie",
  VOCABULAR: "Vocabular și semantică",
  FORMARE: "Formarea cuvintelor",
  MORFOLOGIE: "Morfologie",
  SINTAXA: "Sintaxă",
  TEXT: "Înțelegerea textului",
};

// Ordered rules — FIRST match wins. Order encodes priority: most-specific capitole first
// (3D solids before plane geometry; data/practical before proporții; etc.).
const MATE_RULES = [
  // Algebra terms that collide with geometry keywords ("diferența de pătrate" ⊃ "pătrate",
  // "puteri") — must be resolved BEFORE plane geometry.
  [/diferen[țţt]a de p[aă]trate|formule de calcul|\bputeri|conjuga[țţt]/i, MATE_CAPITOLE.REALE],
  // Means / kinematics word-problems that collide with geometry ("media geometrică" ⊃ "geometr",
  // "viteză, distanță, timp" ⊃ "distanță") — resolved BEFORE geometry.
  [/\bmedia\b|media (aritmetic|ponderat|geometric)|vitez[aă]|debit|mi[șş]care|\bv[aâ]rste\b|sume de bani/i, MATE_CAPITOLE.STATISTICA],
  // Geometrie în spațiu — 3D solids (distinct keywords, must precede plane geometry)
  [/\bcub\b|cubule|paralelipiped|prism[aă]|piramid|\bcon\b|con circular|sfer[aă]|tetraedru|generatoare|corp geometric/i, MATE_CAPITOLE.GEO_SPATIU],
  // Geometrie plană
  [/cerc|segment|unghi|triunghi|p[aă]trat|dreptunghi|romb|paralelogram|trapez|geometr|\barii\b|\barie\b|bisectoare|median|mediatoare|linie mijlocie|linii mijlocii|simetri|distan[țţt]|poligon|pitagora|trigonometr|apotem|perimetru|coliniar|perpendicular|diagonal|coard[aă]|tangent|drepte|secant|interiorul unui unghi|centru de greutate|varignon|cevian|proiec[țţt]ii/i, MATE_CAPITOLE.GEO_PLANA],
  // Statistică, medii și probleme practice — data interpretation, word problems, units
  [/diagram|tabel|interpretarea datelor|interpretarea unei diagram|citirea|probabilit|probleme practice|unit[aă][țţt]i de (timp|m[aă]sur[aă])/i, MATE_CAPITOLE.STATISTICA],
  // Rapoarte, proporții și procente
  [/rapoart|raport|propor[țţt]i|procent|reduceri/i, MATE_CAPITOLE.PROPORTII],
  // Ecuații, inecuații și mulțimi (intervals belong here)
  [/ecua[țţt]i|inecua[țţt]i|mul[țţt]im|interval|sistem/i, MATE_CAPITOLE.ECUATII],
  // Numere reale și radicali
  [/radical|numerelor? reale|\breale\b|\bmodul|module|estimarea radical/i, MATE_CAPITOLE.REALE],
  // Fracții și numere raționale
  [/frac[țţt]i|ra[țţt]ional|zecimal|aproxim[aă]ri zecimale/i, MATE_CAPITOLE.FRACTII],
  // (fallback below → Numere întregi și operații)
];

const RO_RULES = [
  [/diftong|triftong|hiat|vocal|consoan|silab|desp[aă]r[țţt]ire|accent|ortograf/i, RO_CAPITOLE.FONETICA],
  [/deriv|sufix|prefix|compun|familia lexical|[iî]mbog[aă][țţt]ire|cuvinte derivate/i, RO_CAPITOLE.FORMARE],
  [/sinonim|antonim|omonim|paronim|sensul cuvintelor|sens(ul)? (în |in )?context|polisem|c[aâ]mp lexical|sens propriu|sens figurat/i, RO_CAPITOLE.VOCABULAR],
  [/substantiv|articol|adjectiv|pronume|numeral|verb|moduri|timpuri|adverb|prepozi[țţt]i|conjunc[țţt]i|interjec[țţt]i|\bcaz(uri)?\b|plural|p[aă]r[țţt]i de vorbire/i, RO_CAPITOLE.MORFOLOGIE],
  [/propozi[țţt]i|fraz[aă]|subordonat|subiect|predicat|atribut|complement|p[aă]r[țţt]i de propozi[țţt]ie|sintax/i, RO_CAPITOLE.SINTAXA],
];

function matchRules(text, rules) {
  const t = String(text || "");
  for (const [re, capitol] of rules) {
    if (re.test(t)) return capitol;
  }
  return null;
}

/** Matematică: map micro-topic (fallback: content) → macro capitol. */
export function macroTopicMate(microTopic, content) {
  return (
    matchRules(microTopic, MATE_RULES) ||
    matchRules(content, MATE_RULES) ||
    MATE_CAPITOLE.NUMERE // fallback: base arithmetic / number theory
  );
}

/** Limba română: passage-dependent → comprehension; else micro-topic (fallback: content). */
export function macroTopicRo(microTopic, passageRef, content) {
  if (passageRef) return RO_CAPITOLE.TEXT; // I.A reading items have no language micro-topic
  return (
    matchRules(microTopic, RO_RULES) ||
    matchRules(content, RO_RULES) ||
    RO_CAPITOLE.VOCABULAR // fallback (rare): generic language skill
  );
}

/**
 * Dispatcher for an ExamItem-shaped object.
 * @param {{subjectKey?:string, subject?:string, topic?:string|null, passageRef?:string|null, content?:string}} item
 * @returns {string} macro capitol
 */
export function macroTopic(item) {
  const subj = String(item.subjectKey || item.subject || "").toLowerCase();
  const isRo = /limba_romana|român|romana/.test(subj);
  return isRo
    ? macroTopicRo(item.topic, item.passageRef, item.content)
    : macroTopicMate(item.topic, item.content);
}
