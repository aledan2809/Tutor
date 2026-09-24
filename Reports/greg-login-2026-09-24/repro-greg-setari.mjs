// Reproducere: contul lui Greg (invitație → nume de utilizator, apoi email pus pe el) pe un curs de firmă cu
// modul + lecții. Ce vede pe panou și ce se întâmplă la Setări. Stiva QA locală (:3113), niciodată producția.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/greg-login-2026-09-24/repro-greg-setari.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import crypto from "node:crypto";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/greg-login-2026-09-24/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-grepro";
const PASS = "parola-greg-1234";
async function wipe() {
  await prisma.user.deleteMany({ where: { OR: [{ username: { startsWith: TAG } }, { email: { startsWith: `${TAG}-` } }] } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
  await prisma.organization.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}
let browser;
try {
  await wipe();
  const s = Date.now();
  const user = `${TAG}${String(s).slice(-5)}`;
  const org = await prisma.organization.create({ data: { name: "Agenție QA", slug: `${TAG}-org-${s}` } });
  const domain = await prisma.domain.create({ data: { name: `Agent imobiliar QA ${s}`, slug: `${TAG}-${s}`, isActive: true, organizationId: org.id } });
  const course = await prisma.course.create({ data: { domainId: domain.id, title: "Agent imobiliar — formare", slug: `${TAG}-c-${s}`, isPublished: true } });
  for (let i = 1; i <= 2; i++) {
    const m = await prisma.courseModule.create({ data: { courseId: course.id, order: i, title: `Modul ${i}`, questionTopic: `Tema${i}` } });
    await prisma.lesson.create({ data: { domainId: domain.id, subject: "agent-imobiliar", topic: `Tema${i}`, title: `Lecția ${i} QA`, slug: `${TAG}-l${i}-${s}`, content: `# Lecția ${i}`, isPublished: true, moduleId: m.id, order: i } });
  }
  const token = crypto.randomBytes(24).toString("hex");
  await prisma.recipient.create({ data: { domainId: domain.id, firstName: "Grigore", lastName: "Repro", phone: "40700000001", token } });
  const r = await fetch(`${BASE}/api/acces/activare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, username: user, password: PASS }) });
  console.log("activare", r.status);
  await prisma.user.update({ where: { username: user }, data: { email: `${TAG}-${s}@demo.tutor.app` } }); // ca după unire

  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 400)));
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.fill("#email", user); await page.fill("#password", PASS);
  await Promise.all([page.waitForLoadState("networkidle"), page.click('form button[type="submit"]')]);
  await page.waitForTimeout(2500);
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  console.log("PANOU:", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 500));
  await page.screenshot({ path: `${SHOTS}/repro-panou.png`, fullPage: true });
  await page.goto(`${BASE}/ro/dashboard/lessons`, { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
  console.log("LECTII:", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 500));
  await page.screenshot({ path: `${SHOTS}/repro-lectii.png`, fullPage: true });
  const cont = page.getByRole("button", { name: /Continuă/ });
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Continuă/ }).first().click(); await page.waitForTimeout(3000);
  console.log("DUPA CONTINUA:", page.url(), (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 300));
  await page.screenshot({ path: `${SHOTS}/repro-continua.png`, fullPage: true });
  await page.goto(`${BASE}/ro/dashboard/settings`, { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
  console.log("SETARI:", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300));
  await page.screenshot({ path: `${SHOTS}/repro-setari.png`, fullPage: true });
  console.log("ERORI:", JSON.stringify(errors, null, 1));
} catch (e) { console.error(e); }
finally { await browser?.close(); await wipe(); await prisma.$disconnect(); }
