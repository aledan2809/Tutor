// Rutele de profesor: un profesor care predă DOAR materia A încearcă să ajungă la un elev al materiei B.
// Stiva QA locală (:3113), niciodată producția.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/vizibilitate-pe-materie-2026-09-24/verificare-profesor.mjs
import { createRequire } from "node:module";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { request } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-prof";
const PASS = "parola-prof-1234";
const results = [];
const check = (n, ok, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};

async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

let ctx;
try {
  await wipe();
  const s = Date.now();
  const hash = await bcrypt.hash(PASS, 10);
  const mk = (n) =>
    prisma.user.create({ data: { email: `${TAG}-${n}-${s}@demo.tutor.app`, name: `${n} QA`, password: hash, freeForever: true } });
  const [prof, sa, sb] = await Promise.all(["prof", "elev-a", "elev-b"].map(mk));
  const [A, B] = await Promise.all(
    ["A", "B"].map((d) => prisma.domain.create({ data: { name: `Materia ${d} QA`, slug: `${TAG}-${d.toLowerCase()}-${s}`, isActive: true } }))
  );
  const enr = (u, d, roles) => prisma.enrollment.create({ data: { userId: u.id, domainId: d.id, roles, isActive: true } });
  await Promise.all([enr(prof, A, ["INSTRUCTOR"]), enr(sa, A, ["STUDENT"]), enr(sb, B, ["STUDENT"])]);

  ctx = await request.newContext({ baseURL: BASE });
  const csrf = await (await ctx.get("/api/auth/csrf")).json();
  await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken: csrf.csrfToken, email: prof.email, password: PASS, callbackUrl: `${BASE}/ro/dashboard` },
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  const json = async (r) => (r.status() < 500 ? await r.json().catch(() => ({})) : {});

  // 1. Lista elevilor + analizele, cerând materia B prin adresă.
  const stB = await json(await ctx.get(`/api/dashboard/instructor/students?domainId=${B.id}`));
  check("lista elevilor materiei B (nepredate) → goală", !JSON.stringify(stB).includes(sb.id));
  const stA = await json(await ctx.get(`/api/dashboard/instructor/students?domainId=${A.id}`));
  check("lista elevilor materiei A (predate) → îl conține pe elevul A", JSON.stringify(stA).includes(sa.id));
  const anB = await json(await ctx.get(`/api/dashboard/instructor/analytics?domainId=${B.id}`));
  check("analizele de risc pe materia B → fără elevul B", !JSON.stringify(anB).includes(sb.id));

  // 2. Grupuri.
  const gB = await ctx.post("/api/dashboard/instructor/groups", { data: { name: "G-B", domainId: B.id, studentIds: [sb.id] } });
  check("grup pe materia B → refuzat", gB.status() === 403, `HTTP ${gB.status()}`);
  const gMix = await ctx.post("/api/dashboard/instructor/groups", { data: { name: "G-mix", domainId: A.id, studentIds: [sa.id, sb.id] } });
  check("grup pe A cu elevul B strecurat → refuzat", gMix.status() === 400, `HTTP ${gMix.status()}`);
  const gA = await ctx.post("/api/dashboard/instructor/groups", { data: { name: "G-A", domainId: A.id, studentIds: [sa.id] } });
  check("grup pe A cu elevul A → creat", gA.status() === 201, `HTTP ${gA.status()}`);
  const gAid = (await json(gA)).id;
  if (gAid) {
    const add = await ctx.patch(`/api/dashboard/instructor/groups/${gAid}`, { data: { addStudentIds: [sb.id] } });
    check("adăugarea elevului B în grupul de pe A → refuzată", add.status() === 400, `HTTP ${add.status()}`);
  }

  // 3. Istoricul de remindere al unui copil.
  const eB = await ctx.get(`/api/escalation/${sb.id}`);
  check("istoricul de remindere al elevului B → refuzat", eB.status() === 403, `HTTP ${eB.status()}`);
  const eA = await ctx.get(`/api/escalation/${sa.id}`);
  check("istoricul de remindere al elevului A → deschis", eA.status() === 200, `HTTP ${eA.status()}`);
  const dB = await ctx.delete(`/api/escalation/${sb.id}`);
  check("anularea reminderelor elevului B → refuzată", dB.status() === 403, `HTTP ${dB.status()}`);

  // 4. Praguri de alertă.
  const tB = await ctx.post("/api/dashboard/instructor/thresholds", { data: { studentId: sb.id, domainId: B.id, metric: "score", value: 50 } });
  check("prag pe elevul B, materia B → refuzat", tB.status() === 403, `HTTP ${tB.status()}`);
  const tBA = await ctx.post("/api/dashboard/instructor/thresholds", { data: { studentId: sb.id, domainId: A.id, metric: "score", value: 50 } });
  check("prag pe elevul B, declarat pe materia A → refuzat", tBA.status() === 403, `HTTP ${tBA.status()}`);
  const tA = await ctx.post("/api/dashboard/instructor/thresholds", { data: { studentId: sa.id, domainId: A.id, metric: "score", value: 50 } });
  check("prag pe elevul A → creat", tA.status() === 201, `HTTP ${tA.status()}`);

  // 5. Mesaje.
  const mB = await ctx.post("/api/dashboard/instructor/messages", { data: { recipientIds: [sb.id], content: "salut" } });
  check("mesaj către elevul B → refuzat", mB.status() === 403, `HTTP ${mB.status()}`);
  const mA = await ctx.post("/api/dashboard/instructor/messages", { data: { recipientIds: [sa.id], content: "salut" } });
  check("mesaj către elevul A → trimis", mA.status() === 201, `HTTP ${mA.status()}`);
} catch (e) {
  console.error(e);
  results.push(false);
} finally {
  await ctx?.dispose();
  await wipe();
  await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
