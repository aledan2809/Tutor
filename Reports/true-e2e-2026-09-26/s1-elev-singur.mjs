// S1 — un elev își face singur cont de pe telefon, pe PRODUCȚIE (etutor.ro), și ajunge la prima întrebare.
// Contul e de test (prefix e2e-0926-, domeniu demo.tutor.app) și se șterge la finalul auditului.
// Se numără atingerile de la prima pagină până la prima întrebare pe ecran.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-09-26/s1-elev-singur.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium, devices } = require("playwright");

const BASE = "https://etutor.ro";
const DIR = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-09-26/capturi/s1";
mkdirSync(DIR, { recursive: true });
const STAMP = Date.now().toString().slice(-6);
// Litere mari în email, intenționat: un telefon pune adesea majusculă la început.
const EMAIL = `E2E-0926-Elev-${STAMP}@Demo.Tutor.App`;
const PASS = "ParolaTest-0926!";
const log = [];
let taps = 0;
const step = async (page, name) => {
  const n = String(log.length + 1).padStart(2, "0");
  await page.screenshot({ path: `${DIR}/${n}-${name}.png`, fullPage: false });
  const t = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 220);
  log.push(`${n} [${taps} atingeri] ${name} — ${page.url().replace(BASE, "")}\n     ${t}`);
};
const tap = async (loc) => { taps++; await loc.click(); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
try {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 4000 }).catch(() => {});
  await step(page, "prima-pagina");

  await tap(page.getByRole("link", { name: /Fă-ți cont gratuit/i }).first());
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await step(page, "inregistrare");

  // Rolul „Elev” e implicit. Câmpurile, în ordine.
  const inputs = page.locator("form input:not([type=checkbox]):not([type=hidden])");
  await inputs.nth(0).fill("Elev E2E");
  await inputs.nth(1).fill(EMAIL);
  await inputs.nth(2).fill(PASS);
  await inputs.nth(3).fill(PASS);
  // Materia: prima căsuță (un elev alege ce vrea; numărăm o atingere).
  const boxes = page.locator("form input[type=checkbox]");
  const nBoxes = await boxes.count();
  if (nBoxes) await tap(boxes.first());
  await step(page, `formular-completat (${nBoxes} materii de ales)`);
  await tap(page.locator("form button[type=submit]"));
  await page.waitForURL((u) => !u.pathname.includes("/auth/register"), { timeout: 30000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
  await step(page, "dupa-inregistrare");

  // Câte ecrane de derulat până la ghidul de pornire (pe telefon, sub banner).
  const wiz = page.locator("text=/Bine ai venit/").first();
  if (await wiz.count()) {
    const box = await wiz.boundingBox();
    log.push(`     ghidul „Bine ai venit” începe la ${Math.round(box?.y ?? 0)}px — ecranul are ${page.viewportSize().height}px`);
  }
  // Pasul 1 al ghidului: materiile oferite.
  const subjects = page.locator("main section button").filter({ hasText: /→/ });
  const names = (await subjects.allInnerTexts()).map((x) => x.replace(/\s+/g, " ").replace(/→/, "").trim());
  log.push(`     materii oferite în ghid (${names.length}): ${names.join(" | ")}`);
  const pick = subjects.filter({ hasText: /Matematic/ }).first();
  if (await pick.count()) {
    await tap(pick);
    await page.waitForTimeout(2000);
    await step(page, "materie-aleasa");
    const start = page.locator("main button").filter({ hasText: /Începe|test/i }).first();
    if (await start.count()) {
      await tap(start);
      await page.waitForURL(/\/dashboard\/practice\//, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2500);
      await step(page, "test-scurt");
    }
  }
  const reached = (await page.locator("text=/Întrebarea 1 din/").count()) > 0;
  if (!reached) await step(page, "unde-a-ramas");
  log.push(`\nPRIMA ÎNTREBARE PE ECRAN: ${reached ? "DA" : "NU"} după ${taps} atingeri (pagina ${page.url().replace(BASE, "")})`);

  // Intrarea din nou, cu emailul scris cu litere mici (cum îl tastezi pe alt telefon).
  const ctx2 = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await p2.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 4000 }).catch(() => {});
  await p2.fill("#email", EMAIL.toLowerCase());
  await p2.fill("#password", PASS);
  await p2.locator('form button[type="submit"]').first().click();
  await p2.waitForTimeout(4000);
  const lowerOk = !p2.url().includes("/auth/signin");
  log.push(`Intrare cu emailul scris cu litere mici (${EMAIL.toLowerCase()}): ${lowerOk ? "MERGE" : "NU MERGE"} → ${p2.url().replace(BASE, "")}`);
  await p2.screenshot({ path: `${DIR}/90-intrare-litere-mici.png` });
  await ctx2.close();
} catch (e) {
  log.push(`EROARE: ${String(e).slice(0, 300)}`);
  await step(page, "eroare").catch(() => {});
} finally {
  log.push(`Erori în pagină: ${errs.length ? errs.join(" | ") : "niciuna"}`);
  log.push(`Cont creat: ${EMAIL}`);
  console.log(log.join("\n"));
  await browser.close();
}
