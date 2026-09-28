// Completări după prima rulare (01-faze-6-7-9.mjs):
//  - grupul „șters" e doar dezactivat (isActive=false) → se verifică ce mai expune, apoi i se scoate membrul;
//  - rapoartele instructorului cer ?type=&id= (prima rulare le-a chemat fără);
//  - /ro servește <html lang="en"> → se verifică dacă măcar conținutul e în română;
//  - GET / răspunde 307 → /ro, deci stresul se repetă pe /ro (aceleași 20 de cereri);
//  - „progresul" pe o materie PUBLICĂ neînscrisă: ce conține (doar datele proprii?).
//   JARS=<scratchpad>/jars.json node 02-completari.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { client, brief } from "./lib.mjs";

const { jars, info } = JSON.parse(readFileSync(process.env.JARS, "utf8"));
const C = {};
for (const [role, jar] of Object.entries(jars)) { C[role] = client(role); for (const [k, v] of Object.entries(jar)) C[role].jar.set(k, v); }
const AVI = "cmnoldd7100007slwe2ukyvc4", MATE = "cmpx7pink001h47s5mmbfcmbu";
const STUDENT_ID = info.STUDENT.id, JOURNEY_ID = "cmtnyaacl0000xzh7amgn0lqb";
const GID = "cmui3i2z0015r13f11z8hisck"; // grupul e2e-0926-group din prima rulare
const out = {};
const log = (k, v) => { out[k] = v; console.log(k.padEnd(48), typeof v === "string" ? v : JSON.stringify(v)); };

// 1. Grupul dezactivat
const ins = C.INSTRUCTOR;
const g = await ins.get(`/api/dashboard/instructor/groups/${GID}`);
log("deleted group GET [id]", `${g.status} isActive=${g.json?.isActive} members=${g.json?.members?.length} memberHasEmailField=${!!g.json?.members?.[0]?.user?.email}`);
const lst = await ins.get(`/api/dashboard/instructor/groups?domainId=${AVI}`);
log("deleted group in list", `${lst.status} present=${JSON.stringify(lst.json).includes(GID)}`);
const rep = await ins.get(`/api/dashboard/instructor/reports?type=group&id=${GID}`);
log("deleted group report", `${rep.status} rows=${rep.json?.report?.length}`);
const byG = await ins.get(`/api/dashboard/instructor/students?groupId=${GID}`);
log("students?groupId=<deleted group>", `${byG.status} n=${byG.json?.students?.length}`);
const del2 = await ins.del(`/api/dashboard/instructor/groups/${GID}`);
log("DELETE again (already deleted)", brief(del2));
const strip = await ins.patch(`/api/dashboard/instructor/groups/${GID}`, { removeStudentIds: [STUDENT_ID] });
log("PATCH remove member from deleted group", brief(strip));
const g2 = await ins.get(`/api/dashboard/instructor/groups/${GID}`);
log("deleted group after strip", `${g2.status} isActive=${g2.json?.isActive} members=${g2.json?.members?.length} name=${g2.json?.name}`);

// 2. Rapoartele instructorului, cu parametrii ceruți
for (const [role, q] of [["INSTRUCTOR", `type=student&id=${STUDENT_ID}`], ["INSTRUCTOR", `type=domain&id=${AVI}`], ["INSTRUCTOR", `type=student&id=${STUDENT_ID}&format=csv`], ["INSTRUCTOR2", `type=domain&id=${MATE}`], ["INSTRUCTOR2", `type=student&id=${JOURNEY_ID}`], ["INSTRUCTOR2", `type=group&id=${GID}`]]) {
  const r = await C[role].get(`/api/dashboard/instructor/reports?${q}`);
  const rows = Array.isArray(r.json?.report) ? r.json.report.length : (r.text.split("\n").length - 1);
  log(`${role} reports?${q.replace(STUDENT_ID, "<student>").replace(AVI, "<avi>").replace(MATE, "<mate>").replace(JOURNEY_ID, "<math-only>").replace(GID, "<group>")}`, `${r.status} rows=${rows}${r.json?.error ? " " + r.json.error : ""}`);
}

// 3. Limba paginilor
for (const p of ["/ro", "/en"]) {
  const r = await client("G").get(p, { redirect: "follow" });
  const title = (r.text.match(/<title[^>]*>([^<]*)</) || [])[1];
  const lang = (r.text.match(/<html[^>]*lang="([^"]+)"/) || [])[1];
  const alt = [...r.text.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
  log(`GET ${p}`, `${r.status} lang=${lang} title="${title}" hreflang=${JSON.stringify([...new Set(alt)])}`);
}

// 4. Stres pe /ro (ținta redirectului de la /)
{
  const gc = client("G2"); const t0 = Date.now();
  const res = await Promise.all(Array.from({ length: 20 }, () => gc.get("/ro")));
  const counts = {}; for (const r of res) counts[r.status] = (counts[r.status] || 0) + 1;
  const lat = res.map((r) => r.ms).sort((a, b) => a - b);
  log("stress 20× GET /ro", { wallMs: Date.now() - t0, counts, p50: lat[9], max: lat[19] });
}

// 5. Progres pe o materie PUBLICĂ neînscrisă
const pp = await C.STUDENT.get("/api/matematica-v-viii/progress");
log("STUDENT progress on public not-enrolled subject", `${pp.status} overall=${JSON.stringify(pp.json?.overall)} topics=${pp.json?.topics?.length}`);

writeFileSync(new URL("./rezultate-completari.json", import.meta.url), JSON.stringify(out, null, 1));
