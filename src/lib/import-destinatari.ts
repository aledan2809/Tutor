/**
 * Citirea unei liste de cursanți dintr-un tabel lipit sau dintr-un fișier CSV.
 *
 * La mii de oameni, invitarea unul câte unul nu e o opțiune. Dar un import care
 * scrie direct în baza de date e periculos tocmai la scara asta: o coloană
 * încurcată înseamnă mii de rânduri greșite, iar telefonul e cheia — dacă e greșit,
 * omul nu primește nimic și nimeni nu observă.
 *
 * De-aia funcția asta NU scrie nimic: citește, verifică și spune ce a înțeles, ca
 * omul să vadă înainte de a apăsa.
 */

export type RandCitit = {
  /** Rândul din fișier, ca omul să-l găsească — antetul e rândul 1. */
  linie: number;
  lastName: string;
  firstName: string;
  jobTitle: string | null;
  badgeNo: string | null;
  phone: string;
  county: string | null;
  city: string | null;
  postOffice: string | null;
  /** Ce nu e în regulă. Rândul cu probleme nu se importă. */
  probleme: string[];
};

export type RezultatCitire = {
  randuri: RandCitit[];
  /** Coloanele recunoscute, în ordinea din fișier — ca omul să verifice maparea. */
  coloane: string[];
  /** Coloane din fișier pe care nu le-am recunoscut; se ignoră, dar se spun. */
  necunoscute: string[];
};

/** Numele acceptate pentru fiecare coloană, fără diacritice și cu majuscule ignorate. */
const SINONIME: Record<keyof Omit<RandCitit, "linie" | "probleme">, string[]> = {
  lastName: ["nume", "nume de familie", "last name", "lastname"],
  firstName: ["prenume", "first name", "firstname"],
  jobTitle: ["functie", "functia", "post", "job", "rol"],
  badgeNo: ["marca", "marca nr", "numar personal", "badge", "id angajat"],
  phone: ["telefon", "tel", "nr telefon", "numar", "mobil", "phone"],
  county: ["judet", "judetul", "county"],
  city: ["localitate", "oras", "localitatea", "city"],
  postOffice: ["oficiu", "oficiu postal", "oficiul postal", "op", "unitate"],
};

function fara(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Separatorul: virgulă, punct-virgulă sau tab — care apare mai des pe antet. */
export function ghicesteSeparator(antet: string): string {
  const candidati = [";", ",", "\t"];
  let best = ";";
  let max = -1;
  for (const c of candidati) {
    const n = antet.split(c).length;
    if (n > max) {
      max = n;
      best = c;
    }
  }
  return best;
}

/** Împarte un rând CSV respectând ghilimelele: „Slatina, jud. Olt" rămâne o celulă. */
export function imparteRand(rand: string, sep: string): string[] {
  const out: string[] = [];
  let curent = "";
  let inGhilimele = false;
  for (let i = 0; i < rand.length; i++) {
    const c = rand[i];
    if (c === '"') {
      if (inGhilimele && rand[i + 1] === '"') {
        curent += '"';
        i++;
      } else {
        inGhilimele = !inGhilimele;
      }
    } else if (c === sep && !inGhilimele) {
      out.push(curent);
      curent = "";
    } else {
      curent += c;
    }
  }
  out.push(curent);
  return out.map((v) => v.trim());
}

/** Aceeași normalizare ca la trimitere, ca numerele să se potrivească între ele. */
export function normalizeazaTelefon(intrare: string): string {
  const cifre = intrare.replace(/\D/g, "");
  if (!cifre) return "";
  if (cifre.startsWith("0")) return `40${cifre.slice(1)}`;
  if (cifre.startsWith("40")) return cifre;
  if (cifre.length === 9) return `40${cifre}`; // scris fără zero la început
  return cifre;
}

export function citesteLista(text: string): RezultatCitire {
  const linii = text.split(/\r?\n/).filter((l) => l.trim());
  if (linii.length === 0) return { randuri: [], coloane: [], necunoscute: [] };

  const sep = ghicesteSeparator(linii[0]);
  const antet = imparteRand(linii[0], sep).map(fara);

  const indice: Partial<Record<keyof typeof SINONIME, number>> = {};
  const necunoscute: string[] = [];
  antet.forEach((titlu, i) => {
    const gasit = (Object.keys(SINONIME) as (keyof typeof SINONIME)[]).find((k) =>
      SINONIME[k].includes(titlu)
    );
    if (gasit && indice[gasit] === undefined) indice[gasit] = i;
    else if (!gasit && titlu) necunoscute.push(titlu);
  });

  const coloane = (Object.keys(SINONIME) as (keyof typeof SINONIME)[]).filter(
    (k) => indice[k] !== undefined
  );

  const ia = (celule: string[], k: keyof typeof SINONIME): string => {
    const i = indice[k];
    return i === undefined ? "" : (celule[i] ?? "").trim();
  };

  const vazute = new Set<string>();
  const randuri: RandCitit[] = linii.slice(1).map((linie, n) => {
    const celule = imparteRand(linie, sep);
    const phone = normalizeazaTelefon(ia(celule, "phone"));
    const lastName = ia(celule, "lastName");
    const firstName = ia(celule, "firstName");

    const probleme: string[] = [];
    if (!lastName) probleme.push("lipsește numele");
    if (!firstName) probleme.push("lipsește prenumele");
    if (!phone) probleme.push("lipsește telefonul");
    else if (!/^\d{10,15}$/.test(phone)) probleme.push(`telefon neplauzibil: ${ia(celule, "phone")}`);
    else if (vazute.has(phone)) probleme.push("telefon repetat în fișier");
    if (phone) vazute.add(phone);

    return {
      linie: n + 2, // +1 pentru antet, +1 fiindcă oamenii numără de la 1
      lastName,
      firstName,
      jobTitle: ia(celule, "jobTitle") || null,
      badgeNo: ia(celule, "badgeNo") || null,
      phone,
      county: ia(celule, "county") || null,
      city: ia(celule, "city") || null,
      postOffice: ia(celule, "postOffice") || null,
      probleme,
    };
  });

  return { randuri, coloane, necunoscute };
}
