// Materia „Aptitudini Aviație — Set extins” văzută de elev: apare, un test pornește, exercițiile arată bine.
// Stiva QA locală (:3113). Pregătire: contul qa-rares-ext + scripts/seed-aptitudini-extins.mjs --apply pe QA.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/aptitudini-extins-2026-09-24/verificare-materie.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");

const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/aptitudini-extins-2026-09-24/capturi";
mkdirSync(SHOTS, { recursive: true });
const results = [];
const check = (n, ok, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};

let browser;
try {
  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.fill("#email", "qa-rares-ext@demo.tutor.app");
  await page.fill("#password", "parola-ext-1234");
  await Promise.all([page.waitForLoadState("networkidle"), page.click('form button[type="submit"]')]);
  await page.waitForTimeout(2000);

  await page.goto(`${BASE}/ro/dashboard/practice`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const practice = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  // Cu o singură materie, pagina nu arată selectorul — arată direct câte întrebări are (aici toate cele din
  // materia nouă). Cu mai multe materii, numele apare în selector.
  check("materia apare la Grile (selector sau numărul ei de întrebări)", /Set extins|\b(5\d\d|[6-9]\d\d) Întrebări disponibile/.test(practice), practice.slice(0, 120));
  await page.screenshot({ path: `${SHOTS}/01-grile.png`, fullPage: true });

  await page.goto(`${BASE}/ro/dashboard/practice?start=quick&domain=aptitudini-aviatie-extins`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 20000 }).catch(() => {});
  check("un test pornește pe materia nouă", /\/dashboard\/practice\/[^/?]+$/.test(page.url()), page.url());
  await page.waitForTimeout(2500);
  const q = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  check("întrebarea e o serie sau o problemă numerică", /următorul număr din serie|pasageri|combustibil|bilet|zbor|venitul/i.test(q), q.slice(0, 200));
  await page.screenshot({ path: `${SHOTS}/02-intrebare.png`, fullPage: true });
  check("fără erori în pagină", errs.length === 0, errs.join(" | "));
} catch (e) {
  console.error(e);
  results.push(false);
} finally {
  await browser?.close();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
