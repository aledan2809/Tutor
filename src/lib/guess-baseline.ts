/**
 * Cât ia un elev care NU citește întrebarea.
 *
 * L34 a prins scurgerea prin lungimea în CARACTERE și am declarat clasa închisă.
 * Re-măsurând lotul reparat, aceeași scurgere era intactă în alte unități:
 * caractere +1% (curat), dar cuvinte +6%, propoziții +26%, virgule +47% — modelul
 * a respectat cererea „variante de lungime egală" umplând distractorii la același
 * număr de caractere, iar indiciul s-a mutat în sintaxă. Un ghicitor în cascadă
 * lua 50% din 62 (p = 0,00002), uniform pe toate cele 8 module.
 *
 * De-asta măsurăm aici FAMILIA, nu un indiciu: fiecare filtru pe o singură unitate
 * mută defectul în vecina ei. Modulul e pur (fără IO, fără model) ca să poată rula
 * pe fiecare lot generat, gratis, și să spună în clar cât valorează testul.
 */

export interface GuessItem {
  options: string[];
  correctAnswer: string;
}

export interface StrategyScore {
  /** Numele strategiei, în română, pentru raportul văzut de admin. */
  name: string;
  /** Reușite, cu credit fracționar când strategia lasă mai multe variante la egalitate. */
  hits: number;
  /** Câți itemi a reușit strategia să-i departajeze. */
  decided: number;
  rate: number;
  /** Probabilitatea ca întâmplarea singură să dea un scor cel puțin la fel de bun. */
  pValue: number;
}

export interface GuessBaseline {
  n: number;
  /** Rata așteptată dacă itemii n-ar avea niciun indiciu. */
  chance: number;
  /** Cea mai bună strategie găsită — cea care contează pentru un elev. */
  best: StrategyScore | null;
  scores: StrategyScore[];
  /** Cascada propoziții → cuvinte → caractere: ghicitorul realist, nu cel teoretic. */
  cascade: StrategyScore;
}

// Două capcane, ambele prinse de teste, ambele din prima versiune a măsurătorii:
// (1) `\b` în JavaScript e ASCII, deci `\bși\b` NU se potrivește NICIODATĂ — „ș" nu
//     e caracter de cuvânt pentru el, și tocmai „și" leagă enumerările românești.
//     De-aici lookaround pe litere Unicode.
// (2) o virgulă urmată de conjuncție („…, dacă e complet") marchează O SINGURĂ
//     graniță, nu două — altfel frazele compuse ies umflate exact acolo unde
//     măsurăm diferența.
const CONJ =
  "și|si|sau|dar|ci|iar|care|deoarece|pentru că|pentru ca|astfel|încât|incat|în timp ce|dacă|daca|atunci când|când|cand|întrucât|fiindcă|ca să";
const CLAUSE_BOUNDARY = new RegExp(
  `(?:,\\s*)?(?<![\\p{L}\\p{N}])(?:${CONJ})(?![\\p{L}\\p{N}])|,`,
  "giu",
);

const occurrences = (s: string, re: RegExp) => (s.match(re) ?? []).length;

