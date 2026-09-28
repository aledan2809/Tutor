// Fazele 6 (scenarii E1-E17 + granițe), 7 (concurență F1-F2) și 9 (stres ușor) — True E2E 2026-09-26.
// Rulează pe PRODUCȚIE (etutor.ro) DOAR cu conturile de test, prin HTTP. Nu trimite mesaje, nu atinge
// Stripe, nu modifică date în afara conturilor de test. Datele create poartă prefixul `e2e-0926-` unde
// modelul are un nume (grupul); sesiunile de exersare ale contului de test se închid la final.
//   JARS=<scratchpad>/jars.json node 01-faze-6-7-9.mjs            (după 00-descoperire.mjs)
import { readFileSync, writeFileSync } from "node:fs";
import { client, env, brief, sleep, BASE } from "./lib.mjs";

const JARS = process.env.JARS;
const { jars, info } = JSON.parse(readFileSync(JARS, "utf8"));
const C = {};
for (const [role, jar] of Object.entries(jars)) { C[role] = client(role); for (const [k, v] of Object.entries(jar)) C[role].jar.set(k, v); }

const AVI = "cmnoldd7100007slwe2ukyvc4";           // aviation
const MATE = "cmpx7pink001h47s5mmbfcmbu";          // matematica-v-viii (INSTRUCTOR o predă, INSTRUCTOR2 nu)
const POSTA = "cmtsvd3ny000bty3vb0jhouqh";         // posta-factor (niciun instructor de test)
const STUDENT_ID = info.STUDENT.id;
const JOURNEY_ID = "cmtnyaacl0000xzh7amgn0lqb";    // elev de test doar pe matematica-v-viii
const POSTA_DEMO_ID = "cmtsvjaov0047ty3vcflduouo"; // elev de test doar pe posta-*
const PFX = "e2e-0926-";

const R = [];            // rezultate pe scenariu
const created = [];      // tot ce s-a creat
const openSessions = []; // sesiuni de exersare de închis la final: {role, id}
function rec(id, name, verdict, evidence, note = "") { R.push({ id, name, verdict, evidence, note }); console.log(`${id.padEnd(5)} ${verdict.padEnd(8)} ${name}${note ? " — " + note : ""}\n      ${evidence.join("\n      ")}`); }
const ev = (label, res) => `${label} → ${brief(res)} (${res.ms}ms)`;
const ok = (res, ...codes) => (codes.length ? codes : [200, 201]).includes(res.status);
const pickAnswer = (q) => {
  const o = q.options;
  if (Array.isArray(o) && o.length) { const x = o[0]; return typeof x === "string" ? x : (x?.text ?? x?.label ?? x?.id ?? "a"); }
  return "a";
};

// Sesiunile trebuie să fie încă valide.
for (const role of Object.keys(C)) {
  const s = await C[role].get("/api/auth/session");
  if (!s.json?.user?.id) throw new Error(`${role}: sesiunea a expirat — rulează 00-descoperire.mjs`);
}

// ═════════════ FAZA 6 ═════════════
const st = C.STUDENT;

// E1 — exersare: start → 3 răspunsuri → complete
{
  const e = [];
  const s = await st.post("/api/aviation/session/start", { type: "quick" }); e.push(ev("POST session/start", s));
  let verdict = "FAIL";
  if (ok(s) && s.json?.sessionId) {
    const sid = s.json.sessionId; created.push(`Session ${sid} (STUDENT, quick, aviation)`);
    const qs = s.json.questions ?? [];
    e.push(`   sessionId=${sid} questions=${qs.length}`);
    const answers = [];
    for (const q of qs.slice(0, 3)) {
      const a = await st.post("/api/aviation/session/answer", { sessionId: sid, questionId: q.id, answer: pickAnswer(q), responseTime: 4000 });
      answers.push(a); e.push(ev(`POST session/answer q=${q.id.slice(-6)}`, a) + (a.json && "isCorrect" in a.json ? ` isCorrect=${a.json.isCorrect}` : ""));
    }
    const dup = qs[0] ? await st.post("/api/aviation/session/answer", { sessionId: sid, questionId: qs[0].id, answer: pickAnswer(qs[0]) }) : null;
    if (dup) e.push(ev("POST session/answer (same question again)", dup));
    const g = await st.get(`/api/aviation/session/${sid}`); e.push(ev("GET session/[id]", g));
    const c = await st.post("/api/aviation/session/complete", { sessionId: sid }); e.push(ev("POST session/complete", c) + (c.json ? ` score=${c.json.score} answered=${c.json.totalQuestions}` : ""));
    const c2 = await st.post("/api/aviation/session/complete", { sessionId: sid }); e.push(ev("POST session/complete (again)", c2));
    const allOk = answers.length > 0 && answers.every((a) => ok(a)) && ok(c) && ok(g);
    verdict = allOk ? "PASS" : "PARTIAL";
    if (!ok(c)) openSessions.push({ role: "STUDENT", id: sid });
  }
  rec("E1", "Student practice (start/answer/complete)", verdict, e);
}

