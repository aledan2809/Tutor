/**
 * „Pe ce modul se greșește cel mai mult" — pe toată grupa, nu pe om.
 *
 * Stă separat de pagină ca să poată fi PROBAT. Calculul locuia inline în
 * `admin/cursanti/page.tsx`, iar pagina cere autentificare, deci singura cale de a
 * verifica dacă numerele ies corect ar fi fost să mă uit la ecran cu ochii — ceea ce
 * nu prinde un raport inversat sau o împărțire la zero pe un modul fără răspunsuri.
 *
 * Pagina de prezentare promite clientului exact asta: „se vede ce n-a fost înțeles
 * ÎN GENERAL, nu doar cine n-a citit". Până acum promisiunea n-avea acoperire —
 * tabloul arăta scorul fiecărui om pe fiecare modul, iar un manager cu mii de oameni
 * n-are cum să citească informația aia dintr-o listă.
 */

export type IncercareRoster = {
  userId: string;
  isCorrect: boolean;
  topic: string | null;
};

export type ModulRoster = {
  id: string;
  order: number;
  title: string;
  questionTopic: string | null;
};

export type AgregatModul = {
  moduleId: string;
  titlu: string;
  ordine: number;
  /** Răspunsuri date, pe toată grupa. */
  total: number;
  /** Dintre ele, greșite. */
  greseli: number;
  /** Câți oameni distincți au ajuns la modulul ăsta. */
  cursanti: number;
};

/**
 * Se numără ÎNCERCĂRI, nu oameni: un modul la care zece oameni greșesc o dată e altă
 * problemă decât unul la care un om greșește de zece ori. A doua se citește din
 * `cursanti`, de-aia câmpul există.
 *
 * Modulele fără niciun răspuns sunt EXCLUSE, nu arătate cu 0%: un modul la care n-a
 * ajuns nimeni nu e un modul înțeles, iar 0% l-ar fi așezat lângă cele reușite.
 *
 * ── Ordinea, și de ce NU e rata brută ────────────────────────────────────────
 * Prima variantă sorta pe `greseli / total`. Cu eșantioane inegale — și la un client
 * cu mii de oameni ele SUNT inegale — un modul cu un singur răspuns greșit iese 100%
 * și trece peste unul la care 400 din 500 de oameni au picat. Adică exact decizia pe
 * care panoul o servește (ce modul rescriem) e îndreptată greșit de un singur răspuns.
 *
 * Se sortează pe rată NETEZITĂ, `(greseli + 1) / (total + 2)`: un răspuns greșit
 * singur devine 67% în loc de 100%, iar 400/500 rămâne 80% și urcă primul. Cu cât
 * eșantionul e mai mare, cu atât netezirea contează mai puțin — la 500 de răspunsuri
 * mută rezultatul cu două zecimale.
 *
 * Procentul AFIȘAT rămâne cel brut: managerul vede numărătoarea reală, alături de
 * câte răspunsuri stau în spatele ei. Netezirea decide doar ordinea.
 */
export function agregaGreseliPeModul(
  module: readonly ModulRoster[],
  incercari: readonly IncercareRoster[],
): AgregatModul[] {
  const peTema = new Map<string, string>();
  for (const m of module) {
    if (m.questionTopic) peTema.set(m.questionTopic, m.id);
  }

  const acc = new Map<string, { total: number; greseli: number; oameni: Set<string> }>();
  for (const a of incercari) {
    const mid = peTema.get(a.topic ?? "");
    if (!mid) continue;
    const e = acc.get(mid) ?? { total: 0, greseli: 0, oameni: new Set<string>() };
    e.total += 1;
    if (!a.isCorrect) e.greseli += 1;
    e.oameni.add(a.userId);
    acc.set(mid, e);
  }

  return module
    .map((m) => {
      const e = acc.get(m.id);
      return {
        moduleId: m.id,
        titlu: m.title,
        ordine: m.order,
        total: e?.total ?? 0,
        greseli: e?.greseli ?? 0,
        cursanti: e?.oameni.size ?? 0,
      };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => {
      const ra = (a.greseli + 1) / (a.total + 2);
      const rb = (b.greseli + 1) / (b.total + 2);
      if (rb !== ra) return rb - ra;
      return b.total - a.total;
    });
}

/** Procentul de greșeală, întreg. Separat ca pagina să nu recalculeze împărțirea. */
export function procentGreseli(m: AgregatModul): number {
  if (m.total === 0) return 0;
  return Math.round((m.greseli / m.total) * 100);
}
