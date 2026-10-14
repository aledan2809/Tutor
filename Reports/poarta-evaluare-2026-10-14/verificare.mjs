// Verificarea reparațiilor din 14.10 (după livrare) pe stiva QA, pe telefon:
//   A. testul inițial (Evaluare) și testul rapid cer capitolele confirmate și iau întrebări doar din ele;
//   B. la o materie cu curs, testul se deschide din lecțiile terminate (și la testul rapid);
//   C. elevul de clasa a IX-a pe BAC vede toate capitolele (lista era goală);
//   D. pagina de intrare: titlul cu eTutor.ro, linkurile pe rânduri separate, fără „magic link”.
//   BASE=http://localhost:3113 node Reports/poarta-evaluare-2026-10-14/verificare.mjs
// Adaugă temporar în baza QA o materie de BAC și una cu curs (și întrebările lor) și le șterge la final.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const { chromium, devices } = createRequire(process.cwd() + "/package.json")("playwright");
const BASE = (process.env.BASE || "http://localhost:3113").replace(/\/$/, "");
const OUT = new URL("./capturi/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sql = (q) => execSync(`docker exec -i tutor-qa-pg psql -U tutor -d tutor_qa -v ON_ERROR_STOP=1 -tA`, { input: q }).toString().trim();
// Unitățile programei de gimnaziu → capitolele lor (aceeași sursă ca serverul).
const UNITS = JSON.parse(execSync(`npx tsx -e 'import { CURRICULUM } from "./src/lib/curriculum"; console.log(JSON.stringify(Object.fromEntries(CURRICULUM["mate-gimnaziu"].map((u) => [u.key, u.chapters]))))'`).toString());

let fail = 0;
const check = (ok, what) => {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) fail++;
};
const stamp = Date.now();
const BAC = `qa-poarta-bac-${stamp}`;
const CURS = `qa-poarta-curs-${stamp}`;
const browser = await chromium.launch();
const ctxOpts = { ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" };

async function newStudent(ctx, label, birth) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ro/auth/register`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
  const email = `qa-${label}-${stamp}@qa-elev.ro`;
  await page.getByPlaceholder("Numele tău").fill(`QA ${label}`);
  await page.getByPlaceholder("tu@exemplu.ro").fill(email);
  await page.selectOption("#birth-day", String(birth.d));
  await page.selectOption("#birth-month", String(birth.m));
  await page.selectOption("#birth-year", String(birth.y));
  await page.locator("#parent-email").fill(`parinte-${label}-${stamp}@qa-parinte.ro`);
  await page.getByPlaceholder("Minimum 8 caractere").fill("qa-parola-123");
  await page.getByRole("button", { name: "Creează cont" }).click();
  await page.waitForURL((u) => /\/dashboard\/?$/.test(u.pathname), { timeout: 60000 });
  return { page, userId: sql(`SELECT id FROM "User" WHERE email = '${email}'`) };
}

try {
  // ── Date de probă: o materie de BAC (slug cu programă) și una cu curs ──
  const mateId = sql(`SELECT id FROM "Domain" WHERE slug = 'matematica-v-viii'`);
  sql(`
    INSERT INTO "Domain" (id, name, slug, "isActive", visibility, "updatedAt") VALUES
      ('${BAC}', 'QA BAC M1 ${stamp}', 'matematica-m1-ix-xii', true, 'PUBLIC', now()),
      ('${CURS}', 'QA Curs ${stamp}', '${CURS}', true, 'PUBLIC', now());
    INSERT INTO "Question" (id, "domainId", subject, topic, difficulty, type, content, options, "correctAnswer", status, "updatedAt")
      SELECT '${BAC}-q' || row_number() over (), '${BAC}', 'Matematică', CASE WHEN row_number() over () % 2 = 0 THEN 'Logaritmi' ELSE 'Trigonometrie' END,
             difficulty, type, content, options, "correctAnswer", 'PUBLISHED', now()
      FROM (SELECT * FROM "Question" WHERE "domainId" = '${mateId}' AND status = 'PUBLISHED' AND type = 'MULTIPLE_CHOICE' AND options IS NOT NULL LIMIT 12) q;
    INSERT INTO "Question" (id, "domainId", subject, topic, difficulty, type, content, options, "correctAnswer", status, "updatedAt")
      SELECT '${CURS}-q' || row_number() over (), '${CURS}', 'QA', 'QA Modul 1', difficulty, type, content, options, "correctAnswer", 'PUBLISHED', now()
      FROM (SELECT * FROM "Question" WHERE "domainId" = '${mateId}' AND status = 'PUBLISHED' AND type = 'MULTIPLE_CHOICE' AND options IS NOT NULL LIMIT 6) q;
    INSERT INTO "Course" (id, "domainId", title, slug, "isPublished", "updatedAt") VALUES ('${CURS}-c', '${CURS}', 'QA Curs', '${CURS}-c', true, now());
    INSERT INTO "CourseModule" (id, "courseId", "order", title, "questionTopic", "updatedAt") VALUES ('${CURS}-m', '${CURS}-c', 1, 'Modulul 1', 'QA Modul 1', now());
    INSERT INTO "Lesson" (id, "domainId", subject, topic, title, slug, content, "isPublished", "moduleId", "updatedAt")
      VALUES ('${CURS}-l', '${CURS}', 'QA', 'QA Modul 1', 'Lecția 1', '${CURS}-l', 'Conținut de probă.', true, '${CURS}-m', now());
  `);

  // ── A + B: elev de clasa a VIII-a, înscris la matematică și la materia cu curs, capitole neconfirmate ──
  {
    const ctx = await browser.newContext(ctxOpts);
    const { page, userId } = await newStudent(ctx, "poarta8", { d: 15, m: 5, y: 2012 });
    sql(`INSERT INTO "Enrollment" (id, "userId", "domainId", "updatedAt") VALUES
      ('qa-enr-${stamp}-1', '${userId}', '${mateId}', now()), ('qa-enr-${stamp}-2', '${userId}', '${CURS}', now())
      ON CONFLICT DO NOTHING`);
    const anyMateQ = sql(`SELECT id FROM "Question" WHERE "domainId" = '${mateId}' AND status = 'PUBLISHED' LIMIT 1`);

    const g = await page.request.get(`${BASE}/api/student/assessment?domainId=${mateId}`);
    const gBody = await g.json().catch(() => ({}));
    check(g.status() === 409 && gBody.needsCurriculumSetup === true, `A evaluarea (GET) fără capitole confirmate → 409 (${g.status()})`);
    const p = await page.request.post(`${BASE}/api/student/assessment`, { data: { domainId: mateId, answers: [{ questionId: anyMateQ, answer: "x" }] } });
    check(p.status() === 409, `A evaluarea (trimiterea răspunsurilor) fără capitole confirmate → 409 (${p.status()})`);
    const qk = await page.request.post(`${BASE}/api/student/sessions/quick`, { data: { domainId: mateId } });
    check(qk.status() === 409 && (await qk.json()).needsCurriculumSetup === true, `A testul rapid fără capitole confirmate → 409 (${qk.status()})`);
    check(sql(`SELECT count(*) FROM "Session" WHERE "userId" = '${userId}'`) === "0", "A nu s-a creat nicio sesiune");

    await page.goto(`${BASE}/ro/dashboard/assessment`, { waitUntil: "networkidle" });
    await page.locator("select").first().selectOption(mateId);
    await page.getByRole("button", { name: "Start Assessment" }).click();
    const setup = page.getByText("Înainte de test, confirmă capitolele");
    await setup.waitFor({ timeout: 20000 }).catch(() => {});
    check(await setup.isVisible(), "A pagina Evaluare spune „Înainte de test, confirmă capitolele…”");
    const cta = page.getByRole("link", { name: "Confirmă capitolele →" });
    check((await cta.getAttribute("href"))?.includes("/dashboard/practice?start=quick&domain=matematica-v-viii"), "A linkul duce la confirmarea capitolelor pe materia aleasă");
    await page.screenshot({ path: `${OUT}A-evaluare-fara-capitole.png` });

    // B: materia cu curs, nicio lecție terminată.
    const qc = await page.request.post(`${BASE}/api/student/sessions/quick`, { data: { domainId: CURS } });
    const qcBody = await qc.json().catch(() => ({}));
    check(qc.status() === 409 && qcBody.emptyBecauseCourse === true && qcBody.lessonId === `${CURS}-l`, `B testul rapid la o materie cu curs, fără lecții terminate → 409 cu lecția de citit (${qc.status()})`);
    await page.locator("select").first().selectOption(CURS);
    await page.getByRole("button", { name: "Start Assessment" }).click();
    const course = page.getByText("Testul se deschide din lecțiile terminate");
    await course.waitFor({ timeout: 20000 }).catch(() => {});
    check(await course.isVisible(), "B pagina Evaluare spune „Testul se deschide din lecțiile terminate…”");
    check((await page.getByRole("link", { name: "Deschide lecția →" }).getAttribute("href"))?.endsWith(`/dashboard/lessons/${CURS}-l`), "B linkul duce la lecția de citit");
    await page.screenshot({ path: `${OUT}B-evaluare-curs.png` });
    // După lecție, evaluarea se deschide pe modulul ei.
    sql(`INSERT INTO "LessonProgress" (id, "userId", "lessonId", status, progress, "completedAt", "updatedAt") VALUES ('qa-lp-${stamp}', '${userId}', '${CURS}-l', 'COMPLETED', 100, now(), now())`);
    const gc = await page.request.get(`${BASE}/api/student/assessment?domainId=${CURS}`);
    const gcBody = await gc.json().catch(() => ({}));
    check(gc.status() === 200 && gcBody.questions?.length > 0 && gcBody.questions.every((q) => q.topic === "QA Modul 1"), `B după lecție, evaluarea vine din modulul ei (${gc.status()}, ${gcBody.questions?.length ?? 0} întrebări)`);

    // A: confirmarea cu un buton, din linkul paginii, apoi evaluarea doar din capitolele bifate.
    await page.locator("select").first().selectOption(mateId);
    await page.getByRole("button", { name: "Start Assessment" }).click();
    await page.getByRole("link", { name: "Confirmă capitolele →" }).click();
    await page.getByRole("button", { name: "Da, e corect — începe testul" }).click({ timeout: 30000 });
    await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 60000 });
    const taughtKeys = sql(`SELECT "unitKey" FROM "CurriculumCheck" WHERE "userId" = '${userId}' AND taught`).split("\n").filter(Boolean);
    const open = new Set(taughtKeys.flatMap((k) => UNITS[k] ?? []));
    const closed = sql(`SELECT DISTINCT topic FROM "Question" WHERE "domainId" = '${mateId}' AND status = 'PUBLISHED' AND type = 'MULTIPLE_CHOICE'`).split("\n").filter((t) => t && !open.has(t));
    check(open.size > 0 && closed.length > 0, `A după confirmare: ${open.size} capitole deschise, ${closed.length} închise`);
    const g2 = await page.request.get(`${BASE}/api/student/assessment?domainId=${mateId}`);
    const g2Body = await g2.json().catch(() => ({}));
    const topics = (g2Body.questions ?? []).map((q) => q.topic);
    check(g2.status() === 200 && topics.length > 0 && topics.every((t) => open.has(t)), `A evaluarea ia întrebări doar din capitolele bifate (${topics.length}: ${[...new Set(topics)].join(", ")})`);
    const outside = sql(`SELECT id FROM "Question" WHERE "domainId" = '${mateId}' AND status = 'PUBLISHED' AND topic = '${closed[0].replace(/'/g, "''")}' LIMIT 1`);
    const sessionsBefore = sql(`SELECT count(*) FROM "Session" WHERE "userId" = '${userId}' AND type = 'assessment'`);
    const p2 = await page.request.post(`${BASE}/api/student/assessment`, { data: { domainId: mateId, answers: [{ questionId: g2Body.questions[0].id, answer: "x" }, { questionId: outside, answer: "x" }] } });
    const p2Text = await p2.text();
    check(p2.status() === 409 && JSON.parse(p2Text).chaptersChanged === true && !p2Text.includes("correctAnswer"),
      `A un răspuns din afara capitolelor (ex. capitol debifat în timpul testului) → refuz, fără răspunsuri dezvăluite (${p2.status()})`);
    check(sql(`SELECT count(*) FROM "Session" WHERE "userId" = '${userId}' AND type = 'assessment'`) === sessionsBefore, "A refuzul nu creează o sesiune cu notă greșită");
    const p3 = await page.request.post(`${BASE}/api/student/assessment`, { data: { domainId: mateId, answers: g2Body.questions.slice(0, 3).map((q) => ({ questionId: q.id, answer: "x" })) } });
    const p3Body = await p3.json().catch(() => ({}));
    check(p3.status() === 200 && p3Body.totalQuestions === 3 && p3Body.results.every((r) => !r.error), `A răspunsurile din capitolele bifate sunt notate (${p3.status()})`);
    await page.goto(`${BASE}/ro/dashboard/assessment`, { waitUntil: "networkidle" });
    await page.locator("select").first().selectOption(mateId);
    await page.getByRole("button", { name: "Start Assessment" }).click();
    await page.getByText(/^Question 1 of \d+$/).waitFor({ timeout: 20000 }).catch(() => {});
    check(await page.getByText(/^Question 1 of \d+$/).isVisible(), "A pagina Evaluare pornește testul după confirmare");
    await page.screenshot({ path: `${OUT}A-evaluare-pornita.png` });
    await ctx.close();
  }

  // ── C: elev de clasa a IX-a pe BAC ──
  {
    const ctx = await browser.newContext(ctxOpts);
    const { page, userId } = await newStudent(ctx, "bac9", { d: 10, m: 3, y: 2011 });
    sql(`INSERT INTO "Enrollment" (id, "userId", "domainId", "updatedAt") VALUES ('qa-enr-${stamp}-3', '${userId}', '${BAC}', now()) ON CONFLICT DO NOTHING`);
    await page.goto(`${BASE}/ro/dashboard/practice?start=quick&domain=matematica-m1-ix-xii`, { waitUntil: "networkidle" });
    const heading = page.getByText("Toate capitolele materiei");
    await heading.waitFor({ timeout: 30000 }).catch(() => {});
    const boxes = await page.locator('input[type="checkbox"]').count();
    check(await heading.isVisible(), "C clasa a IX-a pe BAC: lista arată „Toate capitolele materiei”");
    check(boxes >= 40, `C lista nu mai e goală (${boxes} capitole de bifat)`);
    await page.screenshot({ path: `${OUT}C-bac-clasa-9.png`, fullPage: true });
    // Bifa făcută de mână nu schimbă lista în cardul „Da, e corect” (care ar spune că a bifat-o programa).
    await page.locator("li label").filter({ has: page.locator("span.flex-1", { hasText: /^Logaritmi$/ }) }).locator('input[type="checkbox"]').check();
    check(await page.getByText("Toate capitolele materiei").isVisible() && (await page.getByRole("button", { name: "Da, e corect — începe testul" }).count()) === 0,
      "C după prima bifă, lista rămâne pe ecran");
    await page.getByRole("button", { name: "Salvează și continuă" }).click();
    await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 60000 }).catch(() => {});
    const sid = new URL(page.url()).pathname.split("/").pop();
    const sTopics = sql(`SELECT DISTINCT q.topic FROM "Session" s, jsonb_array_elements_text(s.metadata->'questionIds') qid JOIN "Question" q ON q.id = qid WHERE s.id = '${(sid || "").replace(/[^a-z0-9]/gi, "")}'`);
    check(sTopics === "Logaritmi", `C după bifă, testul pornește doar pe capitolul bifat (${sTopics || "niciun test"})`);
    await ctx.close();
  }

  // ── D: pagina de intrare pe telefon ──
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
    check(await page.getByRole("heading", { name: "Intră în contul tău eTutor.ro" }).isVisible(), "D titlul: „Intră în contul tău eTutor.ro”");
    const items = [
      page.getByRole("link", { name: "Ai uitat parola?" }),
      page.getByRole("button", { name: "Primește un link de intrare pe email" }),
      page.getByRole("link", { name: "Nu ai email? Recuperează pe telefon" }),
    ];
    const boxes = await Promise.all(items.map((l) => l.boundingBox()));
    const stacked = boxes.every(Boolean) && boxes.every((b, i) => i === 0 || b.y >= boxes[i - 1].y + boxes[i - 1].height - 1) && boxes.every((b) => b.height >= 44);
    check(stacked, `D cele trei linkuri stau pe rânduri separate, fiecare de cel puțin 44 px (${boxes.map((b) => b && `${Math.round(b.y)}/${Math.round(b.height)}`).join(" · ")})`);
    const text = await page.locator("main, body").first().innerText();
    check(!/magic/i.test(text) && !/în Tutor\b/.test(text), "D fără „magic link” și fără „Tutor” fără „e”");
    await page.screenshot({ path: `${OUT}D-intrare.png` });
    await ctx.close();
  }
} finally {
  sql(`
    DELETE FROM "Attempt" WHERE "sessionId" IN (SELECT id FROM "Session" WHERE "domainId" IN ('${BAC}', '${CURS}'));
    DELETE FROM "Session" WHERE "domainId" IN ('${BAC}', '${CURS}');
    DELETE FROM "LessonProgress" WHERE "lessonId" = '${CURS}-l';
    DELETE FROM "Enrollment" WHERE "domainId" IN ('${BAC}', '${CURS}');
    DELETE FROM "Lesson" WHERE id = '${CURS}-l';
    DELETE FROM "CourseModule" WHERE id = '${CURS}-m';
    DELETE FROM "Course" WHERE id = '${CURS}-c';
    DELETE FROM "Question" WHERE "domainId" IN ('${BAC}', '${CURS}');
    DELETE FROM "Domain" WHERE id IN ('${BAC}', '${CURS}');
  `);
  await browser.close();
}
console.log(fail ? `\n${fail} verificări picate` : "\ntoate verificările au trecut");
process.exit(fail ? 1 : 0);
