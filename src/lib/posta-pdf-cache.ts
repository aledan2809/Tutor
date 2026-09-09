/**
 * Unde stau PDF-urile deja generate pentru `/posta`, și cum se aruncă.
 *
 * Fișierul există ca ruta de PDF și ecranul de editare să nu ajungă să aibă păreri
 * diferite despre același director. Ruta îl generează; salvarea textelor îl golește.
 *
 * De ce e nevoie de golire: cache-ul e pe VECHIME (10 minute), nu pe conținut. Fără
 * asta, cine schimbă o frază în panou și apasă imediat „Descarcă prezentarea" primește
 * documentul DINAINTE de modificare, fără nicio eroare și fără vreun semn — iar pagina
 * de pe ecran arată textul nou. Două artefacte care se contrazic în tăcere, exact
 * lucrul pe care editarea din panou trebuia să-l elimine.
 */
import { readdir, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

/** Aceeași regulă ca în ruta de PDF: sub HOME, fără punct la început (vezi nota despre snap acolo). */
export function cacheDirPdfPosta(): string {
  return process.env.POSTA_PDF_DIR || path.join(homedir(), "tutor-pdf-cache");
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