// E2 — examen
{
  const e = [];
  const f = await st.get("/api/aviation/exam/formats"); e.push(ev("GET exam/formats", f));
  const formats = f.json?.formats ?? [];
  e.push(`   formats=${formats.length}`);
  let verdict = "BLOCKED", note = "";
  if (formats.length) {
    const x = await st.post("/api/aviation/exam/start", { formatId: formats[0].id, mode: "PRACTICE" }); e.push(ev("POST exam/start", x));
    if (ok(x)) {
      const eid = x.json?.sessionId ?? x.json?.examSessionId ?? x.json?.id;
      created.push(`ExamSession ${eid} (STUDENT, PRACTICE)`);
      const sub = await st.post("/api/aviation/exam/submit", { sessionId: eid, answers: [] }); e.push(ev("POST exam/submit (empty, closes it)", sub));
      verdict = ok(sub) ? "PASS" : "PARTIAL";
    } else if (x.status === 403) { verdict = "PASS"; note = "403 = plan gate (exam_simulations) on a free account — documented behaviour"; }
    else if (x.status === 409) { verdict = "PARTIAL"; note = "an exam is already in progress on the test account"; }
    else verdict = "FAIL";
  } else note = "no active exam format on aviation";
  const h = await st.get("/api/aviation/exam/history"); e.push(ev("GET exam/history", h));
  rec("E2", "Exam start", verdict, e, note);
}

// E3 — evaluare inițială
{
  const e = [];
  const g = await st.get(`/api/student/assessment?domainId=${AVI}`); e.push(ev("GET student/assessment", g));
  const qs = g.json?.questions ?? [];
  let verdict = "FAIL";
  if (ok(g) && qs.length) {
    const p = await st.post("/api/student/assessment", { domainId: AVI, answers: qs.slice(0, 3).map((q) => ({ questionId: q.id, answer: pickAnswer(q) })) });
    e.push(ev("POST student/assessment (3 answers)", p) + (p.json ? ` score=${p.json.score} level=${p.json.level}` : ""));
    if (ok(p)) { created.push(`Session ${p.json.sessionId} (STUDENT, type=assessment, already ended) + 3 Attempt rows`); verdict = "PASS"; }
    else verdict = "PARTIAL";
    const bad = await st.post("/api/student/assessment", { domainId: AVI, answers: [] }); e.push(ev("POST student/assessment (0 answers, must be 400)", bad));
    if (bad.status !== 400) verdict = "PARTIAL";
  }
  rec("E3", "Assessment (GET questions + POST answers)", verdict, e);
}

// E5 — progres / gamificare
{
  const e = []; let all = true;
  for (const p of ["/api/aviation/xp", "/api/aviation/progress", "/api/aviation/streak", "/api/aviation/achievements", "/api/aviation/leaderboard", "/api/aviation/daily-challenge", `/api/student/dashboard?domainId=${AVI}`, "/api/student/domains", "/api/student/entitlements"]) {
    const r = await st.get(p); e.push(ev(`GET ${p.replace(AVI, "<avi>")}`, r)); if (!ok(r)) all = false;
  }
  rec("E5", "Progress / gamification reads", all ? "PASS" : "PARTIAL", e);
}

