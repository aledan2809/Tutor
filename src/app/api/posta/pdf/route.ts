import { spawn } from "node:child_process";
import { mkdir, readFile, stat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/posta/pdf?locale=ro|en — prezentarea `/posta` ca fișier de trimis mai departe.
 *
 * De ce randăm pagina live în loc să desenăm un PDF separat: omul de la Poșta trimite
 * documentul conducerii, iar peste o lună textul paginii se va edita din admin. Un PDF
 * construit separat ar rămâne în urmă tăcut — ăsta nu poate, fiindcă E pagina.
 *
 * Cum arată diferit de pagină: `@media print` din `posta/page.tsx` îl face alb, ascunde
 * bannerul de cookie-uri și butoanele de autentificare, și adaugă rândul cu furnizorul.
 *
 * Capcană măsurată pe VPS2 (2026-09-09): `chromium-browser` de acolo e un înveliș peste
 * **snap**, care are `/tmp` privat — scrisese corect 227 KB într-un `/tmp` pe care nimeni
 * din afara containerului nu-l vede. De-aia scriem sub HOME, nu în `/tmp`.
 */

const LOCALES = ["ro", "en"] as const;
type Locale = (typeof LOCALES)[number];

/** Cât timp e considerat proaspăt un PDF deja generat. */
const CACHE_MS = 10 * 60 * 1000;
/** Peste atât, omorâm browserul: mai bine o eroare clară decât un proces agățat. */
const TIMEOUT_MS = 90_000;

/**
 * Adresa de randat NU vine niciodată din cererea HTTP. Dacă am lua `Host`-ul din antet,
 * oricine ne-ar putea pune serverul să randeze pagina lui în PDF, cu marca noastră pe ea.
 */
function baseUrl(): string {
  const raw =
    process.env.POSTA_PDF_BASE_URL || process.env.AUTH_URL || "https://etutor.ro";
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

/**
 * Sub HOME, nu în `/tmp` — vezi nota despre snap din capul fișierului.
 *
 * Și numele directorului contează: interfața `home` a snap-ului NU dă acces la
 * directoarele ascunse (cele care încep cu punct). Măsurat pe VPS2: cu
 * `/root/.cache/...` chromium iese cu codul 0 și nu scrie nimic; cu
 * `/root/tutor-pdf-cache/` scrie fișierul. Deci fără punct la început.
 */
function cacheDir(): string {
  return process.env.POSTA_PDF_DIR || path.join(homedir(), "tutor-pdf-cache");
}

/** Cereri paralele pe aceeași limbă așteaptă aceeași generare, nu pornesc încă un browser. */
const inFlight = new Map<Locale, Promise<Buffer>>();

async function runChromium(url: string, out: string): Promise<void> {
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

async function generate(locale: Locale): Promise<Buffer> {
  const dir = cacheDir();
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, `posta-${locale}.pdf`);

  // Servim din cache dacă e proaspăt.
  try {
    const s = await stat(out);
    if (Date.now() - s.mtimeMs < CACHE_MS && s.size > 0) return await readFile(out);
  } catch {
    // lipsește — îl generăm mai jos
  }

  await runChromium(`${baseUrl()}/${locale}/posta`, out);

  const buf = await readFile(out).catch(() => null);
  if (!buf || buf.length === 0) {
    await unlink(out).catch(() => {});
    throw new Error("Chromium a raportat succes, dar n-a lăsat niciun fișier.");
  }
  return buf;
}

async function _GET(req: Request) {
  const asked = new URL(req.url).searchParams.get("locale");
  const locale: Locale = (LOCALES as readonly string[]).includes(asked ?? "")
    ? (asked as Locale)
    : "ro";

  let job = inFlight.get(locale);
  if (!job) {
    job = generate(locale).finally(() => inFlight.delete(locale));
    inFlight.set(locale, job);
  }

  let pdf: Buffer;
  try {
    pdf = await job;
  } catch (err) {
    console.error("[posta/pdf] generare eșuată:", err);
    return NextResponse.json(
      { error: "PDF_GENERATION_FAILED", message: "Prezentarea nu a putut fi generată acum." },
      { status: 503 }
    );
  }

  const nume = locale === "en" ? "eTutor-Posta-Romana-EN.pdf" : "eTutor-Posta-Romana.pdf";
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nume}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "public, max-age=600",
    },
  });
}

export const GET = withErrorHandler(_GET);
