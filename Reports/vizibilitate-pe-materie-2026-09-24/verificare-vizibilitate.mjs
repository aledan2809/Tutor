// Vizibilitatea pe materie, cazul Antoniei, pe stiva QA locală (:3113) — niciodată producția.
// Antonia: ADMIN pe A, doar părinte (WATCHER) pe B. Rareș (copilul ei): elev pe A și B.
// X: elev doar pe B (nu e copilul ei). Y: elev pe A. Z: elev pe C (Antonia n-are niciun rol pe C).
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/vizibilitate-pe-materie-2026-09-24/verificare-vizibilitate.mjs
import { createRequire } from "node:module";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { request } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-viz";
const PASS = "parola-viz-1234";
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
    prisma.user.create({ data: { email: `${TAG}-${n.toLowerCase()}-${s}@demo.tutor.app`, name: `${n} QA`, password: hash, freeForever: true } });
  const [antonia, rares, x, y, z] = await Promise.all(["Antonia", "Rares", "X", "Y", "Z"].map(mk));
  const [A, B, C] = await Promise.all(
    ["A", "B", "C"].map((d) => prisma.domain.create({ data: { name: `Materia ${d} QA`, slug: `${TAG}-${d.toLowerCase()}-${s}`, isActive: true } }))
  );
  const enr = (u, d, roles) => prisma.enrollment.create({ data: { userId: u.id, domainId: d.id, roles, isActive: true } });
  await Promise.all([
    enr(antonia, A, ["ADMIN"]), enr(antonia, B, ["WATCHER"]),
    enr(rares, A, ["STUDENT"]), enr(rares, B, ["STUDENT"]),
    enr(x, B, ["STUDENT"]), enr(y, A, ["STUDENT"]), enr(z, C, ["STUDENT"]),
    // Rareș primește și materia C, unde Antonia nu are niciun rol (o materie adăugată copilului mai târziu).
    enr(rares, C, ["STUDENT"]),
  ]);
  await prisma.guardian.create({ data: { parentId: antonia.id, childId: rares.id, relation: "PARENT", status: "active" } });

  ctx = await request.newContext({ baseURL: BASE });
  const csrf = await (await ctx.get("/api/auth/csrf")).json();
  await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken: csrf.csrfToken, email: antonia.email, password: PASS, callbackUrl: `${BASE}/ro/dashboard` },
    maxRedirects: 0,
    failOnStatusCode: false,
  });

  const listRes = await ctx.get("/api/dashboard/watcher");
  check("lista răspunde", listRes.status() === 200, `HTTP ${listRes.status()}`);
  const list = listRes.status() === 200 ? await listRes.json() : {};
  const ids = new Set((list.students ?? []).map((st) => st.id));
  check("vede elevul Y de la materia pe care o administrează (A)", ids.has(y.id));
  check("vede copilul ei (Rareș)", ids.has(rares.id));
  check("NU vede copilul altcuiva (X) de la materia unde e doar părinte (B)", !ids.has(x.id));
  check("NU vede elevul Z de la o materie pe care n-are niciun rol (C)", !ids.has(z.id));

  const listC = await (await ctx.get(`/api/dashboard/watcher?domainId=${C.id}`)).json();
  const idsC = new Set((listC.students ?? []).map((st) => st.id));
  check("materia C (fără rol, dar copilul ei o are) → doar copilul ei, nu Z", idsC.has(rares.id) && !idsC.has(z.id), `${idsC.size} elevi`);
  const rInList = (list.students ?? []).find((st) => st.id === rares.id);
  check("în lista generală, copilul apare cu toate cele 3 materii (și C)", (rInList?.domains ?? []).length === 3, `${(rInList?.domains ?? []).length} materii`);
  const listB = await (await ctx.get(`/api/dashboard/watcher?domainId=${B.id}`)).json();
  const idsB = new Set((listB.students ?? []).map((st) => st.id));
  check("pe materia B, doar copilul ei", idsB.has(rares.id) && !idsB.has(x.id), `${idsB.size} elevi`);

  const dx = await ctx.get(`/api/dashboard/watcher/${x.id}`);
  check("fișa lui X (copilul altcuiva, doar pe B) → refuzată", dx.status() === 403 || dx.status() === 404, `HTTP ${dx.status()}`);
  const dz = await ctx.get(`/api/dashboard/watcher/${z.id}`);
  check("fișa lui Z (materia C) → refuzată", dz.status() === 403 || dz.status() === 404, `HTTP ${dz.status()}`);
  const dy = await ctx.get(`/api/dashboard/watcher/${y.id}`);
  check("fișa lui Y (elev la materia administrată) → deschisă", dy.status() === 200, `HTTP ${dy.status()}`);
  const dr = await ctx.get(`/api/dashboard/watcher/${rares.id}`);
  const drText = dr.status() === 200 ? JSON.stringify(await dr.json()) : "";
  check("fișa copilului ei → deschisă, cu ambele materii", dr.status() === 200 && drText.includes(A.id) && drText.includes(B.id), `HTTP ${dr.status()}`);
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