// E6 — notificări
{
  const e = []; let all = true;
  for (const [role, p] of [["STUDENT", "/api/notifications"], ["STUDENT", "/api/notifications?unread=true"], ["STUDENT", "/api/notifications/preferences"], ["WATCHER", "/api/notifications"], ["WATCHER", "/api/notifications?audience=child"]]) {
    const r = await C[role].get(p); e.push(ev(`${role} GET ${p}`, r) + (Array.isArray(r.json?.notifications) ? ` n=${r.json.notifications.length}` : "")); if (!ok(r)) all = false;
  }
  rec("E6", "Notifications list (read-only)", all ? "PASS" : "PARTIAL", e);
}

// E7 — grupuri instructor (creează → citește → șterge)
{
  const e = []; const ins = C.INSTRUCTOR; let verdict = "FAIL";
  const c = await ins.post("/api/dashboard/instructor/groups", { name: `${PFX}group`, description: "True E2E 2026-09-26, se șterge imediat", domainId: AVI, studentIds: [STUDENT_ID] });
  e.push(ev("POST instructor/groups", c));
  const gid = c.json?.id ?? c.json?.group?.id;
  if (ok(c) && gid) {
    created.push(`InstructorGroup ${gid} "${PFX}group" (INSTRUCTOR, aviation, 1 member)`);
    const l = await ins.get(`/api/dashboard/instructor/groups?domainId=${AVI}`); const inList = JSON.stringify(l.json ?? {}).includes(gid); e.push(ev("GET instructor/groups", l) + ` containsNew=${inList}`);
    const g = await ins.get(`/api/dashboard/instructor/groups/${gid}`); const hasMember = JSON.stringify(g.json ?? {}).includes(STUDENT_ID); e.push(ev("GET instructor/groups/[id]", g) + ` studentIsMember=${hasMember}`);
    const byGroup = await ins.get(`/api/dashboard/instructor/students?groupId=${gid}`); e.push(ev("GET instructor/students?groupId", byGroup) + ` total=${byGroup.json?.total ?? byGroup.json?.students?.length}`);
    const other = await C.INSTRUCTOR2.get(`/api/dashboard/instructor/groups/${gid}`); e.push(ev("INSTRUCTOR2 GET same group (other teacher, same subject)", other));
    const d = await ins.del(`/api/dashboard/instructor/groups/${gid}`); e.push(ev("DELETE instructor/groups/[id]", d));
    const after = await ins.get(`/api/dashboard/instructor/groups/${gid}`); e.push(ev("GET after delete (expect 404)", after));
    if (ok(d) && after.status === 404) created[created.length - 1] += " — DELETED";
    verdict = ok(l) && inList && ok(g) && hasMember && ok(d) && after.status === 404 ? "PASS" : "PARTIAL";
  }
  rec("E7", "Instructor groups create/read/delete", verdict, e);
}

// E8 — monitorizare elevi de către instructor
{
  const e = []; const ins = C.INSTRUCTOR;
  const d = await ins.get("/api/dashboard/instructor"); e.push(ev("GET dashboard/instructor", d));
  const l = await ins.get(`/api/dashboard/instructor/students?domainId=${AVI}&limit=100`); const ids = (l.json?.students ?? []).map((s) => s.id ?? s.userId ?? s.user?.id);
  e.push(ev("GET instructor/students?domainId=<avi>", l) + ` n=${ids.length} total=${l.json?.total ?? "?"} includesTestStudent=${ids.includes(STUDENT_ID)}`);
  const s = await ins.get(`/api/dashboard/instructor/students/${STUDENT_ID}`); e.push(ev("GET instructor/students/[student]", s) + ` domains=${(s.json?.domainProgress ?? []).length}`);
  rec("E8", "Instructor student monitoring", ok(d) && ok(l) && ok(s) && ids.includes(STUDENT_ID) ? "PASS" : "PARTIAL", e);
}

