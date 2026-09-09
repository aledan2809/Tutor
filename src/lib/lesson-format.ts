/**
 * Pregătirea textului unei lecții pentru citit.
 *
 * Problema, spusă de client după ce a văzut cursul Poștei: lecțiile sunt prea
 * lungi, au prea multe „Ipoteze de lucru", iar totul e într-o singură culoare.
 * Prima lecție are 6.362 de caractere și OPT casete de ipoteză — opt întreruperi
 * care arată exact ca restul textului, deci ochiul n-are de ce să se agațe.
 *
 * Ipotezele NU se șterg: argumentul de vânzare al produsului e tocmai că fiecare
 * presupunere e marcată vizibil. Se retrogradează la note de subsol — cititul
 * curge, iar clientul primește lista completă a ce are de confirmat, într-un
 * singur loc, ca listă de lucru.
 *
 * Se lucrează pe TEXT, nu pe conținut rescris: cele nouă lecții existente se
 * îndreaptă toate deodată, fără să atingem un cuvânt din ele.
 */

export type Ipoteza = { n: number; text: string };

export type LectiePregatita = {
  /** Conținutul, cu casetele înlocuite prin markere de notă `[N](#ip-N)`. */
  corp: string;
  ipoteze: Ipoteza[];
};

/**
 * Un bloc de ipoteză, așa cum îl scriu autorii: un citat care începe cu
 * „**Ipoteză de lucru.**". Poate ocupa mai multe rânduri, fiecare prefixat cu „>".
 */
const BLOC_IPOTEZA = /(?:^|\n)((?:>[^\n]*\n?)+)/g;
const INCEPUT_IPOTEZA = /^>\s*\*\*\s*Ipotez[ăa] de lucru\.?\s*\*\*\s*/i;

/** Scoate prefixele de citat și strânge rândurile într-o frază. */
function curataCitat(bloc: string): string {
  return bloc
    .split("\n")
    .map((l) => l.replace(/^>\s?/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/^\*\*\s*Ipotez[ăa] de lucru\.?\s*\*\*\s*/i, "")
    .trim();
}

/**
 * Scoate ipotezele din corp și le întoarce separat, numerotate în ordinea
 * apariției. Marcherul rămas în text e `[[ip:N]]`, randat ca notă de subsol.
 */
export function pregatesteLectia(continut: string): LectiePregatita {
  const ipoteze: Ipoteza[] = [];

  const corp = continut.replace(BLOC_IPOTEZA, (potrivire, bloc: string) => {
    if (!INCEPUT_IPOTEZA.test(bloc)) return potrivire; // alt citat — se lasă în pace
    const text = curataCitat(bloc);
    if (!text) return potrivire;
    ipoteze.push({ n: ipoteze.length + 1, text });
    const prefix = potrivire.startsWith("\n") ? "\n" : "";
    // Marcherul e un link de markdown obișnuit: se randează fără plugin nou, e
    // navigabil de la tastatură și duce chiar la nota lui din josul lecției.
    return `${prefix}[${ipoteze.length}](#ip-${ipoteze.length})\n`;
  });

  return { corp: corp.replace(/\n{3,}/g, "\n\n").trim(), ipoteze };
}

/**
 * Un citat e „replică de spus" dacă e scris între ghilimele românești. În lecțiile
 * de față astea sunt frazele pe care omul le ROSTEȘTE la ușă sau la telefon —
 * singurul lucru de pe pagină care nu se citește, ci se zice. Merită să arate
 * altfel decât restul.
 */
export function eReplica(text: string): boolean {
  const t = text.trim();
  return t.startsWith("„") || t.startsWith('"') || t.startsWith("“");
}

/**
 * Textul dintr-un arbore de copii React.
 *
 * `String(children)` dă „[object Object]" pentru orice altceva decât un șir —
 * iar în markdown randat, copiii unui citat sunt un `<p>`, nu text. Din cauza
 * asta replica de spus nu se recunoștea deloc (prins pe lecția reală, nu în cod).
 */
export function textDinCopii(nod: unknown): string {
  if (nod == null || typeof nod === "boolean") return "";
  if (typeof nod === "string" || typeof nod === "number") return String(nod);
  if (Array.isArray(nod)) return nod.map(textDinCopii).join("");
  if (typeof nod === "object" && "props" in (nod as Record<string, unknown>)) {
    const props = (nod as { props?: { children?: unknown } }).props;
    return textDinCopii(props?.children);
  }
  return "";
}
