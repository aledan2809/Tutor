// Verificare: părinte (PARENT) cu copil legat — ce vede pe /dashboard? QA stack only.
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium, devices } = require("playwright");
const BASE = "http://localhost:3113";
const DIR = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/verif-parent-home";
const MAIL = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/mailbox";
const S = Date.now().toString().slice(-6);
const PARENT = process.env.PARENT_EMAIL;
const PASS = "ParolaTest-1005!";
const out = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
const page = await ctx.newPage();
let n = 0;
const shot = async (name) => { n++; await page.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-${name}.png`, fullPage: true }); };
try {
  const before = new Set(readdirSync(MAIL));
  const r = { status: () => "skipped(seeded in QA DB)", text: async () => "" };
  out.push(`register: ${r.status()} ${(await r.text()).slice(0,200)}`);
  // verification link from fake mailbox
  let link = null;
  for (let i = 0; i < 20 && !link; i++) {
    await new Promise((s) => setTimeout(s, 1000));
    for (const f of readdirSync(MAIL)) {
      if (before.has(f)) continue;
      try { const m = JSON.parse(readFileSync(`${MAIL}/${f}`, "utf8")); if ((m.to||"").includes(PARENT)) { link = (m.links||[]).find((l) => /verif|token|callback/i.test(l)) || (m.links||[])[0]; out.push(`mail: ${m.subject} links=${JSON.stringify(m.links)}`); } } catch {}
    }
  }
  if (link) { await page.goto(link.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" }); out.push(`verify page: ${page.url()}`); }
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await page.fill("#email", PARENT); await page.fill("#password", PASS);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL((u) => u.pathname.includes("/dashboard"), { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(2000);
  out.push(`after login: ${page.url()}`);
  await shot("parinte-home-fara-copil");
  out.push(`home(no child) text: ${(await page.locator("main").innerText().catch(()=>"")).replace(/\s+/g," ").slice(0,400)}`);
  // create child via API (as the family form does: no domainSlugs)
  const c = await ctx.request.post(`${BASE}/api/dashboard/family/direct`, { data: { name: "Copil Verif", username: `qae2e1005copil${S}`, password: PASS } });
  out.push(`create child: ${c.status()} ${(await c.text()).slice(0,200)}`);
  // what the family page shows after creation (UI path)
  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  await shot("familia-mea-cu-copil");
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
  await shot("parinte-home-cu-copil");
  const main = (await page.locator("main").innerText().catch(()=>"")).replace(/\s+/g," ");
  out.push(`home(with child) text: ${main.slice(0,500)}`);
  out.push(`card „Leagă contul copilului” vizibil cu copil legat: ${/Leagă contul copilului/.test(main) ? "DA" : "NU"}`);
  out.push(`numele copilului apare pe home: ${/Copil Verif/.test(main) ? "DA" : "NU"}`);
  // the UI post-creation panel: open form in family page and create 2nd child via UI to see the "done" panel
  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  const add = page.locator("button", { hasText: /Adaugă copil/ }).first();
  if (await add.count()) {
    await add.click(); await page.waitForTimeout(800);
    const direct = page.locator("button", { hasText: /Creează contul direct|Creezi tu contul/ }).first();
    if (await direct.count()) await direct.click();
    await page.waitForTimeout(600);
    await page.getByPlaceholder("Numele copilului").fill("Copil Doi Verif");
    const pw = page.locator("input[type=password], input[placeholder*=Parol]").first(); await pw.fill(PASS);
    await page.locator("button", { hasText: /Creează contul copilului/ }).first().click();
    await page.waitForTimeout(3000);
    await shot("panou-cont-copil-gata");
    const panel = (await page.locator("main").innerText().catch(()=>"")).replace(/\s+/g," ");
    out.push(`panou post-creare: ${panel.slice(panel.indexOf("Contul copilului"), panel.indexOf("Contul copilului")+600)}`);
    out.push(`butoane în panou: ${JSON.stringify(await page.locator("main button").allInnerTexts())}`);
  } else out.push("buton Adaugă copil: lipsă (seat?)");
} catch (e) { out.push(`EROARE ${String(e).slice(0,300)}`); } finally {
  out.push(`PARENT=${PARENT}`); console.log(out.join("\n")); await browser.close();
}
