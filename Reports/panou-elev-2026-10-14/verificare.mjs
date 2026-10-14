// Verificarea pasului 13 (panoul elevului: S9, S10, S12, S13, S14) pe stiva QA, pe telefon.
//   BASE=http://localhost:3113 node Reports/panou-elev-2026-10-14/verificare.mjs
// Un elev nou (14 ani) face primul test, apoi: o singură cerere a panoului, „Continuă ▶” pornește pe materia
// lui, pasul „Simulare completă” lipsește fără lucrări și duce la lucrările materiei când există, iar un
// răspuns de eroare al panoului nu strică pagina. Adaugă temporar o lucrare de probă în baza QA și o șterge.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const { chromium, devices } = createRequire(process.cwd() + "/package.json")("playwright");
const BASE = (process.env.BASE || "http://localhost:3113").replace(/\/$/, "");
const OUT = new URL("./capturi/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sql = (q) => execSync(`docker exec tutor-qa-pg psql -U tutor -d tutor_qa -tAc ${JSON.stringify(q)}`).toString().trim();
const PAPER = "qa-paper-pas13";

let fail = 0;
const check = (ok, what) => {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) fail++;
};

const browser = await chromium.launch();
// Fără service worker: cererile trecute prin el ocolesc page.route (eroarea simulată de la S9).
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
sql(`DELETE FROM "ExamPaper" WHERE id = '${PAPER}'`);

try {
  // ── Cont nou ──
  await page.goto(`${BASE}/ro/auth/register`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
  const stamp = Date.now();
  await page.getByPlaceholder("Numele tău").fill("QA Panou");
  await page.getByPlaceholder("tu@exemplu.ro").fill(`qa-panou-${stamp}@qa-elev.ro`);
  await page.selectOption("#birth-day", "15");
  await page.selectOption("#birth-month", "5");
  await page.selectOption("#birth-year", "2012");
  await page.locator("#parent-email").fill(`parinte-panou-${stamp}@qa-parinte.ro`);
  await page.getByPlaceholder("Minimum 8 caractere").fill("qa-parola-123");
  await page.getByRole("button", { name: "Creează cont" }).click();
  await page.waitForURL((u) => /\/dashboard\/?$/.test(u.pathname), { timeout: 60000 });
  await page.getByRole("button", { name: /Matematica cl\. VIII/ }).waitFor({ timeout: 30000 });

  // S13: materiile fără grile și fără curs nu mai sunt oferite.
  const offered = await page.locator("main button").allTextContents();
  check(!offered.some((t) => /QA DIAG/.test(t)), `S13 asistentul nu oferă materii fără grile/curs (${offered.filter((t) => t.includes("→")).length} oferite)`);
  await page.screenshot({ path: `${OUT}1-asistent.png` });

  // Primul test, terminat.
  await page.getByRole("button", { name: /Matematica cl\. VIII/ }).click();
  await page.getByRole("button", { name: "Începe testul ▶" }).click();
  await page.getByRole("button", { name: "Da, e corect — începe testul" }).click();
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 60000 });
  const answers = page.locator("button", { hasText: /^\s*[A-D]\./ });
  for (let i = 0; i < 5; i++) {
    await answers.first().click();
    const submit = page.getByRole("button", { name: "Trimite răspunsul" });
    if (await submit.isVisible().catch(() => false)) await submit.click();
    const next = page.getByRole("button", { name: /Următoarea întrebare|rezultat|Termină/i }).last();
    await next.waitFor({ timeout: 30000 });
    await next.click();
    await page.waitForTimeout(500);
  }
  await page.waitForLoadState("networkidle");

  // S10: o singură cerere a panoului la deschidere.
  let dashboardCalls = 0;
  const count = (r) => r.url().includes("/api/student/dashboard") && dashboardCalls++;
  page.on("request", count);
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  page.off("request", count);
  check(dashboardCalls === 1, `S10 panoul face o singură cerere la deschidere (${dashboardCalls})`);

  // S14: fără lucrări oficiale, pasul „Simulare completă” lipsește.
  check((await page.getByText("Simulare completă").count()) === 0, "S14 fără lucrări, pasul „Simulare completă” nu apare");
  await page.screenshot({ path: `${OUT}2-astazi.png`, fullPage: true });

  // S12: „Continuă ▶” pornește un test pe materia de pe ecran (nimic de continuat după primul test).
  await page.getByRole("button", { name: /Continuă ▶/ }).first().click();
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 60000 });
  await page.getByText(/Întrebarea 1 din/).waitFor({ timeout: 30000 });
  check(await page.getByText("Întrebarea 1 din 15").isVisible(), "S12 „Continuă ▶” pornește testul obișnuit (15 întrebări)");
  const sessionId = new URL(page.url()).pathname.split("/").pop();
  const slug = sql(`SELECT d.slug FROM "Session" s JOIN "Domain" d ON d.id = s."domainId" WHERE s.id = '${sessionId?.replace(/[^a-z0-9]/gi, "")}'`);
  check(slug === "matematica-v-viii", `S12 testul pornit e pe materia de pe ecran (${slug || "necunoscută"})`);

  // S14: cu o lucrare oficială a materiei, pasul apare și duce la lucrările ei.
  sql(`INSERT INTO "ExamPaper" (id, source, "examType", year, "subjectKey", "subjectName", variant, "updatedAt") VALUES ('${PAPER}', 'QA pas13', 'EN_VIII', 2099, 'matematica', 'Matematică', 'qa', now())`);
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
  const step3 = page.getByText("Simulare completă");
  await step3.waitFor({ timeout: 15000 }).catch(() => {});
  check(await step3.isVisible(), "S14 cu o lucrare a materiei, pasul „Simulare completă” apare");
  await step3.click();
  await page.waitForURL(/\/dashboard\/exam-bank\?domain=matematica-v-viii/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  const selected = await page.locator("main select").first().inputValue().catch(() => "");
  check(selected === "EN_VIII::Matematică", `S14 Simulările se deschid pe matematica de clasa a VIII-a (${selected || "nimic ales"})`);
  await page.screenshot({ path: `${OUT}3-simulari.png` });

  // S9: un răspuns de eroare al panoului nu e luat drept date.
  await page.route("**/api/student/dashboard*", (r) => r.fulfill({ status: 500, contentType: "application/json", body: '{"error":"Internal error"}' }));
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}4-eroare-panou.png` });
  check(await page.getByText("Nu am putut încărca panoul.").isVisible(), "S9 la o eroare, panoul spune „Nu am putut încărca panoul.”");
  await page.unroute("**/api/student/dashboard*");
  check(errors.length === 0, `fără erori în pagină${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  sql(`DELETE FROM "ExamPaper" WHERE id = '${PAPER}'`);
  await browser.close();
}
console.log(fail ? `\n${fail} verificări picate` : "\ntoate verificările au trecut");
process.exit(fail ? 1 : 0);