// E10 — rapoarte / analitice
{
  const e = []; let all = true;
  for (const [role, p] of [["STUDENT", "/api/reports/trend"], ["STUDENT", "/api/reports/trend?period=weekly"], ["WATCHER", `/api/reports/trend?childId=${STUDENT_ID}`], ["WATCHER", "/api/dashboard/watcher/reports"], ["INSTRUCTOR", `/api/dashboard/instructor/reports?domainId=${AVI}`], ["INSTRUCTOR", `/api/dashboard/instructor/analytics?domainId=${AVI}`], ["INSTRUCTOR", "/api/dashboard/instructor/analytics"]]) {
    const r = await C[role].get(p); e.push(ev(`${role} GET ${p.replace(AVI, "<avi>").replace(STUDENT_ID, "<child>")}`, r)); if (!ok(r)) all = false;
  }
  rec("E10", "Reports / analytics reads", all ? "PASS" : "PARTIAL", e);
}

// E11 — admin întrebări (GET)
{
  const e = []; const ad = C.ADMIN;
  const l = await ad.get(`/api/admin/questions?domainId=${AVI}&limit=5`); const qs = l.json?.questions ?? [];
  e.push(ev("ADMIN GET admin/questions?domainId=<avi>", l) + ` n=${qs.length} total=${l.json?.total ?? l.json?.pagination?.total ?? "?"}`);
  let one = null; if (qs[0]) { one = await ad.get(`/api/admin/questions/${qs[0].id}`); e.push(ev("ADMIN GET admin/questions/[id]", one)); }
  const noScope = await ad.get("/api/admin/questions?limit=100"); const dom = [...new Set((noScope.json?.questions ?? []).map((q) => q.domainId ?? q.domain?.id))];
  e.push(ev("ADMIN GET admin/questions (no filter)", noScope) + ` domainsInPage=${JSON.stringify(dom.map((d) => d === AVI ? "avi" : d))}`);
  rec("E11", "Admin questions GET", ok(l) && qs.length && (!one || ok(one)) ? "PASS" : "PARTIAL", e);
}

// E12 — admin materii (GET)
{
  const e = [];
  for (const [role, p] of [["ADMIN", "/api/admin/domains"], ["ADMIN", `/api/admin/domains/${AVI}`], ["ADMIN", `/api/admin/domains/${AVI}/exam-config`], ["ADMIN", "/api/admin/domain/aviation/exam-format"], ["ADMIN", "/api/admin/domain/aviation/templates"], ["SUPERADMIN", "/api/admin/domains"]]) {
    const r = await C[role].get(p); e.push(ev(`${role} GET ${p.replace(AVI, "<avi>")}`, r) + (Array.isArray(r.json) ? ` n=${r.json.length}` : ""));
  }
  const s = e.map((x) => Number(x.split("→ ")[1].slice(0, 3)));
  rec("E12", "Admin domains GET", s.every((x) => x === 200) ? "PASS" : "PARTIAL", e);
}

// E14 — părinte (watcher)
{
  const e = []; const w = C.WATCHER;
  const l = await w.get("/api/dashboard/watcher"); const ids = (l.json?.students ?? []).map((s) => s.id ?? s.userId);
  e.push(ev("GET dashboard/watcher", l) + ` students=${ids.length} onlyLinkedChild=${ids.length === 1 && ids[0] === STUDENT_ID} ids=${JSON.stringify(ids.map((x) => x === STUDENT_ID ? "<child>" : x))}`);
  const c = await w.get(`/api/dashboard/watcher/${STUDENT_ID}`); e.push(ev("GET dashboard/watcher/[child]", c));
  for (const p of ["subjects", "reminders", "breaks", "nudge", "nudge-targets", "phone"]) { const r = await w.get(`/api/dashboard/watcher/${STUDENT_ID}/${p}`); e.push(ev(`GET watcher/[child]/${p}`, r)); }
  rec("E14", "Watcher monitoring", ok(l) && ok(c) && ids.includes(STUDENT_ID) ? "PASS" : "PARTIAL", e);
}

