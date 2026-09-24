// O lecție nepublicată (ciornă) nu se deschide unui elev, nici știindu-i id-ul; profesorul materiei o vede.
// Stiva QA locală (:3113), niciodată producția.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/vizibilitate-pe-materie-2026-09-24/verificare-ciorne.mjs
import { createRequire } from "node:module";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { request } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-ciorna";
const PASS = "parola-ciorna-1234";
const results = [];
const check = (n, ok, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};

async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
  await prisma.organization.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

async function login(email) {
  const ctx = await request.newContext({ baseURL: BASE });
  const csrf = await (await ctx.get("/api/auth/csrf")).json();
  await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken: csrf.csrfToken, email, password: PASS, callbackUrl: `${BASE}/ro/dashboard` },
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  return ctx;
}

const ctxs = [];
try {
  await wipe();
  const s = Date.now();
  const hash = await bcrypt.hash(PASS, 10);
  // Curs de firmă: accesul la lecții e plătit de firmă, deci poarta de pachet nu stă în cale.
  const org = await prisma.organization.create({ data: { name: "Firmă QA", slug: `${TAG}-org-${s}` } });
  const domain = await prisma.domain.create({ data: { name: `Curs QA ${s}`, slug: `${TAG}-${s}`, isActive: true, organizationId: org.id } });
  const [elev, prof] = await Promise.all(
    ["elev", "prof"].map((n) => prisma.user.create({ data: { email: `${TAG}-${n}-${s}@demo.tutor.app`, name: `${n} QA`, password: hash } }))
  );
  await prisma.enrollment.create({ data: { userId: elev.id, domainId: domain.id, roles: ["STUDENT"], isActive: true } });
  await prisma.enrollment.create({ data: { userId: prof.id, domainId: domain.id, roles: ["INSTRUCTOR"], isActive: true } });
  const mk = (title, isPublished) =>
    prisma.lesson.create({ data: { domainId: domain.id, subject: "qa", topic: "qa", title, slug: `${TAG}-${title}-${s}`, content: "# x", isPublished } });
  const [pub, draft] = await Promise.all([mk("publicata", true), mk("ciorna", false)]);

  const e = await login(elev.email);
  ctxs.push(e);
  const ePub = await e.get(`/api/student/lessons/${pub.id}`);
  check("elevul deschide lecția publicată", ePub.status() === 200, `HTTP ${ePub.status()}`);
  const eDraft = await e.get(`/api/student/lessons/${draft.id}`);
  check("elevul NU deschide ciorna, nici știindu-i id-ul", eDraft.status() === 404, `HTTP ${eDraft.status()}`);

  const p = await login(prof.email);
  ctxs.push(p);
  const pDraft = await p.get(`/api/student/lessons/${draft.id}`);
  check("profesorul materiei vede ciorna", pDraft.status() === 200, `HTTP ${pDraft.status()}`);
} catch (err) {
  console.error(err);
  results.push(false);
} finally {
  for (const c of ctxs) await c.dispose();
  await wipe();
  await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
