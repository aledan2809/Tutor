/**
 * Prezentarea `/posta` ca PDF — generarea cu Chromium headless și regulile de servire.
 * Ruta HTTP (`/api/posta/pdf`) și editorul de texte din panou folosesc AMÂNDOUĂ
 * fișierul ăsta; judecata pe vechime stă în `posta-pdf-cache.ts` (pur, testat).
 *
 * De ce randăm pagina live în loc să desenăm un PDF separat: omul de la Poșta trimite
 * documentul conducerii, iar peste o lună textul paginii se va edita din admin. Un PDF
 * construit separat ar rămâne în urmă tăcut — ăsta nu poate, fiindcă E pagina.
 *
 * Capcană măsurată pe VPS2 (2026-09-09): `chromium` de acolo e un snap cu `/tmp`
 * privat — scrisese corect 227 KB într-un `/tmp` pe care nimeni din afara containerului
 * nu-l vede. De-aia scriem sub HOME, într-un director FĂRĂ punct la început (interfața
 * `home` a snap-ului nu dă acces la directoarele ascunse).
 *
 * Măsurat pe VPS2 (2026-09-15): Chromium pornește în ~90 s indiferent de pagină
 * (example.com: 90 s) și, fără `--timeout`, așteaptă la nesfârșit o pagină care nu
 * ajunge la „load" — de aici 503 după 90 s pe ORICE descărcare, două zile la rând,
 * fără să apară nimic pe pagină. Regulile de acum:
 *   • `--timeout=25000` plafonează încărcarea paginii; procesul e omorât la 240 s;
 *   • un PDF din cache se servește PE LOC chiar dacă e vechi, iar regenerarea pornește
 *     în fundal — cine apasă butonul nu așteaptă Chromium dacă există măcar o versiune;
 *   • salvarea textelor din panou aruncă cache-ul ȘI pornește regenerarea, ca
 *     următoarea descărcare să nu plătească cele ~2 minute;
 *   • fișierul se scrie într-un temporar și se redenumește la final — o cerere
 *     paralelă nu vede niciodată un PDF pe jumătate scris; iar o generare pornită
 *     ÎNAINTE de o salvare din panou își aruncă rezultatul, fiindcă a randat pagina veche.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, rename, stat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  caleCachePdfPosta,
  cacheDirPdfPosta,
  esteContinutPdfValid,
  invalideazaPdfPosta,
  stareCachePdf,
} from "./posta-pdf-cache";

export const LOCALES_PDF = ["ro", "en"] as const;
export type LocalePdf = (typeof LOCALES_PDF)[number];

/** Peste atât, omorâm browserul: mai bine o eroare clară decât un proces agățat. */
const TIMEOUT_MS = 240_000;
/** Cât are voie să dureze încărcarea paginii în Chromium; după, tipărește ce are. */
const PAGE_LOAD_TIMEOUT_MS = 25_000;

/**
 * Adresa de randat NU vine niciodată din cererea HTTP. Dacă am lua `Host`-ul din antet,
 * oricine ne-ar putea pune serverul să randeze pagina lui în PDF, cu marca noastră pe ea.
 */
function baseUrl(): string {
  const raw = process.env.POSTA_PDF_BASE_URL || process.env.AUTH_URL || "https://etutor.ro";
  return raw.replace(/\/+$/, "");
}

