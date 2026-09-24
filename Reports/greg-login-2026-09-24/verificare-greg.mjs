// Scenariul Greg (24.09.2026), cap-coadă, în browser real, pe stiva QA locală (build de producție :3113
// + baza docker tutor_qa) — niciodată producția.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/greg-login-2026-09-24/verificare-greg.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import crypto from "node:crypto";

const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/greg-login-2026-09-24/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-greg";
const PASS = "parola-greg-1234";
const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };

async function wipe() {
  await prisma.user.deleteMany({ where: { OR: [{ username: { startsWith: TAG } }, { email: { startsWith: `${TAG}-` } }] } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
  await prisma.organization.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

async function signInUi(page, identifier, password) {
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.fill("#email", identifier);
  await page.fill("#password", password);
  await Promise.all([page.waitForLoadState("networkidle"), page.click('form button[type="submit"]')]);
  await page.waitForTimeout(2500);
}

let browser;
try {
  await wipe();
  const stamp = Date.now();
  const user = `${TAG}${String(stamp).slice(-5)}`; // litere mici + cifre, cum cere activarea
  // Ca pe producție: materia aparține unei firme (REAL) și are lecții publicate.
  const org = await prisma.organization.create({ data: { name: "Agenție QA", slug: `${TAG}-org-${stamp}` } });
  const domain = await prisma.domain.create({ data: { name: `Agent imobiliar QA ${stamp}`, slug: `${TAG}-${stamp}`, isActive: true, organizationId: org.id } });
  const lessonTitle = `Lecția 1 QA ${stamp}`;
  await prisma.lesson.create({ data: { domainId: domain.id, subject: "agent-imobiliar", topic: "Introducere", title: lessonTitle, slug: `${TAG}-l1-${stamp}`, content: "# Bun venit\n\nPrima lecție.", isPublished: true } });
  const token = crypto.randomBytes(24).toString("hex");
  await prisma.recipient.create({ data: { domainId: domain.id, firstName: "Grigore", lastName: "QA", phone: "40700000000", token } });
  const admin = await prisma.user.create({ data: { email: `${TAG}-admin-${stamp}@demo.tutor.app`, name: `QA Greg Admin`, password: await bcrypt.hash(PASS, 10), isSuperAdmin: true } });
  const emailUser = await prisma.user.create({ data: { email: `${TAG}-mail-${stamp}@demo.tutor.app`, name: `QA Mail`, password: await bcrypt.hash(PASS, 10) } });

  // 1. Activarea din invitație — exact ce a făcut Greg de pe WhatsApp.
  const act = await fetch(`${BASE}/api/acces/activare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, username: user, password: PASS }) });
  check("activarea invitației creează contul", act.status === 200, `HTTP ${act.status}`);

  browser = await chromium.launch();
  // Telefon, ca Greg.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  const t = await page.getAttribute("#email", "type");
  check("câmpul de intrare nu mai e de tip email", t === "text", `type=${t}`);
  const label = await page.locator('label[for="email"]').innerText();
  check("eticheta spune și „nume de utilizator”", /nume de utilizator/i.test(label), label);
  await page.screenshot({ path: `${SHOTS}/01-intrare.png` });

  // 2. Parola greșită → mesaj clar, rămâne pe pagină.
  await signInUi(page, user, "gresit-gresit");
  const err = await page.locator("text=parolă incorectă").count();
  check("parolă greșită → mesaj de eroare", err > 0 && page.url().includes("/auth/signin"), page.url());

  // 3. Numele cu prima literă mare, cum îl scrie telefonul.
  const typed = user.charAt(0).toUpperCase() + user.slice(1);
  await signInUi(page, typed, PASS);
  check(`intră cu „${typed}” (majusculă la început)`, !page.url().includes("/auth/signin"), page.url());
  await page.goto(`${BASE}/ro/dashboard/lessons`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const sees = await page.locator(`text=${lessonTitle}`).count();
  check("vede lecțiile cursului după intrare", sees > 0);
  await page.screenshot({ path: `${SHOTS}/02-lectii-greg.png`, fullPage: true });
  const trial = await page.locator("text=Proba gratuită").count();
  check("nu primește bannerul de probă de consumator (cursul e plătit de firmă)", trial === 0);
  if (sees > 0) {
    await page.locator(`text=${lessonTitle}`).first().click();
    await page.waitForTimeout(2500);
    const opened = await page.locator("text=Prima lecție").count();
    check("lecția se deschide (nu „face parte dintr-un pachet”)", opened > 0, page.url());
    await page.screenshot({ path: `${SHOTS}/03-lectie-deschisa.png`, fullPage: true });
  }
  await ctx.close();

  // 4. Regresie: contul cu email intră tot cu email.
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await signInUi(p2, emailUser.email, PASS);
  check("contul cu email intră ca înainte", !p2.url().includes("/auth/signin"), p2.url());
  await ctx2.close();

  // 5. Administrare: contul fără email se vede și se caută după numele de utilizator.
  const ctx3 = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p3 = await ctx3.newPage();
  await signInUi(p3, admin.email, PASS);
  await p3.goto(`${BASE}/ro/dashboard/admin/superadmin/users`, { waitUntil: "networkidle" });
  const search = p3.locator('input[type="search"], input[placeholder*="aut" i], input[placeholder*="search" i]').first();
  await search.fill(user);
  await search.press("Enter");
  await p3.waitForTimeout(2500);
  const row = p3.locator("tr", { hasText: "Grigore QA" }).first();
  const rowText = (await row.count()) ? (await row.innerText()).replace(/\s+/g, " ") : "";
  check("căutarea după numele de utilizator găsește contul", rowText.length > 0);
  check("rândul arată „utilizator: …” în loc de email gol", rowText.includes(`utilizator: ${user}`), rowText.slice(0, 160));
  await p3.screenshot({ path: `${SHOTS}/04-administrare.png` });
  await ctx3.close();
} catch (e) {
  console.error(e); results.push(false);
} finally {
  await browser?.close();
  await wipe();
  await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