// E15 — superadmin GET /api/admin/*
{
  const e = []; const sa = C.SUPERADMIN; const bad = [];
  const paths = ["users?limit=5", "audit", "revenue", "plans", "vouchers", "organizations", "campaigns", "ads", "access-trial", "creatori", "feedback", "tags", "templates", "exam-formats", "lessons", "bibliography", "posta-copy", "domains", "questions?limit=5", `domains/${AVI}`, `domains/${AVI}/exam-config`, "domain/aviation/exam-format", "domain/aviation/templates"];
  let firstPlan = null, firstVoucher = null, firstOrg = null;
  for (const p of paths) {
    const r = await sa.get(`/api/admin/${p}`); e.push(ev(`GET admin/${p.replace(AVI, "<avi>")}`, r)); if (r.status !== 200) bad.push(`${p}:${r.status}`);
    if (p === "plans") firstPlan = (r.json?.plans ?? r.json ?? [])[0]?.id;
    if (p === "vouchers") firstVoucher = (r.json?.vouchers ?? r.json ?? [])[0]?.id;
    if (p === "organizations") firstOrg = (r.json?.organizations ?? r.json ?? [])[0]?.id;
  }
  for (const [p, id] of [["plans", firstPlan], ["vouchers", firstVoucher, "/redemptions"], ["organizations", firstOrg]]) {
    if (!id) continue; const suffix = p === "vouchers" ? "/redemptions" : "";
    const r = await sa.get(`/api/admin/${p}/${id}${suffix}`); e.push(ev(`GET admin/${p}/[id]${suffix}`, r)); if (r.status !== 200) bad.push(`${p}/[id]:${r.status}`);
  }
  rec("E15", "Superadmin /api/admin/* GET", bad.length ? "PARTIAL" : "PASS", e, bad.length ? `non-200: ${bad.join(", ")}` : "");
}

// E16 — autentificare
{
  const e = []; let verdict = "PASS";
  const anon = client("ANON");
  const wrong = await anon.login(env.STUDENT_EMAIL, "definitely-wrong-" + Date.now());
  e.push(`POST callback/credentials wrong password → ${wrong.callbackStatus} location=${(wrong.location || "").replace(BASE, "").slice(0, 60)} sessionUser=${wrong.user ? "PRESENT(!)" : "null"}`);
  if (wrong.user) verdict = "FAIL";
  const unknown = await client("ANON2").login(`${PFX}nobody-${Date.now()}@demo.tutor.app`, "whatever-123");
  e.push(`POST callback/credentials unknown email → ${unknown.callbackStatus} sessionUser=${unknown.user ? "PRESENT(!)" : "null"}`);
  if (unknown.user) verdict = "FAIL";
  const guest = client("GUEST");
  for (const [m, p, b] of [["get", "/api/student/dashboard"], ["get", "/api/dashboard/instructor/students"], ["get", "/api/dashboard/watcher"], ["get", "/api/admin/users"], ["get", "/api/notifications"], ["get", "/api/aviation/progress"], ["post", "/api/aviation/session/start", { type: "quick" }], ["post", "/api/aviation/session/answer", { sessionId: "x", questionId: "y", answer: "a" }], ["post", "/api/dashboard/instructor/groups", { name: `${PFX}anon`, domainId: AVI }]]) {
    const r = await guest[m](p, b); e.push(ev(`anon ${m.toUpperCase()} ${p}`, r)); if (r.status !== 401) verdict = verdict === "FAIL" ? "FAIL" : "PARTIAL";
  }
  rec("E16", "Auth flows (wrong password, unauthenticated 401)", verdict, e);
}

// E17 — limbă
{
  const e = []; const g = client("GUEST2"); let all = true;
  for (const p of ["/ro", "/en", "/ro/login", "/en/login", "/ro/preturi", "/en/preturi"]) {
    const r = await g.get(p, { redirect: "follow" }); const lang = (r.text.match(/<html[^>]*lang="([^"]+)"/) || [])[1];
    e.push(`GET ${p} → ${r.status} html lang=${lang} (${r.ms}ms)`); if (r.status !== 200) all = false;
    if ((p.startsWith("/ro") && lang && !lang.startsWith("ro")) || (p.startsWith("/en") && lang && !lang.startsWith("en"))) all = false;
  }
  rec("E17", "Locale pages /ro + /en", all ? "PASS" : "PARTIAL", e);
}

