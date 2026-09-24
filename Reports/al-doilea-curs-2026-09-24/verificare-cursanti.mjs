// Pagina „Cursanți” cu o materie care are DOUĂ cursuri: munca de la al doilea curs trebuie să apară.
// Stiva QA locală (build de producție :3113 + baza docker tutor_qa), niciodată producția.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/al-doilea-curs-2026-09-24/verificare-cursanti.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/al-doilea-curs-2026-09-24/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-cursanti";
const PASS = "parola-qa-1234";
const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };
async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}
let browser;
try {
  await wipe();
  const s = Date.now();
  const hash = await bcrypt.hash(PASS, 10);
  const admin = await prisma.user.create({ data: { email: `${TAG}-admin-${s}@demo.tutor.app`, name: "QA Admin", password: hash, isSuperAdmin: true } });
  const learner = await prisma.user.create({ data: { email: `${TAG}-elev-${s}@demo.tutor.app`, name: `Elev Doi Cursuri ${s}`, password: hash } });
  const domain = await prisma.domain.create({ data: { name: `Două cursuri QA ${s}`, slug: `${TAG}-${s}`, isActive: true } });
  await prisma.enrollment.create({ data: { userId: learner.id, domainId: domain.id, roles: ["STUDENT"], isActive: true } });
  const lessons = [];
  for (const [i, title] of ["Primul curs", "Al doilea curs"].entries()) {
    const c = await prisma.course.create({ data: { domainId: domain.id, title, slug: `${TAG}-${s}-${i}`, order: i, isPublished: true } });
    const m = await prisma.courseModule.create({ data: { courseId: c.id, order: 1, title: `Modul ${i + 1}`, questionTopic: `Tema${i}` } });
    lessons.push(await prisma.lesson.create({ data: { domainId: domain.id, subject: "qa", topic: `Tema${i}`, title: `Lecție ${i}`, slug: `${TAG}-${s}-l${i}`, content: "x", isPublished: true, moduleId: m.id } }));
  }
  // Elevul a terminat DOAR lecția din al doilea curs.
  await prisma.lessonProgress.create({ data: { userId: learner.id, lessonId: lessons[1].id, status: "COMPLETED", completedAt: new Date() } });

  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const csrf = await (await ctx.request.get(`${BASE}/api/auth/csrf`)).json();
  await ctx.request.post(`${BASE}/api/auth/callback/credentials`, { form: { csrfToken: csrf.csrfToken, email: admin.email, password: PASS, callbackUrl: `${BASE}/ro/dashboard` }, maxRedirects: 0, failOnStatusCode: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ro/dashboard/admin/cursanti?materie=${domain.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  check("coloana primului curs apare", body.includes("Primul curs · Modul 1"));
  check("coloana celui de-al doilea curs apare", body.includes("Al doilea curs · Modul 2"));
  check("elevul apare pe listă", body.includes(`Elev Doi Cursuri ${s}`));
  await page.screenshot({ path: `${SHOTS}/cursanti-doua-cursuri.png`, fullPage: true });
} catch (e) { console.error(e); results.push(false); }
finally {
  await browser?.close(); await wipe(); await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
