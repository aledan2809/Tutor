/**
 * Cât valorează un răspuns, ținând cont de faptul că omul a mai văzut întrebarea.
 *
 * ── Ce era greșit înainte ────────────────────────────────────────────────────
 * `awardAnswerXp(userId, domainId, isCorrect, timeSpent)` — semnătura nici nu primea
 * `questionId`, deci nu AVEA CUM să știe că e o reluare. Fiecare răspuns corect valora
 * 10 puncte, la nesfârșit. Măsurat pe cazul cerut de user (modul de 4 întrebări, 2/4 și
 * apoi le învață pe cele două greșite): cine relua toate cele patru lua 60 de puncte,
 * adică MAI MULTE decât cine le știuse din prima (40). Măcinarea plătea mai bine decât
 * știutul.
 *
 * În același timp, raportul îl pedepsea pe același om: tabloul și `Progress.masteryLevel`
 * numără cumulat, deci 2/4 urmat de 2/2 apărea ca 4/6 = 67%, deși omul ajunsese să știe
 * 4 din 4. (Verificat pe rânduri reale: `masteryLevel` din bază e exact
 * `correctAttempts/totalAttempts`.)
 *
 * ── Principiul ───────────────────────────────────────────────────────────────
 * Scorul spune ce știi ACUM; punctele răsplătesc efortul, dar cu randament descrescător,
 * ca să nu poată fi măcinate.
 *
 * Valorile sunt decizia userului: 7 puncte pentru recuperare, plafon de 3 repetiții pe zi.
 * Secvența a fost extinsă la 3-2-1 tocmai fiindcă plafonul de 3 peste o secvență 2-1-0
 * n-ar fi schimbat nimic — a treia repetiție valora deja zero.
 */

/** Cele 10 puncte de la primul răspuns corect. Aceeași valoare ca înainte. */
export const PUNCTE_PRIMA = 10;
/** Bonusul de viteză, DOAR la prima întâlnire — vezi nota de la `calculeazaPuncte`. */
export const PUNCTE_RAPID = 5;
/** Greșit → corect. Sub 10 dinadins: altfel greșeala ar deveni strategie. */
export const PUNCTE_RECUPERARE = 7;
/** Repetarea a ceva deja știut, descrescător. Lungimea ei ESTE plafonul zilnic. */
export const PUNCTE_REPETITIE = [3, 2, 1] as const;

export type IstoricIntrebare = {
  /** Câte răspunsuri a mai dat omul la ACEASTĂ întrebare, înainte de cel de acum. */
  incercariAnterioare: number;
  /** Vreunul dintre ele a fost corect? */
  aFostCorectVreodata: boolean;
  /** Câte repetiții a mai făcut AZI la ea, după ce o stăpânea deja. */
  repetitiiAzi: number;
};

export type FelPunctaj = "prima" | "recuperare" | "repetitie" | "peste-plafon" | "gresit";

export type Punctaj = {
  puncte: number;
  fel: FelPunctaj;
  /** O propoziție pentru fișa omului. Un număr singur nu susține pe nimeni. */
  detaliu: string;
};

/**
 * Bonusul de viteză se dă DOAR la prima întâlnire cu întrebarea.
 *
 * Motivul e că el măsoară „a știut", nu „a fost repede": la a doua vedere, viteza e
 * așteptată și n-ar dovedi nimic. Lăsat pe toate încercările, ar fi fost a doua cale de
 * măcinare — repetare rapidă, 15 puncte de fiecare dată.
 */
export function calculeazaPuncte(
  corect: boolean,
  rapid: boolean,
  ist: IstoricIntrebare,
): Punctaj {
  if (!corect) {
    return { puncte: 0, fel: "gresit", detaliu: "Răspuns greșit" };
  }

  if (ist.incercariAnterioare === 0) {
    const puncte = PUNCTE_PRIMA + (rapid ? PUNCTE_RAPID : 0);
    return {
      puncte,
      fel: "prima",
      detaliu: rapid ? "Corect din prima, sub 5 secunde" : "Corect din prima",
    };
  }

  if (!ist.aFostCorectVreodata) {
    return {
      puncte: PUNCTE_RECUPERARE,
      fel: "recuperare",
      detaliu: "A revenit și a corectat o greșeală",
    };
  }

  if (ist.repetitiiAzi >= PUNCTE_REPETITIE.length) {
    return {
      puncte: 0,
      fel: "peste-plafon",
      detaliu: `Exersare peste plafonul de ${PUNCTE_REPETITIE.length} pe zi`,
    };
  }

  return {
    puncte: PUNCTE_REPETITIE[ist.repetitiiAzi],
    fel: "repetitie",
    detaliu: `Exersare (a ${ist.repetitiiAzi + 1}-a oară azi)`,
  };
}

// ─── Partea de RAPORT ────────────────────────────────────────────────────────

export type IncercareRezumat = {
  questionId: string;
  isCorrect: boolean;
  /** Ordinea contează: „din prima" înseamnă prima în timp, nu prima din listă. */
  createdAt: Date;
};

export type RezumatModul = {
  /** Câte întrebări distincte stăpânește ACUM (a nimerit-o măcar o dată). */
  stieAcum: number;
  /** Câte întrebări distincte a atins. */
  atinse: number;
  /** Dintre ele, câte au fost corecte de la prima încercare. */
  dinPrima: number;
  /** Câte a greșit întâi și a corectat pe urmă. Ăsta e numărul de susținut. */
  recuperari: number;
  /** Câte n-au fost nimerite niciodată, deși au fost încercate. */
  incaGresite: number;
};

/**
 * Ce vede managerul, în locul unui singur procent cumulat.
 *
 * Înainte, tabloul aduna toate încercările: 2/4 urmat de 2/2 pe cele greșite apărea ca
 * 4/6 = 67%, deși omul ajunsese să știe 4 din 4. Cine se întorcea să învețe arăta mai
 * prost decât cine se oprea — exact invers față de ce vrei să încurajezi. (Măsurat pe
 * date reale: un cursant apărea cu 2/4 = 50% când stăpânea 2 din 2.)
 *
 * Acum ies trei numere. Nu doar pentru corectitudine: „știe 4/4, din prima 2/4, două
 * recuperări" spune mai mult decât orice procent singur — arată și unde a ajuns omul, și
 * de unde a plecat, și cât l-a costat.
 */
export function rezumaModul(incercari: readonly IncercareRezumat[]): RezumatModul {
  const peIntrebare = new Map<string, IncercareRezumat[]>();
  for (const a of incercari) {
    const lista = peIntrebare.get(a.questionId) ?? [];
    lista.push(a);
    peIntrebare.set(a.questionId, lista);
  }

  let stieAcum = 0;
  let dinPrima = 0;
  let recuperari = 0;
  let incaGresite = 0;

  for (const lista of peIntrebare.values()) {
    const ordonate = [...lista].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const vreodataCorect = ordonate.some((a) => a.isCorrect);
    if (!vreodataCorect) {
      incaGresite += 1;
      continue;
    }
    stieAcum += 1;
    if (ordonate[0].isCorrect) dinPrima += 1;
    else recuperari += 1;
  }

  return { stieAcum, atinse: peIntrebare.size, dinPrima, recuperari, incaGresite };
}
