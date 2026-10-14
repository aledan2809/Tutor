// Verificarea pașilor 9, 6 și 11 (lotul 2) pe stiva QA, pe telefon.
//   BASE=http://localhost:3113 node Reports/parinte-copil-2026-10-14/verificare.mjs
// 9: /ro/parinte — „Încearcă 7 zile fără card” primul; /ro/preturi — Family primul, bara fixă jos, părintele logat
//    merge la pachete. 11: părintele își face copilul, „Am notat — alege materiile lui X” deschide capitolul pe
//    materii, panoul arată „Vezi ce face X”. 6: 20 de alerte „nu a reacționat” → o singură cerere și un singur
//    formular; o eroare a listei e spusă ca eroare. Adaugă alerte de probă în baza QA și le șterge la final.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const { chromium, devices } = createRequire(process.cwd() + "/package.json")("playwright");
const BASE = (process.env.BASE || "http://localhost:3113").replace(/\/$/, "");
const OUT = new URL("./capturi/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sql = (q) => execSync(`docker exec tutor-qa-pg psql -U tutor -d tutor_qa -tAc ${JSON.stringify(q)}`).toString().trim();

let fail = 0;
const check = (ok, what) => {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) fail++;
};
const browser = await chromium.launch();
// Fără service worker: cererile prin el ocolesc page.route (erorile simulate).
const ctxOpts = { ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" };
const stamp = Date.now();
let parentId = "";

try {
  // ── Pasul 9, vizitator fără cont ──
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/ro/parinte`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
    const hero = (await page.locator("#parinte-sus a").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    const iFree = hero.findIndex((t) => /Încearcă 7 zile fără card/.test(t));
    const iPay = hero.findIndex((t) => /Începe cu .* lei\/lună/.test(t));
    check(iFree >= 0 && iPay > iFree, `9 /ro/parinte: „Încearcă 7 zile fără card” e primul, plata a doua (${hero.slice(0, 3).join(" | ")})`);
    const free = await page.locator("#parinte-sus a", { hasText: "Încearcă 7 zile fără card" }).first().boundingBox();
    check(free && free.y + free.height <= page.viewportSize().height - 60, "9 /ro/parinte: butonul gratuit e pe primul ecran, deasupra bannerului");
    await page.screenshot({ path: `${OUT}9-parinte.png` });

    await page.goto(`${BASE}/ro/preturi`, { waitUntil: "networkidle" });
    const firstPaid = (await page.locator("main h3").first().textContent())?.trim();
    check(firstPaid === "Părinte + copil", `9 /ro/preturi: Family e primul pachet (${firstPaid})`);
    const bar = page.getByRole("link", { name: "Începe gratuit" }).last();
    const barBox = await bar.boundingBox();
    check(barBox && barBox.y + barBox.height <= page.viewportSize().height, "9 /ro/preturi: bara „Începe gratuit” se vede pe primul ecran, pe telefon");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    const terms = page.locator("footer").getByRole("link", { name: "Termeni" });
    const tBox = await terms.boundingBox();
    const hit = tBox ? await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("footer") !== null, [tBox.x + tBox.width / 2, tBox.y + tBox.height / 2]) : false;
    check(hit, "9 /ro/preturi: la capătul paginii, bara nu acoperă linkurile legale din subsol");
    await page.screenshot({ path: `${OUT}9-preturi.png` });
    await ctx.close();
  }

  // ── Pasul 11, părinte nou ──
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/ro/auth/register`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
  await page.getByRole("radio", { name: "Părinte" }).click();
  const parentEmail = `qa-parinte-${stamp}@qa-parinte.ro`;
  await page.getByPlaceholder("Numele tău").fill("QA Parinte");
  await page.getByPlaceholder("tu@exemplu.ro").fill(parentEmail);
  await page.getByPlaceholder("Minimum 8 caractere").fill("qa-parola-123");
  await page.getByRole("button", { name: "Creează cont" }).click();
  await page.waitForURL((u) => /\/dashboard\/?$/.test(u.pathname), { timeout: 60000 });
  parentId = sql(`SELECT id FROM "User" WHERE email = '${parentEmail}'`);
  await page.waitForLoadState("networkidle");
  check(await page.getByText("Leagă contul copilului").isVisible(), "11 fără copil: panoul cere legarea copilului");

  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Adaugă copil" }).click();
  await page.getByRole("button", { name: "Creează contul direct" }).click();
  await page.getByPlaceholder("Numele copilului").fill("Ilinca Test");
  await page.getByPlaceholder("Nume de utilizator (ex. ana.pop)").fill(`ilinca.qa${String(stamp).slice(-6)}`);
  await page.getByPlaceholder("Parolă (min. 8 caractere)").fill("qa-copil-123");
  await page.getByRole("button", { name: "Creează contul copilului" }).click();
  const next = page.getByRole("link", { name: /Am notat — alege materiile lui Ilinca/ });
  await next.waitFor({ timeout: 30000 }).catch(() => {});
  check(await next.isVisible(), "11 după crearea copilului: „Am notat — alege materiile lui Ilinca →”");
  await page.screenshot({ path: `${OUT}11-copil-creat.png` });
  if (await next.isVisible()) {
    await next.click();
    await page.waitForURL(/\/dashboard\/watcher\?child=/, { timeout: 30000 });
    await page.getByText("Materii", { exact: true }).waitFor({ timeout: 30000 }).catch(() => {});
    check(new URL(page.url()).pathname.endsWith("/dashboard/watcher"), "11 „Copiii mei” se deschide pentru părinte, deși copilul n-are materie");
    check(await page.getByText("Fără materie încă").isVisible(), "11 copilul fără materie apare în listă");
    check(await page.getByText("Materii", { exact: true }).isVisible(), "11 capitolul copilului se deschide pe alegerea materiilor");
    const subjectsY = (await page.getByText("Materii", { exact: true }).boundingBox())?.y ?? Infinity;
    const remindersY = (await page.getByRole("button", { name: /Adaugă reminder/ }).first().boundingBox())?.y ?? -Infinity;
    check(subjectsY < remindersY, "11 la un copil fără materie, „Materii” e deasupra reminderelor");
    check((await page.getByText("Rapoarte programate").count()) === 0, "11 fără materie, panoul „Rapoarte programate” nu apare (ar răspunde „Forbidden”)");
    // Prima materie: capitolul o arată imediat, fără reîncărcare.
    await page.locator("select", { hasText: "Alege o materie" }).selectOption({ label: "Matematica cl. VIII" }).catch(() => {});
    await page.getByRole("button", { name: "Adaugă materia" }).click().catch(() => {});
    await page.getByText("Fără materie încă").waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
    check((await page.getByText("Fără materie încă").count()) === 0, "11 după prima materie, capitolul nu mai spune „Fără materie încă”");
    await page.screenshot({ path: `${OUT}11-dupa-prima-materie.png` });
    await page.screenshot({ path: `${OUT}11-capitol-materii.png`, fullPage: true });
  }

  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
  check(await page.getByText("Vezi ce face Ilinca Test").isVisible(), "11 panoul arată „Vezi ce face Ilinca Test →”");
  check((await page.getByText("Leagă contul copilului").count()) === 0, "11 panoul nu mai cere legarea copilului");
  check((await page.getByRole("button", { name: /Continuă ▶/ }).count()) === 0, "11 părintele nu primește panoul de elev (fără „Continuă ▶”, care i-ar porni un test lui)");
  await page.screenshot({ path: `${OUT}11-panou.png` });

  // ── Pasul 9, părinte logat pe /ro/preturi ──
  await page.goto(`${BASE}/ro/preturi`, { waitUntil: "networkidle" });
  const familyHref = await page.getByRole("link", { name: "Alege Family" }).first().getAttribute("href");
  check(/\/dashboard\/packages\?plan=FAMILY/.test(familyHref ?? ""), `9 logat: „Alege Family” duce la pachete (${familyHref})`);

  // ── Pasul 6: multe alerte, o singură cerere și un singur formular ──
  const childId = sql(`SELECT "childId" FROM "Guardian" WHERE "parentId" = '${parentId}' LIMIT 1`);
  const values = Array.from({ length: 20 }, (_, i) =>
    `('qa-alert-${stamp}-${i}', '${parentId}', 'parent_alert', 'Nu a reacționat la reminder', 'Probă', false, '{"alertType":"no_reaction","childId":"${childId}"}'::jsonb, now() - interval '${i} minutes')`,
  ).join(",");
  sql(`INSERT INTO "Notification" (id, "userId", type, title, message, "isRead", metadata, "createdAt") VALUES ${values}`);
  let targetCalls = 0;
  const count = (r) => r.url().includes("/nudge-targets") && targetCalls++;
  page.on("request", count);
  await page.goto(`${BASE}/ro/dashboard/watcher/notifications`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  page.off("request", count);
  const forms = await page.getByText("Nu a reacționat la reminder").count();
  check(forms >= 20, `6 apar cele 20 de alerte (${forms})`);
  check(targetCalls === 1, `6 o singură cerere pentru datele copilului (${targetCalls})`);
  await page.screenshot({ path: `${OUT}6-notificari.png` });

  await page.route("**/api/notifications?audience=child", (r) => r.fulfill({ status: 429, contentType: "application/json", body: '{"error":"Too many requests"}' }));
  await page.goto(`${BASE}/ro/dashboard/watcher/notifications`, { waitUntil: "networkidle" });
  check(await page.getByText("Nu am putut încărca acum").isVisible(), "6 o eroare a notificărilor e spusă ca eroare, cu „Încearcă din nou”");
  await page.unroute("**/api/notifications?audience=child");
  await page.route("**/api/dashboard/watcher", (r) => r.fulfill({ status: 429, contentType: "application/json", body: '{"error":"Too many requests"}' }));
  await page.goto(`${BASE}/ro/dashboard/watcher`, { waitUntil: "networkidle" });
  check(await page.getByText("Nu am putut încărca acum").isVisible() && (await page.getByText("Niciun student de monitorizat").count()) === 0,
    "6 o eroare la „Copiii mei” nu mai apare drept „Niciun student de monitorizat”");
  await page.unroute("**/api/dashboard/watcher");
  check(errors.length === 0, `fără erori în pagină${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await ctx.close();
} finally {
  if (parentId) sql(`DELETE FROM "Notification" WHERE id LIKE 'qa-alert-${stamp}-%'`);
  await browser.close();
}
console.log(fail ? `\n${fail} verificări picate` : "\ntoate verificările au trecut");
process.exit(fail ? 1 : 0);