// ── Granițe de acces (atacator) ──
const B = [];
async function boundary(role, label, fn, expect) {
  const r = await fn(C[role]);
  const pass = expect(r);
  B.push({ role, label, status: r.status, pass, body: brief(r) });
  console.log(`  [${pass ? "OK " : "BAD"}] ${role.padEnd(11)} ${label} → ${brief(r)}`);
  return r;
}
const denied = (r) => [401, 403, 404].includes(r.status);
const emptyList = (r) => r.status === 200 && ((r.json?.students ?? r.json?.questions ?? []).length === 0);
console.log("\nBOUNDARY");
for (const p of ["/api/dashboard/instructor", "/api/dashboard/instructor/students", `/api/dashboard/instructor/students/${STUDENT_ID}`, "/api/dashboard/instructor/groups", "/api/dashboard/instructor/analytics", "/api/dashboard/instructor/reports", "/api/dashboard/instructor/goals", "/api/dashboard/instructor/messages"])
  await boundary("STUDENT", `GET ${p.replace(STUDENT_ID, "<self>")}`, (c) => c.get(p), denied);
for (const p of ["/api/admin/users", "/api/admin/questions", "/api/admin/domains", "/api/admin/audit", "/api/admin/revenue", "/api/admin/vouchers", "/api/admin/feedback", `/api/admin/questions?domainId=${AVI}`])
  await boundary("STUDENT", `GET ${p.replace(AVI, "<avi>")}`, (c) => c.get(p), denied);
await boundary("STUDENT", "POST /api/aviation/xp (award self XP)", (c) => c.post("/api/aviation/xp", { userId: STUDENT_ID, xp: 1, reason: `${PFX}probe` }), denied);
await boundary("STUDENT", "POST /api/dashboard/instructor/groups", (c) => c.post("/api/dashboard/instructor/groups", { name: `${PFX}student-probe`, domainId: AVI }), denied);
await boundary("STUDENT", "GET /api/dashboard/watcher/<other student>", (c) => c.get(`/api/dashboard/watcher/${JOURNEY_ID}`), denied);
await boundary("STUDENT", "GET /api/reports/trend?childId=<other student>", (c) => c.get(`/api/reports/trend?childId=${JOURNEY_ID}`), denied);
await boundary("STUDENT", "POST /api/posta-factor/session/start (not enrolled)", (c) => c.post("/api/posta-factor/session/start", { type: "quick" }), denied);
await boundary("STUDENT", "GET /api/matematica-v-viii/progress (not enrolled)", (c) => c.get("/api/matematica-v-viii/progress"), denied);
await boundary("STUDENT", `GET /api/student/assessment?domainId=<posta-factor>`, (c) => c.get(`/api/student/assessment?domainId=${POSTA}`), denied);
// Instructor doar pe aviation (INSTRUCTOR2) + INSTRUCTOR (aviation + matematica-v-viii)
for (const [dom, name] of [[MATE, "matematica-v-viii"], [POSTA, "posta-factor"]])
  await boundary("INSTRUCTOR2", `GET instructor/students?domainId=<${name}> (expect empty)`, (c) => c.get(`/api/dashboard/instructor/students?domainId=${dom}`), emptyList);
