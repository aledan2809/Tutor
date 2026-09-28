// S2 — un părinte vine de pe pagina flyerului, își face cont, adaugă copilul (cont direct), copilul intră și
// ajunge la conținut, părintele îi vede progresul. PRODUCȚIE, telefon, conturi de test (e2e-0926-), șterse la final.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-09-26/s2-parinte.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium, devices } = require("playwright");

const BASE = "https://etutor.ro";
const DIR = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-09-26/capturi/s2";
mkdirSync(DIR, { recursive: true });
const STAMP = Date.now().toString().slice(-6);
const PARENT = `e2e-0926-parinte-${STAMP}@demo.tutor.app`;
const CHILD = `e2e-0926-copil-${STAMP}@demo.tutor.app`;
const PASS = "ParolaTest-0926!";
const log = [];
let taps = 0;
let n = 0;
const shot = async (page, name) => {
  n++;
  const id = String(n).padStart(2, "0");
  await page.screenshot({ path: `${DIR}/${id}-${name}.png` });
  const t = (await page.locator("main, body").first().innerText()).replace(/\s+/g, " ").slice(0, 260);
  log.push(`${id} [${taps}] ${name} — ${page.url().replace(BASE, "")}\n     ${t}`);
};
const tap = async (loc) => { taps++; await loc.click(); };
const settle = async (page, ms = 2500) => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(ms); };

const browser = await chromium.launch();
const errs = [];
const phone = async () => {
  const c = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  return { c, p };
};
try {
  // ── Părintele ──────────────────────────────────────────────────────────────
  const { p: page } = await phone();
  await page.goto(`${BASE}/ro/parinte`, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 4000 }).catch(() => {});
  await shot(page, "parinte-landing");
  await tap(page.getByRole("link", { name: /Încearcă fără card/i }).first());
  await settle(page);
  await shot(page, "inregistrare");
  const inputs = page.locator("form input:not([type=checkbox]):not([type=hidden])");
  await inputs.nth(0).fill("Părinte E2E");
  await inputs.nth(1).fill(PARENT);
  await inputs.nth(2).fill(PASS);
  await inputs.nth(3).fill(PASS);
  const boxes = page.locator("form input[type=checkbox]");
  log.push(`     căsuțe în formular: ${await boxes.count()} · rol selectat: ${await page.locator('[aria-checked="true"]').first().innerText().catch(() => "?")}`);
  if (await boxes.count()) await tap(boxes.first());
  await shot(page, "formular");
  await tap(page.locator("form button[type=submit]"));
  await page.waitForURL((u) => !u.pathname.includes("/auth/register"), { timeout: 30000 }).catch(() => {});
  await settle(page);
  await shot(page, "dupa-inregistrare");

  // Familia mea → adaugă copil → cont direct.
  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  taps++; // în realitate: meniu + „Familia mea"
  await settle(page, 1500);
  await shot(page, "familia-mea");
  const add = page.locator("button", { hasText: /Adaugă copil/ }).first();
  if (await add.count()) {
    await tap(add);
    await settle(page, 1200);
    await shot(page, "adauga-copil");
    const direct = page.locator("button", { hasText: /Creează contul direct/ }).first();
    if (await direct.count()) {
      await tap(direct);
      await page.waitForTimeout(800);
      await shot(page, "cont-direct-formular");
      const fName = page.getByPlaceholder("Numele copilului");
      const fEmail = page.getByPlaceholder("email@exemplu.ro");
      const fPass = page.getByPlaceholder("Parolă (min. 8 caractere)");
      const eye = fPass.locator("xpath=..").locator("button");
      log.push(`     parola copilului are buton de afișare: ${(await eye.count()) ? "DA" : "NU"}`);
      await fName.fill("Copil E2E");
      await fEmail.fill(CHILD);
      await fPass.fill(PASS);
      await tap(page.locator("button", { hasText: /Creează contul copilului/ }).first());
      await settle(page, 3000);
      await shot(page, "copil-creat");
    }
  }

  // ── Copilul, pe telefonul lui ──────────────────────────────────────────────
  const { p: kid } = await phone();
  const kidTapsStart = taps;
  await kid.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await kid.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 4000 }).catch(() => {});
  await kid.fill("#email", CHILD);
  await kid.fill("#password", PASS);
  await tap(kid.locator('form button[type="submit"]').first());
  await settle(kid, 3500);
  await shot(kid, "copil-dupa-intrare");
  const kidSeesPrice = /lei|pachetele|plătești|−30%/.test(await kid.locator("body").innerText());
  log.push(`     copilul vede prețuri/îndemn la plată pe primul ecran: ${kidSeesPrice ? "DA" : "NU"}`);
  // Drumul copilului spre prima întrebare, cu ce găsește pe ecran.
  for (let i = 0; i < 4; i++) {
    if (await kid.locator("text=/Întrebarea 1 din/").count()) break;
    const cta = kid.locator("main button, main a").filter({ hasText: /Începe|Continuă|→/ }).first();
    if (!(await cta.count())) break;
    await tap(cta);
    await settle(kid, 2500);
    await shot(kid, `copil-pas-${i + 1}`);
  }
  const kidReached = (await kid.locator("text=/Întrebarea 1 din/").count()) > 0;
  log.push(`\nCOPILUL AJUNGE LA O ÎNTREBARE: ${kidReached ? "DA" : "NU"} după ${taps - kidTapsStart} atingeri`);

  // ── Părintele se uită la copil ────────────────────────────────────────────
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
  await settle(page, 2000);
  await shot(page, "parinte-panou");
  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  await settle(page, 2000);
  await shot(page, "parinte-familia-dupa");
  const childLink = page.locator("a", { hasText: /Copil E2E/ }).first();
  if (await childLink.count()) {
    await childLink.click();
    await settle(page, 2500);
    await shot(page, "parinte-fisa-copil");
  } else {
    log.push("     (în Familia mea nu există un link direct spre fișa copilului)");
  }
} catch (e) {
  log.push(`EROARE: ${String(e).slice(0, 300)}`);
} finally {
  log.push(`Erori în pagină: ${errs.length ? errs.join(" | ") : "niciuna"}`);
  log.push(`Conturi: ${PARENT} · ${CHILD}`);
  console.log(log.join("\n"));
  await browser.close();
}
