// The three presence columns as the superadmin sees them, in a real browser, on the local QA stack
// (production build on :3113 + docker QA database) — never production.
//
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/prezenta-conturi-2026-09-23/verificare-tabel.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/prezenta-conturi-2026-09-23/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });

const TAG = "qa-prez";
const PASSWORD = "parola-qa-1234";
const MIN = 60_000;
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  const shown = typeof detail === "string" ? detail : JSON.stringify(detail);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${shown ? `  — ${shown}` : ""}`);
};

async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  // Test database only: each run must start its own measurement, so the remembered start goes too.
  await prisma.setting.deleteMany({ where: { key: "presence.trackingStartedAt" } });
  await prisma.question.deleteMany({ where: { subject: TAG } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

async function login(ctx, email) {
  const csrf = await (await ctx.request.get(`${BASE}/api/auth/csrf`)).json();
  await ctx.request.post(`${BASE}/api/auth/callback/credentials`, {
    form: { csrfToken: csrf.csrfToken, email, password: PASSWORD, callbackUrl: `${BASE}/ro/dashboard` },
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  return (await ctx.cookies()).some((c) => c.name.includes("session-token"));
}

/** The row of the table that contains this name, as plain text. */
async function rowText(page, name) {
  const row = page.locator("tr", { hasText: name }).first();
  await row.waitFor({ timeout: 15000 });
  return (await row.innerText()).replace(/\s+/g, " ");
}

let browser;
try {
  await wipe();
  const stamp = Date.now();
  const hash = await bcrypt.hash(PASSWORD, 10);

  const domain = await prisma.domain.create({
    data: { name: `Aviație QA ${stamp}`, slug: `${TAG}-${stamp}`, isActive: true },
  });
  const question = await prisma.question.create({
    data: {
      domainId: domain.id,
      subject: TAG,
      topic: "prezență",
      content: "Întrebare de verificare",
      correctAnswer: "A",
      status: "PUBLISHED",
    },
  });

  const admin = await prisma.user.create({
    data: { email: `${TAG}-admin-${stamp}@demo.tutor.app`, name: `QA Prez Admin ${stamp}`, password: hash, isSuperAdmin: true },
  });
  // The account that studied: one stay measured now, plus older activity to be rebuilt.
  const activeName = `QA Prez Harnic ${stamp}`;
  const active = await prisma.user.create({
    data: { email: `${TAG}-harnic-${stamp}@demo.tutor.app`, name: activeName, password: hash, lastLoginAt: new Date(Date.now() - 2 * 60 * MIN) },
  });
  // The account nobody has touched — its cells must read zero, not a hole.
  const idleName = `QA Prez Nou ${stamp}`;
  const idle = await prisma.user.create({
    data: { email: `${TAG}-nou-${stamp}@demo.tutor.app`, name: idleName, password: hash },
  });

  const visitStart = new Date(Date.now() - 40 * MIN);
  await prisma.userVisit.create({
    data: { userId: active.id, startedAt: visitStart, lastSeenAt: new Date(Date.now() - 18 * MIN), pings: 20 },
  });
  const session = await prisma.session.create({ data: { userId: active.id, domainId: domain.id, type: "practice" } });
  // Before the measured stay (so it is rebuilt): a stay of ~15 min three days ago.
  for (const minsAgo of [3 * 24 * 60, 3 * 24 * 60 - 7, 3 * 24 * 60 - 15]) {
    await prisma.attempt.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        userId: active.id,
        answer: "A",
        isCorrect: true,
        createdAt: new Date(Date.now() - minsAgo * MIN),
      },
    });
  }

  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  check("autentificare ca superadmin", await login(ctx, admin.email));

  const page = await ctx.newPage();
  await page.goto(`${BASE}/ro/dashboard/admin/superadmin/users`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByText("Ultima conectare").first().waitFor({ timeout: 30000 });
  const head = (await page.locator("thead").first().innerText()).replace(/\s+/g, " ");
  check(
    "tabelul are cele trei coloane noi",
    head.includes("Ultima conectare") && head.includes("Vizite") && head.includes("Timp petrecut"),
    head,
  );

  // The page carries the presence signal itself: simply opening it must open a stay for the account
  // looking at it. This is checked before the test plants any visit, so nothing else can explain it.
  const adminVisits = await prisma.userVisit.count({ where: { userId: admin.id } });
  check(
    "simpla deschidere a paginii deschide o ședere pentru contul logat (semnalul e viu în pagină)",
    adminVisits >= 1,
    { vizite: adminVisits },
  );

  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  check(
    "filtrul de perioadă e acolo, cu 7 zile pe implicit",
    body.includes("Perioada:") && body.includes("Azi") && body.includes("7 zile") && body.includes("30 de zile"),
  );

  // ── the account that studied ──
  const active7 = await rowText(page, activeName);
  const visits7 = active7.match(/(\d+)\s*~?\d*\s*min pe vizită/) || active7.match(/≈?\s*(\d+)/);
  check(
    "contul harnic: 2 vizite în 7 zile (una măsurată + una refăcută) și timp nenul",
    /≈ 2\b/.test(active7) && /min/.test(active7),
    active7.slice(0, 220),
  );
  check(
    "sub ultima conectare scrie materia pe care a lucrat",
    active7.includes(`pe ${domain.name}`),
    active7.includes("pe ") ? active7.slice(active7.indexOf("pe ")).slice(0, 60) : "(lipsă)",
  );
  check(
    "perioada cu zile dinainte de măsurare e marcată ca estimare",
    body.includes("am început să măsurăm"),
  );

  // ── the untouched account ──
  const idle7 = await rowText(page, idleName);
  check(
    "contul neatins: spune ce nu știe („niciodată” sau „nicio conectare din…”), fără materie și fără vizite",
    (idle7.includes("niciodată") || idle7.includes("nicio conectare")) &&
      (idle7.includes("nicio vizită") || idle7.includes("fără urme")) &&
      idle7.includes("fără materie"),
    idle7.slice(0, 220),
  );

  await page.screenshot({ path: `${SHOTS}/tabel-7-zile.png`, fullPage: false });

  // ── switching the period changes only these columns ──
  await page.getByRole("button", { name: "Azi", exact: true }).click();
  await page.waitForTimeout(2500);
  const active1 = await rowText(page, activeName);
  check(
    "pe „Azi” rămâne doar șederea măsurată de azi, fără cea de acum trei zile",
    /≈ 1\b/.test(active1) && !/≈ 2\b/.test(active1),
    active1.slice(0, 200),
  );

  await page.getByRole("button", { name: "30 de zile", exact: true }).click();
  await page.waitForTimeout(2500);
  const active30 = await rowText(page, activeName);
  check("pe „30 de zile” cifrele nu scad sub cele de pe 7 zile", /≈ 2\b/.test(active30), active30.slice(0, 160));
  await page.screenshot({ path: `${SHOTS}/tabel-azi-30.png`, fullPage: false });

  // Once recording is older than the window, nothing is rebuilt and the „≈" must disappear: here by
  // planting a stay from a month ago, which is what prod will look like in a week.
  await prisma.setting.updateMany({
    where: { key: "presence.trackingStartedAt" },
    data: { value: new Date(Date.now() - 31 * 24 * 60 * MIN).toISOString() },
  });
  await page.getByRole("button", { name: "Azi", exact: true }).click();
  await page.waitForTimeout(2500);
  const measuredOnly = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  const active1b = await rowText(page, activeName);
  check(
    "cu măsurarea pornită de o lună, „Azi” nu mai e estimare: fără „≈” și fără nota de sus",
    !measuredOnly.includes("am început să măsurăm") && !active1b.includes("≈") && /\b1\b/.test(active1b),
    active1b.slice(0, 160),
  );

  // ── the route itself: it answers, and a signal repeated at once adds no second stay ──
  const before = await prisma.userVisit.count({ where: { userId: admin.id } });
  const ping = await ctx.request.post(`${BASE}/api/presence/ping`);
  const afterPing = await prisma.userVisit.count({ where: { userId: admin.id } });
  check(
    "ruta semnalului răspunde, iar un semnal imediat după altul nu inventează o ședere nouă",
    ping.status() === 204 && afterPing === before,
    { status: ping.status(), înainte: before, după: afterPing },
  );

  const anon = await browser.newContext();
  const anonPing = await anon.request.post(`${BASE}/api/presence/ping`, { failOnStatusCode: false });
  check("fără cont, semnalul e refuzat (nu se pot scrie prezențe străine)", anonPing.status() === 401, String(anonPing.status()));
  await anon.close();

  // ── the sign-in stamp is written by signing in ──
  const fresh = await browser.newContext();
  const beforeLogin = (await prisma.user.findUnique({ where: { id: idle.id }, select: { lastLoginAt: true } }))?.lastLoginAt;
  await login(fresh, idle.email);
  const afterLogin = (await prisma.user.findUnique({ where: { id: idle.id }, select: { lastLoginAt: true } }))?.lastLoginAt;
  check(
    "autentificarea scrie ora ultimei conectări (era goală, acum e acum)",
    beforeLogin === null && afterLogin !== null && Date.now() - afterLogin.getTime() < 120_000,
    { înainte: beforeLogin, după: afterLogin?.toISOString() },
  );
  await fresh.close();
} catch (e) {
  check(`eroare neprevăzută: ${e?.message || e}`, false);
} finally {
  if (browser) await browser.close();
  await wipe();
  await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} PASS`);
  process.exit(ok === results.length ? 0 : 1);
}