await boundary("INSTRUCTOR", "GET instructor/students?domainId=<posta-factor> (expect empty)", (c) => c.get(`/api/dashboard/instructor/students?domainId=${POSTA}`), emptyList);
await boundary("INSTRUCTOR2", "GET instructor/students (no filter) excludes math-only student", (c) => c.get("/api/dashboard/instructor/students?limit=100"), (r) => r.status === 200 && !JSON.stringify(r.json).includes(JOURNEY_ID) && !JSON.stringify(r.json).includes(POSTA_DEMO_ID));
await boundary("INSTRUCTOR2", "GET instructor/students/<math-only student>", (c) => c.get(`/api/dashboard/instructor/students/${JOURNEY_ID}`), denied);
await boundary("INSTRUCTOR2", "GET instructor/students/<math-only student>?domainId=<mate>", (c) => c.get(`/api/dashboard/instructor/students/${JOURNEY_ID}?domainId=${MATE}`), denied);
await boundary("INSTRUCTOR", "GET instructor/students/<posta-only student>", (c) => c.get(`/api/dashboard/instructor/students/${POSTA_DEMO_ID}`), denied);
await boundary("INSTRUCTOR2", "GET admin/questions?domainId=<mate> (expect empty)", (c) => c.get(`/api/admin/questions?domainId=${MATE}`), (r) => denied(r) || emptyList(r));
await boundary("INSTRUCTOR2", "GET dashboard/watcher/<math-only student>", (c) => c.get(`/api/dashboard/watcher/${JOURNEY_ID}`), denied);
const g1 = await boundary("INSTRUCTOR2", "POST group aviation with math-only student (expect 400)", (c) => c.post("/api/dashboard/instructor/groups", { name: `${PFX}probe-a`, domainId: AVI, studentIds: [JOURNEY_ID] }), (r) => r.status === 400 || r.status === 403);
const g2 = await boundary("INSTRUCTOR2", "POST group on matematica-v-viii (not taught, expect 403)", (c) => c.post("/api/dashboard/instructor/groups", { name: `${PFX}probe-b`, domainId: MATE }), denied);
await boundary("INSTRUCTOR2", "GET admin/users", (c) => c.get("/api/admin/users"), denied);
await boundary("INSTRUCTOR2", "GET dashboard/instructor/analytics?domainId=<mate>", (c) => c.get(`/api/dashboard/instructor/analytics?domainId=${MATE}`), (r) => denied(r) || (r.status === 200 && !JSON.stringify(r.json).includes(JOURNEY_ID)));
// Părinte
await boundary("WATCHER", "GET dashboard/watcher/<not-linked student>", (c) => c.get(`/api/dashboard/watcher/${JOURNEY_ID}`), denied);
await boundary("WATCHER", "GET dashboard/watcher/<posta-only student>", (c) => c.get(`/api/dashboard/watcher/${POSTA_DEMO_ID}`), denied);
await boundary("WATCHER", "GET reports/trend?childId=<not-linked student>", (c) => c.get(`/api/reports/trend?childId=${JOURNEY_ID}`), denied);
await boundary("WATCHER", "GET dashboard/watcher/<not-linked>/reminders", (c) => c.get(`/api/dashboard/watcher/${JOURNEY_ID}/reminders`), denied);
await boundary("WATCHER", "GET dashboard/watcher?domainId=<mate> (must not widen)", (c) => c.get(`/api/dashboard/watcher?domainId=${MATE}`), (r) => r.status === 200 && !JSON.stringify(r.json).includes(JOURNEY_ID));
await boundary("WATCHER", "GET dashboard/instructor/students", (c) => c.get("/api/dashboard/instructor/students"), denied);
await boundary("WATCHER", "GET admin/users", (c) => c.get("/api/admin/users"), denied);
// Grupuri create din greșeală de sondele de mai sus → se șterg.
for (const g of [g1, g2]) { const gid = g.json?.id ?? g.json?.group?.id; if (gid) { created.push(`InstructorGroup ${gid} (probe accepted!)`); await C.INSTRUCTOR2.del(`/api/dashboard/instructor/groups/${gid}`); } }

