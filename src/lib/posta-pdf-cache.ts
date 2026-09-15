/**
 * Unde stau PDF-urile deja generate pentru `/posta`, cum se judecă vechimea lor și cum
 * se aruncă. Fișierul e PUR (doar `fs` + `path`): ruta de PDF, editorul de texte și
 * testele citesc aceleași reguli de aici.
 *
 * De ce e nevoie de golire la salvarea textelor: cache-ul e pe VECHIME, nu pe conținut.
 * Fără asta, cine schimbă o frază în panou și apasă imediat „Descarcă prezentarea"
 * primește documentul DINAINTE de modificare, fără nicio eroare — iar pagina de pe
 * ecran arată textul nou. Două artefacte care se contrazic în tăcere.
 */
import { readdir, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

/** Cât timp e considerat proaspăt un PDF deja generat (nu se regenerează). */
export const CACHE_PROASPAT_MS = 10 * 60 * 1000;

export type StareCachePdf = "proaspat" | "vechi" | "lipsa";

/**
 * Judecata pe vechimea fișierului din cache. `vechi` NU înseamnă „nu-l folosi":
 * înseamnă „servește-l acum și regenerează în fundal" — Chromium pe VPS pornește în
 * ~90 s, iar omul care apasă pe buton nu trebuie să aștepte niciodată asta dacă
 * există măcar o versiune de dat. Un fișier gol se tratează ca lipsă.
 */
export function stareCachePdf(mtimeMs: number | null | undefined, acumMs: number, marime = 1): StareCachePdf {
  if (mtimeMs == null || !Number.isFinite(mtimeMs) || marime <= 0) return "lipsa";
  return acumMs - mtimeMs < CACHE_PROASPAT_MS ? "proaspat" : "vechi";
}

/**
 * Sub atât, un fișier care a trecut de „nu e gol" e aproape sigur un `about:blank`
 * tipărit de Chromium înainte ca `/posta` să apuce să se încarce — nu o prezentare
 * mai scurtă. Măsurat pe VPS2 (2026-09-15): fișierul real are ~230 KB / 12 pagini;
 * rateul prins avea 856 octeți / 1 pagină goală, dar trecea testul `lungime > 0`
 * și rămânea cache-uit ca „gata" până la următoarea regenerare reușită.
 */
export const MARIME_MINIMA_VALIDA_BYTES = 20_000;

/** Adevărul ăsta se cere ÎNAINTE de a redenumi fișierul temporar peste cache — vezi genereaza(). */
export function esteContinutPdfValid(marimeBytes: number): boolean {
  return Number.isFinite(marimeBytes) && marimeBytes >= MARIME_MINIMA_VALIDA_BYTES;
}

/** Aceeași regulă ca în generator: sub HOME, fără punct la început (vezi nota despre snap acolo). */
export function cacheDirPdfPosta(): string {
  return process.env.POSTA_PDF_DIR || path.join(homedir(), "tutor-pdf-cache");
}

export function caleCachePdfPosta(locale: string): string {
  return path.join(cacheDirPdfPosta(), `posta-${locale}.pdf`);
}

/**
 * Șterge PDF-urile generate. Nu aruncă niciodată: un cache care nu s-a putut goli
 * înseamnă cel mult un document învechit zece minute — nu un motiv să pice salvarea
 * textelor, care e lucrul pe care omul chiar l-a cerut.
 */
export async function invalideazaPdfPosta(): Promise<number> {
  const dir = cacheDirPdfPosta();
  try {
    const fisiere = await readdir(dir);
    const ale_noastre = fisiere.filter((f) => /^posta-[a-z]{2}\.pdf$/.test(f));
    await Promise.all(ale_noastre.map((f) => unlink(path.join(dir, f)).catch(() => {})));
    return ale_noastre.length;
  } catch {
    return 0;
  }
}
