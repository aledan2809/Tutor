/**
 * Două grile care întreabă același lucru, cu chei diferite.
 *
 * Ruta de completare („topUp") trimitea generatorului doar NUMĂRUL de grile
 * existente, niciodată textul lor — deci la a doua și a treia trecere modelul
 * rescria din aceeași lecție fără să știe ce scrisese deja. Măsurat pe lotul de
 * 62: două perechi de enunțuri aproape identice, AMBELE cu chei diferite. Un elev
 * care nimerește ambele grile e marcat greșit la una dintre ele pentru exact
 * același răspuns — cel mai rău lucru pe care îl poate face un test.
 *
 * Leacul principal e să-i spunem modelului ce există (vezi `avoid` în
 * `generateQuestions`); asta e plasa de dedesubt, pentru când nu ascultă.
 */

const STOP = new Set(
  "care este sunt acest aceasta pentru dintre atunci cand unde cum ce si sau din prin catre".split(/\s+/),
);

function contentTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

/** Jaccard pe cuvintele de conținut: câte cuvinte împart, din câte au împreună. */
export function stemSimilarity(a: string, b: string): number {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  const union = ta.size + tb.size - inter;
  return union ? inter / union : 0;
}

/**
 * Pragul e calibrat pe lotul real, nu ales din burtă: cele două perechi cu adevărat
 * duplicate au ieșit la 0,48 și 0,36, iar următoarea pereche nelegată era sub 0,30.
 * Din 1.891 de perechi posibile, 0,35 prinde exact pe cele două.
 */
export const NEAR_DUPLICATE_THRESHOLD = 0.35;

export function isNearDuplicate(
  stem: string,
  existing: readonly string[],
  threshold: number = NEAR_DUPLICATE_THRESHOLD,
): boolean {
  return existing.some((e) => stemSimilarity(stem, e) >= threshold);
}

/** Elimină și dublurile din interiorul lotului proaspăt, nu doar față de cele stocate. */
export function dropNearDuplicates<T extends { content: string }>(
  candidates: readonly T[],
  existing: readonly string[],
  threshold: number = NEAR_DUPLICATE_THRESHOLD,
): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  const seen = [...existing];
  for (const c of candidates) {
    if (isNearDuplicate(c.content, seen, threshold)) dropped.push(c);
    else {
      kept.push(c);
      seen.push(c.content);
    }
  }
  return { kept, dropped };
}
