// Pagina de decizie (unde duce „Decide acum”): întrebarea, toate variantele, marcata ✓ și sugerata 💡.
// Stiva QA locală (:3113), niciodată producția.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/feedback-a-doua-opinie-2026-09-24/verificare-pagina-decizie.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/feedback-a-doua-opinie-2026-09-24/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-decizie";
const PASS = "parola-decizie-1234";
const results = [];
const check = (n, ok, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};
async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

let browser;
try {
  await wipe();
  const s = Date.now();
  const hash = await bcrypt.hash(PASS, 10);
  const admin = await prisma.user.create({ data: { email: `${TAG}-admin-${s}@demo.tutor.app`, name: "Admin QA", password: hash, isSuperAdmin: true } });
  const elev = await prisma.user.create({ data: { email: `${TAG}-elev-${s}@demo.tutor.app`, name: "Rareș QA" } });
  const domain = await prisma.domain.create({ data: { name: `Fizică QA ${s}`, slug: `${TAG}-${s}`, isActive: true, visibility: "PUBLIC" } });
  const q = await prisma.question.create({ data: {
    domainId: domain.id, subject: "fizica", topic: "energie", status: "PUBLISHED",
    content: "Un corp cu masa de 2 kg se mișcă cu viteza de 3 m/s. Care este energia sa cinetică?",
    options: ["9 J", "9 kJ", "6 J", "18 J"], correctAnswer: "9 kJ", explanation: "Ec = m·v²/2",
  } });
  const fb = await prisma.questionFeedback.create({ data: {
    questionId: q.id, userId: elev.id, rating: "down", comment: "Răspunsul corect e 9 J, nu 9 kJ",
    status: "pending_review", reviewAction: "flagged",
    resolution: "Verificatorii nu sunt de acord: primul a respins reclamația, al doilea a găsit o problemă.",
    secondOpinion: "disagrees", secondOpinionNote: "A doua verificare, independentă, a găsit o problemă: wrong-answer.",
    secondOpinionAnswer: "9 J", secondOpinionAt: new Date(),
  } });

  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.fill("#email", admin.email);
  await page.fill("#password", PASS);
  await Promise.all([page.waitForLoadState("networkidle"), page.click('form button[type="submit"]')]);
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/ro/dashboard/admin/feedback?id=${fb.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  check("întrebarea întreagă e pe pagină", body.includes("Care este energia sa cinetică?"));
  check("toate cele 4 variante", ["9 J", "9 kJ", "6 J", "18 J"].every((o) => body.includes(o)));
  check("varianta marcată e arătată ca „marcat corect”", /9 kJ\s*marcat corect/.test(body));
  check("varianta sugerată e arătată ca „sugerat de a doua verificare”", /9 J\s*💡 sugerat de a doua verificare/.test(body));
  await page.screenshot({ path: `${SHOTS}/pagina-decizie.png`, fullPage: true });
} catch (e) {
  console.error(e);
  results.push(false);
} finally {
  await browser?.close();
  await wipe();
  await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
