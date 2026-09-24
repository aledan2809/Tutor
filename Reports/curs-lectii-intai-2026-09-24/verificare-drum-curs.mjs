// Drumul unui om înscris de firmă la un curs, cap-coadă în browser real (telefon), pe stiva QA locală (:3113):
// panoul arată lecția → o citește → panoul arată testul → testul pornește → panoul trece la lecția 2.
// Plus: pagina de Grile trimite la lecție când poarta refuză; comutarea materiei pe panou (id cuid) merge.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/curs-lectii-intai-2026-09-24/verificare-drum-curs.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import crypto from "node:crypto";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/curs-lectii-intai-2026-09-24/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-drum";
const PASS = "parola-drum-1234";
const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };
async function wipe() {
  await prisma.user.deleteMany({ where: { OR: [{ username: { startsWith: TAG } }, { email: { startsWith: `${TAG}-` } }] } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
  await prisma.organization.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}
const mainText = async (page) => (await page.locator("main").innerText()).replace(/\s+/g, " ");
let browser;
try {
  await wipe();
  const s = Date.now();
  const user = `${TAG}${String(s).slice(-5)}`;
  const org = await prisma.organization.create({ data: { name: "Agenție QA", slug: `${TAG}-org-${s}` } });
  const domain = await prisma.domain.create({ data: { name: `Agent imobiliar QA ${s}`, slug: `${TAG}-${s}`, isActive: true, organizationId: org.id } });
  const course = await prisma.course.create({ data: { domainId: domain.id, title: "Formare", slug: `${TAG}-c-${s}`, isPublished: true } });
  const lessons = [];
  for (let i = 1; i <= 2; i++) {
    const m = await prisma.courseModule.create({ data: { courseId: course.id, order: i, title: `Modulul QA ${i}`, questionTopic: `Tema${i}` } });
    lessons.push(await prisma.lesson.create({ data: { domainId: domain.id, subject: "agent-imobiliar", topic: `Tema${i}`, title: `Lecția QA ${i}: titlu lung ca pe producție`, slug: `${TAG}-l${i}-${s}`, content: `# Lecția ${i}\n\nText.`, isPublished: true, moduleId: m.id, order: i } }));
    for (let q = 0; q < 6; q++) {
      await prisma.question.create({ data: { domainId: domain.id, subject: "agent-imobiliar", topic: `Tema${i}`, content: `Întrebarea ${i}.${q}?`, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }], correctAnswer: "A", status: "PUBLISHED" } }).catch((e) => { throw new Error("question create: " + e.message.slice(-300)); });
    }
  }
  const token = crypto.randomBytes(24).toString("hex");
  await prisma.recipient.create({ data: { domainId: domain.id, firstName: "Grigore", lastName: "Drum", phone: "40700000002", token } });
  const act = await fetch(`${BASE}/api/acces/activare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, username: user, password: PASS }) });
  check("activare", act.status === 200, `HTTP ${act.status}`);

  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.fill("#email", user); await page.fill("#password", PASS);
  await Promise.all([page.waitForLoadState("networkidle"), page.click('form button[type="submit"]')]);
  await page.waitForTimeout(2000);

  // 1. Panoul: lecția întâi.
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  let txt = await mainText(page);
  check("panoul arată „Lecția 1 din 2” + titlul lecției", txt.includes("Lecția 1 din 2") && txt.includes("Lecția QA 1"), txt.slice(0, 160));
  check("panoul NU mai propune „sesiune scurtă de grile”", !txt.includes("sesiune scurtă de grile"));
  check("progres curs 0 din 2", txt.includes("Progres curs: 0 din 2 module"));
  await page.screenshot({ path: `${SHOTS}/01-panou-lectia-1.png`, fullPage: true });

  // 2. Grile înainte de lectură: poarta refuză și dă butonul spre lecție.
  await page.goto(`${BASE}/ro/dashboard/practice?start=quick&domain=${domain.slug}`, { waitUntil: "networkidle" }); await page.waitForTimeout(3000);
  const gateBtn = page.getByRole("button", { name: /Deschide lecția/ });
  check("Grile fără lectură → mesaj + buton „Deschide lecția”", (await gateBtn.count()) > 0, (await mainText(page)).slice(0, 160));
  await page.screenshot({ path: `${SHOTS}/02-grile-poarta.png`, fullPage: true });
  if (await gateBtn.count()) {
    await gateBtn.first().click(); await page.waitForTimeout(2000);
    check("butonul duce la lecția 1", page.url().includes(`/lessons/${lessons[0].id}`), page.url());
  }

  // 3. Din panou, butonul mare deschide lecția; o terminăm (API-ul cititorului).
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Începe lecția/ }).first().click(); await page.waitForTimeout(2000);
  check("„Începe lecția” deschide lecția 1", page.url().includes(`/lessons/${lessons[0].id}`), page.url());
  const done = await page.request.patch(`${BASE}/api/student/lessons/${lessons[0].id}`, { data: { progress: 100 } });
  check("lecția 1 marcată citită", done.ok(), `HTTP ${done.status()}`);

  // 4. Panoul trece la testul modulului 1, iar testul chiar pornește.
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  txt = await mainText(page);
  check("după lectură: „Testul modulului 1 din 2”", txt.includes("Testul modulului 1 din 2"), txt.slice(0, 160));
  await page.screenshot({ path: `${SHOTS}/03-panou-test-1.png`, fullPage: true });
  await page.getByRole("button", { name: /Începe testul/ }).first().click();
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 20000 }).catch(() => {});
  check("„Începe testul” pornește o sesiune de grile", /\/dashboard\/practice\/[^/?]+$/.test(page.url()), page.url());
  await page.screenshot({ path: `${SHOTS}/04-test-pornit.png`, fullPage: true });
  // Testul modulului 1 conține DOAR întrebări din subiectul modulului 1 (ce a primit browserul la pornire).
  const sid = page.url().split("/").pop();
  const stored = await page.evaluate((k) => localStorage.getItem(k), `session_${sid}`);
  const qids = (JSON.parse(stored || "{}").questions || []).map((q) => q.id).filter(Boolean);
  const qs = await prisma.question.findMany({ where: { id: { in: qids } }, select: { topic: true } });
  check("testul modulului 1 are doar întrebări din Tema1", qs.length > 0 && qs.every((q) => q.topic === "Tema1"), `${qs.length} întrebări: ${[...new Set(qs.map((q) => q.topic))].join(",")}`);
  const sess = await prisma.session.findFirst({ where: { userId: (await prisma.user.findUnique({ where: { username: user } })).id }, orderBy: { startedAt: "desc" }, include: { attempts: true } });
  // Un răspuns la testul modulului 1.
  const q1 = await prisma.question.findFirst({ where: { domainId: domain.id, topic: "Tema1" } });
  await prisma.attempt.create({ data: { userId: sess.userId, sessionId: sess.id, questionId: q1.id, isCorrect: true, answer: "0" } }).catch((e) => { throw new Error("attempt: " + e.message.slice(-300)); });

  // 5. Panoul trece la lecția 2.
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  txt = await mainText(page);
  check("după test: „Lecția 2 din 2”, progres 1 din 2", txt.includes("Lecția 2 din 2") && txt.includes("Progres curs: 1 din 2 module"), txt.slice(0, 200));
  await page.screenshot({ path: `${SHOTS}/05-panou-lectia-2.png`, fullPage: true });

  // 5b. Lecția 2 citită → testul modulului 2. Acum AMBELE teme sunt deschise, deci proba contează:
  // testul trebuie să conțină doar Tema2, nu un amestec cu recapitulări din modulul 1.
  const done2 = await page.request.patch(`${BASE}/api/student/lessons/${lessons[1].id}`, { data: { progress: 100 } });
  check("lecția 2 marcată citită", done2.ok(), `HTTP ${done2.status()}`);
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  txt = await mainText(page);
  check("panoul: „Testul modulului 2 din 2”", txt.includes("Testul modulului 2 din 2"), txt.slice(0, 160));
  await page.getByRole("button", { name: /Începe testul/ }).first().click();
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 20000 }).catch(() => {});
  const sid2 = page.url().split("/").pop();
  const st2 = await page.evaluate((k) => localStorage.getItem(k), `session_${sid2}`);
  const q2ids = (JSON.parse(st2 || "{}").questions || []).map((q) => q.id).filter(Boolean);
  const q2 = await prisma.question.findMany({ where: { id: { in: q2ids } }, select: { topic: true } });
  check("testul modulului 2 are DOAR întrebări din Tema2 (deși Tema1 e și ea deschisă)", q2.length > 0 && q2.every((q) => q.topic === "Tema2"), `${q2.length} întrebări: ${[...new Set(q2.map((q) => q.topic))].join(",")}`);

  // 6. Comutarea materiei pe panou (id cuid) nu mai dă 400.
  const r = await page.request.get(`${BASE}/api/student/dashboard?domainId=${domain.id}`);
  check("panou cu ?domainId=<cuid> → 200", r.status() === 200, `HTTP ${r.status()}`);
  check("fără erori în pagină", errs.length === 0, errs.join(" | "));
} catch (e) { console.error(e); results.push(false); }
finally {
  await browser?.close(); await wipe(); await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