/** O aproximare a numărului de propoziții: granițele de propoziție, plus una de bază. */
export function clauseCount(s: string): number {
  return 1 + occurrences(s, CLAUSE_BOUNDARY);
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const commaCount = (s: string) => occurrences(s, /,/g);

/** log(C(n, k)) — evită depășirea la factorial pe loturi mari. */
function logChoose(n: number, k: number): number {
  let sum = 0;
  for (let i = 1; i <= k; i++) sum += Math.log(n - k + i) - Math.log(i);
  return sum;
}

/** Probabilitatea binomială de a obține cel puțin `k` reușite din `n`, la șansa `p0`. */
export function upperTail(k: number, n: number, p0: number): number {
  if (n <= 0) return 1;
  const kk = Math.max(0, Math.min(n, Math.round(k)));
  let p = 0;
  for (let i = kk; i <= n; i++) {
    p += Math.exp(logChoose(n, i) + i * Math.log(p0) + (n - i) * Math.log(1 - p0));
  }
  return Math.min(1, p);
}

type Metric = (option: string) => number;

const METRICS: { name: string; metric: Metric; min?: boolean }[] = [
  { name: "cea mai lungă variantă (caractere)", metric: (o) => o.length },
  { name: "cea mai scurtă variantă (caractere)", metric: (o) => o.length, min: true },
  { name: "cele mai multe cuvinte", metric: wordCount },
  { name: "cele mai multe propoziții", metric: clauseCount },
  { name: "cele mai multe virgule", metric: commaCount },
];

function scoreMetric(
  items: readonly GuessItem[],
  name: string,
  metric: Metric,
  min: boolean,
  chance: number,
): StrategyScore {
  let hits = 0;
  let decided = 0;
  for (const it of items) {
    const correct = it.options.indexOf(it.correctAnswer);
    if (correct < 0) continue;
    const values = it.options.map(metric);
    const target = min ? Math.min(...values) : Math.max(...values);
    const winners = values.reduce<number[]>((acc, v, i) => (v === target ? [...acc, i] : acc), []);
    // O strategie care lasă toate variantele la egalitate nu a ales nimic.
    if (winners.length === it.options.length) continue;
    decided++;
    if (winners.includes(correct)) hits += 1 / winners.length;
  }
  return { name, hits, decided, rate: decided ? hits / decided : 0, pValue: upperTail(hits, decided, chance) };
}

/** Cascada: departajează pe propoziții, apoi cuvinte, apoi caractere. */
function scoreCascade(items: readonly GuessItem[], chance: number): StrategyScore {
  const ladder: Metric[] = [clauseCount, wordCount, (o) => o.length];
  let hits = 0;
  let decided = 0;
  for (const it of items) {
    const correct = it.options.indexOf(it.correctAnswer);
    if (correct < 0) continue;
    decided++;
    let live = it.options.map((_, i) => i);
    for (const metric of ladder) {
      const values = live.map((i) => metric(it.options[i]));
      const best = Math.max(...values);
      live = live.filter((_, k) => values[k] === best);
      if (live.length === 1) break;
    }
    if (live.includes(correct)) hits += 1 / live.length;
  }
  return {
    name: "cascadă: propoziții → cuvinte → caractere",
    hits,
    decided,
    rate: decided ? hits / decided : 0,
    pValue: upperTail(hits, decided, chance),
  };
}

export function measureGuessBaseline(items: readonly GuessItem[]): GuessBaseline {
  const usable = items.filter((i) => i.options.length >= 3 && i.options.includes(i.correctAnswer));
  const optionCount = usable.length ? usable[0].options.length : 4;
  const chance = 1 / optionCount;

  const scores = METRICS.map((m) => scoreMetric(usable, m.name, m.metric, m.min ?? false, chance));

  // Poziția e uniformă prin construcție (vezi shuffle-options), dar o măsurăm ca
  // gardă de regresie: dacă amestecarea se strică vreodată, apare aici.
  for (let p = 0; p < optionCount; p++) {
    const hits = usable.filter((i) => i.options.indexOf(i.correctAnswer) === p).length;
    scores.push({
      name: `mereu poziția ${p + 1}`,
      hits,
      decided: usable.length,
      rate: usable.length ? hits / usable.length : 0,
      pValue: upperTail(hits, usable.length, chance),
    });
  }

  const cascade = scoreCascade(usable, chance);
  const all = [...scores, cascade].filter((s) => s.decided > 0);
  const best = all.length ? all.reduce((a, b) => (b.rate > a.rate ? b : a)) : null;

  return { n: usable.length, chance, best, scores, cascade };
}

/** Pragul de la care raportăm lotul ca defect: sub 1% șansă să fie întâmplare. */
export const GUESS_ALARM_P = 0.01;

/**
 * O propoziție pe care un admin o poate citi fără să știe statistică. Spune ce ia
 * un elev care nu citește, nu „p = 0,00002".
 */
export function describeGuessBaseline(b: GuessBaseline): string {
  if (!b.n) return "Prea puține grile pentru a măsura ghicitul.";
  const pct = (x: number) => Math.round(x * 100) + "%";
  const chance = pct(b.chance);
  const worst = b.best && b.best.pValue < GUESS_ALARM_P ? b.best : null;
  if (!worst) {
    return `Ghicitul fără citire rămâne la nivelul întâmplării (${chance}). Cea mai bună strategie oarbă: ${pct(b.cascade.rate)}.`;
  }
  return `⚠️ Un elev care nu citește întrebarea ia ${pct(worst.rate)} în loc de ${chance}, alegând „${worst.name}". Lotul are un indiciu care se poate exploata.`;
}