// ═════════════ FAZA 7 ═════════════
console.log("\n…pauză 65s (fereastra de 60 cereri/minut/sesiune pe /api/aviation)"); await sleep(65_000);
const P7 = {};
{
  // F1: doi utilizatori înscriși pornesc sesiuni simultan
  let second = "ADMIN";
  const t0 = Date.now();
  let [a, b] = await Promise.all([C.STUDENT.post("/api/aviation/session/start", { type: "quick" }), C[second].post("/api/aviation/session/start", { type: "quick" })]);
  if (!ok(b)) { P7.adminAttempt = brief(b); second = "SUPERADMIN"; b = await C.SUPERADMIN.post("/api/aviation/session/start", { type: "quick" }); }
  P7.F1 = { wallMs: Date.now() - t0, student: brief(a), second, secondRes: brief(b), distinct: a.json?.sessionId && b.json?.sessionId && a.json.sessionId !== b.json.sessionId };
  for (const [role, r] of [["STUDENT", a], [second, b]]) if (r.json?.sessionId) { openSessions.push({ role, id: r.json.sessionId }); created.push(`Session ${r.json.sessionId} (${role}, F1)`); }
  console.log("F1", JSON.stringify(P7.F1));
  // F2: instructor + elev citesc progresul în paralel
  const [sp, ip] = await Promise.all([C.STUDENT.get("/api/aviation/progress"), C.INSTRUCTOR.get(`/api/dashboard/instructor/students/${STUDENT_ID}?domainId=${AVI}`)]);
  const s = sp.json?.overall, i = (ip.json?.domainProgress ?? []).find((d) => d.domain?.id === AVI)?.progress;
  P7.F2 = { student: brief(sp), instructor: brief(ip), studentView: s && { totalAttempts: s.totalAttempts, accuracy: s.accuracy, topics: s.topicsStudied }, instructorView: i && { totalAttempts: i.totalAttempts, accuracy: i.accuracy, topics: i.topicsStudied } };
  P7.F2.consistent = !!(s && i && s.totalAttempts === i.totalAttempts && s.accuracy === i.accuracy && s.topicsStudied === i.topicsStudied);
  console.log("F2", JSON.stringify(P7.F2));
}

// ═════════════ FAZA 9 ═════════════
console.log("\n…pauză 65s"); await sleep(65_000);
const P9 = {};
{
  const t0 = Date.now();
  const res = await Promise.all(Array.from({ length: 10 }, () => C.STUDENT.post("/api/aviation/session/start", { type: "quick" })));
  const counts = {}; for (const r of res) counts[r.status] = (counts[r.status] || 0) + 1;
  const ids = res.map((r) => r.json?.sessionId).filter(Boolean);
  for (const id of ids) { openSessions.push({ role: "STUDENT", id }); }
  created.push(`${ids.length} Session rows (STUDENT, stress)`);
  const lat = res.map((r) => r.ms).sort((a, b) => a - b);
  P9.sessionStart = { wallMs: Date.now() - t0, counts, distinctIds: new Set(ids).size, p50: lat[4], max: lat[9], non2xx: res.filter((r) => !ok(r)).map((r) => brief(r)) };
  console.log("stress session/start", JSON.stringify(P9.sessionStart));
  const g = client("GUEST3");
  const t1 = Date.now();
  const home = await Promise.all(Array.from({ length: 20 }, () => g.get("/")));
  const hc = {}; for (const r of home) hc[r.status] = (hc[r.status] || 0) + 1;
  const hl = home.map((r) => r.ms).sort((a, b) => a - b);
  P9.home = { wallMs: Date.now() - t1, counts: hc, p50: hl[9], max: hl[19], location: home[0].location };
  console.log("stress GET /", JSON.stringify(P9.home));
}

// ═════════════ CURĂȚENIE ═════════════
console.log("\n…pauză 65s înainte de închiderea sesiunilor"); await sleep(65_000);
const closed = []; const notClosed = [];
for (const { role, id } of openSessions) {
  const r = await C[role].post("/api/aviation/session/complete", { sessionId: id });
  (ok(r) ? closed : notClosed).push(`${role}:${id.slice(-8)}:${r.status}`);
}
console.log("closed", closed.length, "notClosed", notClosed);

const out = { ranAt: new Date().toISOString(), base: BASE, scenarios: R, boundary: B, phase7: P7, phase9: P9, created, cleanup: { closedSessions: closed.length, notClosed } };
writeFileSync(new URL("./rezultate-faze-6-7-9.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("\nSUMAR:", R.map((r) => `${r.id}=${r.verdict}`).join(" "), "| boundary bad:", B.filter((b) => !b.pass).length, "/", B.length);