function chromiumBin(): string | null {
  if (process.env.CHROMIUM_BIN) return process.env.CHROMIUM_BIN;
  const candidates = [
    "/snap/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

async function ruleazaChromium(url: string, out: string): Promise<void> {
  const bin = chromiumBin();
  if (!bin) throw new Error("Nu am găsit niciun binar de Chromium (setează CHROMIUM_BIN).");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      bin,
      [
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--no-pdf-header-footer", // fără „9/9/26 … | Tutor" și fără URL în subsol
        `--timeout=${PAGE_LOAD_TIMEOUT_MS}`,
        "--virtual-time-budget=20000",
        `--print-to-pdf=${out}`,
        url,
      ],
      { stdio: "ignore" }
    );

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Generarea PDF a depășit ${TIMEOUT_MS / 1000}s.`));
    }, TIMEOUT_MS);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      // Chromium întoarce 0 și când n-a scris nimic — fișierul e singura dovadă.
      if (code === 0) resolve();
      else reject(new Error(`Chromium a ieșit cu codul ${code}.`));
    });
  });
}

/** Cereri paralele pe aceeași limbă așteaptă aceeași generare, nu pornesc încă un browser. */
const inFlight = new Map<LocalePdf, Promise<Buffer>>();
/** Momentul ultimei salvări din panou: o generare pornită înainte a randat pagina veche. */
let ultimaInvalidare = 0;

async function genereaza(locale: LocalePdf): Promise<Buffer> {
  const dir = cacheDirPdfPosta();
  await mkdir(dir, { recursive: true });
  const out = caleCachePdfPosta(locale);
  const tmp = `${out}.tmp-${process.pid}-${Date.now()}`;
  const pornitLa = Date.now();

  try {
    await ruleazaChromium(`${baseUrl()}/${locale}/posta`, tmp);
    const buf = await readFile(tmp).catch(() => null);
    if (!buf || buf.length === 0) {
      throw new Error("Chromium a raportat succes, dar n-a lăsat niciun fișier.");
    }
    if (!esteContinutPdfValid(buf.length)) {
      // Chromium a ieșit cu 0 dar a tipărit pagina înainte să se încarce (about:blank) —
      // fișierul vechi din cache (dacă există) rămâne neatins, nu-l suprascriem cu un rateu.
      throw new Error(`Chromium a scris doar ${buf.length} octeți — probabil about:blank, nu prezentarea.`);
    }
    if (ultimaInvalidare > pornitLa) {
      // Textele s-au schimbat cât timp randam: ce avem în mână e pagina veche.
      throw new Error("Textele s-au schimbat în timpul generării; se reia.");
    }
    await rename(tmp, out);
    return buf;
  } finally {
    await unlink(tmp).catch(() => {});
  }
}

/** Generarea propriu-zisă, cu o singură rulare per limbă la un moment dat. */
export function genereazaPdfPosta(locale: LocalePdf): Promise<Buffer> {
  let job = inFlight.get(locale);
  if (!job) {
    job = genereaza(locale).finally(() => inFlight.delete(locale));
    inFlight.set(locale, job);
  }
  return job;
}

export type SursaPdf = "cache" | "cache-vechi" | "generat";

/**
 * Ce primește cine descarcă: cache-ul proaspăt; cache-ul vechi PE LOC, cu regenerarea
 * pornită în fundal; sau, când nu există nimic, o generare pe care o așteaptă.
 */
export async function obtinePdfPosta(locale: LocalePdf): Promise<{ pdf: Buffer; sursa: SursaPdf }> {
  const out = caleCachePdfPosta(locale);
  const s = await stat(out).catch(() => null);
  const stare = stareCachePdf(s?.mtimeMs, Date.now(), s?.size ?? 0);

  if (stare === "proaspat") return { pdf: await readFile(out), sursa: "cache" };
  if (stare === "vechi") {
    genereazaPdfPosta(locale).catch((err) => console.error("[posta/pdf] regenerare în fundal eșuată:", err));
    return { pdf: await readFile(out), sursa: "cache-vechi" };
  }
  return { pdf: await genereazaPdfPosta(locale), sursa: "generat" };
}

/**
 * La salvarea textelor din panou: aruncă ce e în cache și pornește imediat regenerarea
 * versiunii românești (cea care se trimite), ca prima descărcare de după editare să nu
 * plătească cele ~2 minute de Chromium. Nu aruncă niciodată — salvarea a reușit deja.
 */
export async function invalideazaSiRegenereazaPdfPosta(): Promise<number> {
  ultimaInvalidare = Date.now();
  const aruncate = await invalideazaPdfPosta();
  // O generare deja în curs (pornită de o descărcare) a randat pagina VECHE și se va
  // opri singură la final; abia a doua rulare, pornită după ea, prinde textele noi.
  genereazaPdfPosta("ro")
    .catch(() => genereazaPdfPosta("ro"))
    .catch((err) => console.error("[posta/pdf] regenerare după salvare eșuată:", err));
  return aruncate;
}
