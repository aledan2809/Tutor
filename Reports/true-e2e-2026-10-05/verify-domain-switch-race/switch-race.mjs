// Verifică: după comutarea materiei pe dashboard pleacă o a doua cerere FĂRĂ domainId?
import { createRequire } from "node:module";
const req = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = createRequire("/Users/danciulescu/Projects/Tester-Gateway/package.json")("playwright");
const { PrismaClient } = require_("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require_("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");
function require_(p) { return req(p); }
const DB = "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa";
const BASE = "http://localhost:3113";
const prisma = new PrismaClient({ datasources: { db: { url: DB } } });
const email = "qa-e2e-1005-switch@demo.tutor.app", pw = "QaSwitch!2026";
const A = "cmu5hx3a300004zc28hilbxt9", B = "cmu5hx3a500014zc2lf4e8ype";
const OUT = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/verify-domain-switch-race";
try {
  await prisma.user.deleteMany({ where: { email } });
  const u = await prisma.user.create({ data: { email, name: "qa-e2e-1005-switch", password: await bcrypt.hash(pw, 10), emailVerified: new Date(), accountRole: "STUDENT", locale: "ro", freeForever: true, birthDate: new Date("2000-01-01"), birthYear: 2000,
    enrollments: { create: [{ domainId: A, roles: ["STUDENT"], updatedAt: new Date() }, { domainId: B, roles: ["STUDENT"], updatedAt: new Date() }] } } });
  // login prin API -> cookie jar
  const jar = new Map();
  const store = (r) => { for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar.set(kv.slice(0, i), kv.slice(i + 1)); } };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const c = await fetch(`${BASE}/api/auth/csrf`); store(c); const { csrfToken } = await c.json();
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie() }, body: new URLSearchParams({ csrfToken, email, password: pw, callbackUrl: `${BASE}/ro/dashboard` }) });
  store(r);
  const s = await (await fetch(`${BASE}/api/auth/session`, { headers: { cookie: cookie() } })).json();
  console.log("login:", s?.user?.email);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([...jar].map(([name, value]) => ({ name, value, domain: "localhost", path: "/" })));
  const page = await ctx.newPage();
  const log = [];
  page.on("request", (rq) => { if (rq.url().includes("/api/student/dashboard")) log.push({ t: Date.now(), ev: "req", url: rq.url().replace(BASE, "") }); });
  page.on("response", (rs) => { if (rs.url().includes("/api/student/dashboard")) log.push({ t: Date.now(), ev: "res", url: rs.url().replace(BASE, "") }); });
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
  const initial = log.slice(); log.length = 0;
  console.log("INITIAL LOAD:", initial.map((l) => `${l.ev} ${l.url}`).join(" | "));
  await page.screenshot({ path: `${OUT}/01-initial.png` });
  // comutare materie: deschide selectorul și alege materia B
  const btn = page.locator("button", { hasText: /QA DIAG mate/ }).first();
  await btn.click();
  await page.locator("button, [role=menuitem], li", { hasText: /QA DIAG romana/ }).first().click();
  await page.waitForTimeout(2500);
  console.log("AFTER SWITCH:", log.map((l) => `${l.ev} ${l.url}`).join(" | "));
  await page.screenshot({ path: `${OUT}/02-after-switch.png` });
  const hero = await page.locator("h1, h2").allInnerTexts();
  console.log("headings:", hero.slice(0, 6));
  await browser.close();
} finally {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
}
