// Verificarea reparațiilor din True E2E 2026-09-26, pe stiva QA locală (:3113 + tutor-qa-pg).
// Fiecare verificare pică pe codul vechi: codul de recuperare fără limită, resetarea parolei
// fără email și cu link în jurnal, emailul cu majuscule, ghidul care se oprea în eroarea
// „Curriculum setup required”, contul de copil fără datele de intrare, răspunsurile corecte
// scoase din altă materie, <html lang="en"> pe paginile românești.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-09-26/verificare-reparatii.mjs
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium, devices } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-09-26/capturi/reparatii";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-fix0926";
const PASS = "parola-fix-1234";
const results = [];
const check = (n, ok, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};
// Same key as the local build (tutor-qa-prod): the code is kept as HMAC(secret, "<account>:<code>").
const QA_SECRET = "local-qa-secret-not-real-0123456789abcdef";
const codeHash = (userId, code) => createHmac("sha256", QA_SECRET).update(`${userId}:${code}`).digest("hex");
let ipSeq = 0;
// Each group of calls comes from its own address, so the per-address limit (20/min on auth)
// doesn't mix the checks together. The limit itself is covered by the unit tests.
const newIp = () => `198.18.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const api = (path, body, ip) =>
  fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-real-ip": ip }, body: JSON.stringify(body) });

async function wipe() {
  const users = await prisma.user.findMany({ where: { OR: [{ email: { startsWith: TAG, mode: "insensitive" } }, { username: { startsWith: TAG } }] }, select: { id: true, email: true } });
  const ids = users.map((u) => u.id);
  await prisma.verificationToken.deleteMany({
    where: { OR: [...ids.flatMap((id) => [{ identifier: `otp:${id}` }, { identifier: `otp-fail:${id}` }, { identifier: `otp-sent:${id}` }]), ...users.filter((u) => u.email).flatMap((u) => [{ identifier: `reset:${u.email}` }, { identifier: `reset-sent:${u.email}` }])] },
  });
  await prisma.recipient.deleteMany({ where: { token: { startsWith: TAG } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: TAG } } });
}

async function signIn(page, email, password) {
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/signin"), { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function anonPage(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}

let browser;
try {
  await wipe();
  const s = Date.now().toString().slice(-6);
  const anyDomain = await prisma.domain.findFirst({ where: { slug: "matematica-v-viii" }, select: { id: true } });

  // ── A. Codul de recuperare: cinci greșeli, apoi mort; limită de coduri pe cont ──────────
  const otpUser = await prisma.user.create({ data: { username: `${TAG}otp${s}`, name: "OTP QA", password: await bcrypt.hash(PASS, 10) } });
  await prisma.recipient.create({ data: { domainId: anyDomain.id, lastName: "QA", firstName: "Otp", phone: `4070${s}99`, token: `${TAG}-r-${s}`, userId: otpUser.id } });
  const putCode = (code) =>
    prisma.verificationToken.create({ data: { identifier: `otp:${otpUser.id}`, token: codeHash(otpUser.id, code), expires: new Date(Date.now() + 600_000) } });
  const change = (cod, parolaNoua, ip) => api("/api/auth/recuperare/schimba", { identificator: otpUser.username, cod, parolaNoua }, ip);

  await putCode("482913");
  let ip = newIp();
  const wrong = [];
  for (const c of ["000001", "000002", "000003", "000004", "000005"]) wrong.push((await change(c, "parola-noua-1", ip)).status);
  check("A1 cinci coduri greșite → 400 fiecare", wrong.every((x) => x === 400), wrong.join(","));
  const leftA = await prisma.verificationToken.count({ where: { identifier: { in: [`otp:${otpUser.id}`, `otp-fail:${otpUser.id}`] } } });
  check("A2 după a cincea greșeală codul e șters (și contorul)", leftA === 0, `rânduri rămase: ${leftA}`);
  const late = await change("482913", "parola-noua-1", ip);
  const pwStill = await bcrypt.compare(PASS, (await prisma.user.findUnique({ where: { id: otpUser.id } })).password);
  check("A3 codul bun, dar după cele cinci greșeli → refuzat, parola neschimbată", late.status === 400 && pwStill, `${late.status}`);

  await putCode("715204");
  ip = newIp();
  const ok = await change("715204", "parola-noua-2", ip);
  const pwNew = await bcrypt.compare("parola-noua-2", (await prisma.user.findUnique({ where: { id: otpUser.id } })).password);
  check("A4 un cod nou, bun → 200 și parola schimbată", ok.status === 200 && pwNew, `${ok.status}`);

  await putCode("300400");
  ip = newIp();
  const burst = await Promise.all(Array.from({ length: 12 }, (_, i) => change(String(900000 + i), "parola-noua-3", ip).then((r) => r.status)));
  const failsAfterBurst = await prisma.verificationToken.count({ where: { identifier: `otp-fail:${otpUser.id}` } });
  const aliveAfterBurst = (await prisma.verificationToken.count({ where: { identifier: `otp:${otpUser.id}` } })) > 0;
  // Attempts that find the account busy are refused without counting, so the burst may leave the
  // code alive — but never with more than 4 counted mistakes on it.
  check("A5 12 încercări greșite simultan → toate 400, nicio trecere peste limită", burst.every((x) => x === 400) && (!aliveAfterBurst || failsAfterBurst <= 4), `${burst.join(",")} · greșeli numărate: ${failsAfterBurst} · cod viu: ${aliveAfterBurst}`);
  let extra = 0;
  while ((await prisma.verificationToken.count({ where: { identifier: `otp:${otpUser.id}` } })) > 0 && extra < 10) {
    await change(String(800000 + extra), "parola-noua-3", ip);
    extra++;
  }
  check("A5b în total codul moare exact la a cincea greșeală numărată", aliveAfterBurst ? failsAfterBurst + extra === 5 : true, `numărate în rafală ${failsAfterBurst} + pe rând ${extra}`);
  const late2 = await change("300400", "parola-noua-3", ip);
  check("A5c după ce a murit, nici codul bun nu mai merge", late2.status === 400, `${late2.status}`);

  ip = newIp();
  const hashes = [];
  for (let i = 0; i < 6; i++) {
    await api("/api/auth/recuperare/cere", { identificator: otpUser.username }, ip);
    hashes.push((await prisma.verificationToken.findFirst({ where: { identifier: `otp:${otpUser.id}` } }))?.token ?? null);
  }
  const sent = await prisma.verificationToken.count({ where: { identifier: `otp-sent:${otpUser.id}` } });
  check("A6 șase cereri de cod → doar cinci coduri emise, al șaselea nu schimbă nimic", sent === 5 && new Set(hashes.slice(0, 5)).size === 5 && hashes[5] === hashes[4], `trimise ${sent}`);

  // ── B. Resetarea parolei pe email ─────────────────────────────────────────────────
  const resetEmail = `${TAG}-reset-${s}@demo.tutor.app`;
  await prisma.user.create({ data: { email: resetEmail, name: "Reset QA", password: await bcrypt.hash(PASS, 10) } });
  ip = newIp();
  const f1 = await api("/api/auth/forgot-password", { email: resetEmail.toUpperCase(), locale: "ro" }, ip);
  const tok1 = await prisma.verificationToken.findFirst({ where: { identifier: `reset:${resetEmail}` } });
  check("B1 cererea cu emailul scris cu MAJUSCULE găsește contul și face linkul", f1.status === 200 && !!tok1, `${f1.status}`);
  const f2 = await api("/api/auth/forgot-password", { email: resetEmail, locale: "ro" }, ip);
  const tok2 = await prisma.verificationToken.findFirst({ where: { identifier: `reset:${resetEmail}` } });
  check("B2 a doua cerere în 2 minute nu trimite alt link (fără inundat căsuța)", f2.status === 200 && tok2?.token === tok1?.token);
  const r1 = await api("/api/auth/reset-password", { email: resetEmail, token: tok1.token, password: "parola-reset-9" }, ip);
  const pwReset = await bcrypt.compare("parola-reset-9", (await prisma.user.findFirst({ where: { email: resetEmail } })).password);
  check("B3 linkul schimbă parola", r1.status === 200 && pwReset, `${r1.status}`);

  // ── C. Emailul cu majuscule la înregistrare ────────────────────────────────────────
  const mixed = `QA-Fix0926-Elev-${s}@Demo.Tutor.App`;
  ip = newIp();
  const reg = await api("/api/auth/register", { name: "Elev QA", email: mixed, password: PASS, role: "STUDENT" }, ip);
  const stored = await prisma.user.findFirst({ where: { email: { equals: mixed, mode: "insensitive" } }, select: { email: true } });
  check("C1 înregistrarea salvează emailul cu litere mici", reg.status === 201 || reg.status === 200 ? stored?.email === mixed.toLowerCase() : false, `${reg.status} → ${stored?.email}`);
  const dup = await api("/api/auth/register", { name: "Elev QA", email: mixed.toLowerCase(), password: PASS, role: "STUDENT" }, ip);
  check("C2 același email scris altfel nu face un al doilea cont", dup.status === 409, `${dup.status}`);

  // ── D. Ghidul de pornire pe o materie cu programă ────────────────────────────────
  browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await signIn(page, mixed.toUpperCase(), PASS);
  check("C3 intrarea cu emailul scris cu MAJUSCULE merge", !page.url().includes("/auth/signin"), page.url().replace(BASE, ""));
  await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const mate = page.locator("main section button").filter({ hasText: /Matematic/ }).first();
  check("D1 ghidul oferă Matematica cl. VIII", (await mate.count()) > 0);
  await mate.click();
  await page.waitForTimeout(1500);
  await page.locator("main button").filter({ hasText: /Începe testul/ }).first().click();
  await page.waitForURL(/\/dashboard\/practice\?/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${SHOTS}/d-poarta.png` });
  const body = await page.locator("body").innerText();
  check("D2 fără eroarea în engleză „Curriculum setup required”", !/Curriculum setup required/i.test(body));
  check("D3 explicația în română și lista de bifat sunt pe ecran", /bifează ce s-a predat/.test(body) && /Materia parcursă la școală/.test(body));
  await page.locator("select").first().selectOption({ index: 1 }).catch(() => {});
  await page.waitForTimeout(1500);
  const boxes = page.locator('input[type="checkbox"]');
  const nb = await boxes.count();
  for (let i = 0; i < nb; i++) await boxes.nth(i).check().catch(() => {});
  await page.locator("button", { hasText: /Salvează și continuă/ }).first().click();
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/d-prima-intrebare.png` });
  const onQ = await page.locator("text=/Întrebarea 1 din/").count();
  check("D4 după salvare testul pornește singur, fără încă o apăsare", onQ > 0, `${nb} bife · ${page.url().replace(BASE, "")}`);

  // ── E. Copilul creat de părinte ─────────────────────────────────────────────────
  const parentEmail = `${TAG}-parinte-${s}@demo.tutor.app`;
  await prisma.user.create({ data: { email: parentEmail, name: "Părinte QA", password: await bcrypt.hash(PASS, 10), freeForever: true, accountRole: "PARENT" } });
  const pctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const pp = await pctx.newPage();
  await signIn(pp, parentEmail, PASS);
  await pp.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  await pp.locator("button", { hasText: /Adaugă copil/ }).first().click();
  await pp.waitForTimeout(800);
  await pp.locator("button", { hasText: /Creează contul direct/ }).first().click();
  await pp.waitForTimeout(600);
  const childEmail = `${TAG}-Copil-${s}@Demo.Tutor.App`;
  await pp.getByPlaceholder("Numele copilului").fill("Copil QA");
  await pp.getByPlaceholder("email@exemplu.ro").fill(childEmail);
  await pp.getByPlaceholder("Parolă (min. 8 caractere)").fill(PASS);
  check("E1 parola copilului are buton de afișare", (await pp.getByRole("button", { name: "Arată parola" }).count()) > 0);
  await pp.locator("button", { hasText: /Creează contul copilului/ }).first().click();
  await pp.waitForTimeout(2500);
  await pp.screenshot({ path: `${SHOTS}/e-copil-creat.png` });
  const card = await pp.locator("body").innerText();
  check("E2 după creare părintele vede emailul (cu litere mici) și parola de dat copilului", card.includes("Contul copilului e gata") && card.includes(childEmail.toLowerCase()) && card.includes(PASS));
  await pp.locator("button", { hasText: /Gata, am notat/ }).first().click();
  await pp.waitForTimeout(1500);
  check("E3 „Gata, am notat” închide cartonașul (parola nu mai rămâne pe ecran)", !(await pp.locator("body").innerText()).includes(PASS));
  const cctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const cp = await cctx.newPage();
  await signIn(cp, childEmail, PASS);
  check("E4 copilul intră cu emailul exact cum l-a scris părintele", !cp.url().includes("/auth/signin"), cp.url().replace(BASE, ""));
  // A second child, and the panel closed with „Închide” instead of „Gata, am notat”.
  await pp.locator("button", { hasText: /Adaugă copil/ }).first().click();
  await pp.waitForTimeout(800);
  await pp.locator("button", { hasText: /Creează contul direct/ }).first().click();
  await pp.waitForTimeout(600);
  await pp.getByPlaceholder("Numele copilului").fill("Al Doilea QA");
  await pp.getByPlaceholder("email@exemplu.ro").fill(`${TAG}-copil3-${s}@demo.tutor.app`);
  await pp.getByPlaceholder("Parolă (min. 8 caractere)").fill(PASS);
  await pp.locator("button", { hasText: /Creează contul copilului/ }).first().click();
  await pp.waitForTimeout(2500);
  const cardStill = (await pp.locator("body").innerText()).includes("Contul copilului e gata");
  await pp.locator("button", { hasText: /^Închide$/ }).first().click();
  await pp.waitForTimeout(1500);
  await pp.screenshot({ path: `${SHOTS}/e-lista-dupa-inchide.png` });
  check("M6 cartonașul rămâne pe ecran, iar după „Închide” copilul e deja în listă (fără reîncărcare)", cardStill && (await pp.locator("body").innerText()).includes("Al Doilea QA"));

  // Same email again: the parent reads a Romanian sentence, never a server code.
  await pp.locator("button", { hasText: /Adaugă copil/ }).first().click();
  await pp.waitForTimeout(800);
  await pp.locator("button", { hasText: /Creează contul direct/ }).first().click();
  await pp.waitForTimeout(600);
  await pp.getByPlaceholder("Numele copilului").fill("Copil QA");
  await pp.getByPlaceholder("email@exemplu.ro").fill(childEmail.toLowerCase());
  await pp.getByPlaceholder("Parolă (min. 8 caractere)").fill(PASS);
  await pp.locator("button", { hasText: /Creează contul copilului/ }).first().click();
  await pp.waitForTimeout(2500);
  await pp.screenshot({ path: `${SHOTS}/e-copil-dublu.png` });
  const dupText = await pp.locator("body").innerText();
  // What the server answered for the same request, to know which sentence the parent must see.
  const dupApi = await pp.evaluate(async ([e, pw]) => {
    const r = await fetch("/api/dashboard/family/direct", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Copil QA", email: e, password: pw }) });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  }, [childEmail.toLowerCase(), PASS]);
  const expected = dupApi.body.seat?.message ?? dupApi.body.error;
  check("E5 același email a doua oară → mesajul serverului scris pentru părinte, nu un cod", dupApi.status === 409 && typeof expected === "string" && expected !== "seat_unavailable" && dupText.includes(expected) && !/seat_unavailable|Invalid input|Unauthorized/.test(dupText), `${dupApi.status} · ${expected}`);

  // ── I. Invitație pentru al doilea părinte, fără cont ─────────────────────────────
  const invite = (target) =>
    pp.evaluate(async (t) => {
      const r = await fetch("/api/dashboard/family/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target: t, channel: "CODE" }) });
      return r.json();
    }, target);
  const inv = await invite("PARENT");
  const acceptPath = new URL(inv.acceptUrl).pathname;
  const p2ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const p2 = await p2ctx.newPage();
  await p2.goto(`${BASE}${acceptPath}`, { waitUntil: "networkidle" });
  await p2.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await p2.getByRole("link", { name: "Fă-ți cont" }).click();
  await p2.waitForURL(/\/auth\/register/, { timeout: 15000 }).catch(() => {});
  await p2.waitForLoadState("networkidle");
  const p2Email = `${TAG}-parinte2-${s}@demo.tutor.app`;
  const fields = p2.locator("form input:not([type=checkbox]):not([type=hidden])");
  await fields.nth(0).fill("Părinte Doi QA");
  await fields.nth(1).fill(p2Email);
  await fields.nth(2).fill(PASS);
  await fields.nth(3).fill(PASS);
  const p2boxes = p2.locator("form input[type=checkbox]");
  if (await p2boxes.count()) await p2boxes.first().check();
  await p2.locator("form button[type=submit]").click();
  await p2.waitForURL((u) => u.pathname.includes("/family/accept/"), { timeout: 30000 }).catch(() => {});
  await p2.waitForLoadState("networkidle");
  await p2.screenshot({ path: `${SHOTS}/i-inapoi-la-invitatie.png` });
  const p2Row = await prisma.user.findFirst({ where: { email: p2Email }, select: { accountRole: true } });
  check("I1 contul făcut din invitație e de părinte, nu de elev", p2Row?.accountRole === "PARENT", `${p2Row?.accountRole}`);
  check("I2 după înregistrare ajunge înapoi la invitație, gata de acceptat", p2.url().includes(acceptPath) && (await p2.locator("button", { hasText: /Accept ca părinte/ }).count()) > 0, p2.url().replace(BASE, ""));

  // ── J. Cod de familie pentru copil, fără cont ───────────────────────────────────
  const invC = await invite("CHILD");
  const kctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const kp = await kctx.newPage();
  await kp.goto(`${BASE}/ro/family/join`, { waitUntil: "networkidle" });
  await kp.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await kp.getByPlaceholder("ex. ABCD2345").fill(invC.code);
  await kp.locator("button", { hasText: /Verifică codul/ }).click();
  await kp.waitForTimeout(1200);
  await kp.locator("main button", { hasText: /^Accept$/ }).click();
  await kp.waitForURL(/\/auth\/signin/, { timeout: 15000 }).catch(() => {});
  await kp.getByRole("link", { name: "Fă-ți unul" }).click();
  await kp.waitForURL(/\/auth\/register/, { timeout: 15000 }).catch(() => {});
  await kp.waitForLoadState("networkidle");
  const kEmail = `${TAG}-copil2-${s}@demo.tutor.app`;
  const kf = kp.locator("form input:not([type=checkbox]):not([type=hidden])");
  await kf.nth(0).fill("Copil Doi QA");
  await kf.nth(1).fill(kEmail);
  await kf.nth(2).fill(PASS);
  await kf.nth(3).fill(PASS);
  const kb = kp.locator("form input[type=checkbox]");
  if (await kb.count()) await kb.first().check();
  await kp.locator("form button[type=submit]").click();
  await kp.waitForURL((u) => u.pathname.includes("/family/join"), { timeout: 30000 }).catch(() => {});
  await kp.waitForLoadState("networkidle");
  await kp.waitForTimeout(800);
  await kp.screenshot({ path: `${SHOTS}/j-inapoi-la-cod.png` });
  const boxVal = await kp.getByPlaceholder("ex. ABCD2345").inputValue().catch(() => "");
  check("J1 după cont nou, pagina codului de familie revine cu codul deja scris", kp.url().includes("/family/join") && boxVal.toUpperCase() === String(invC.code).toUpperCase(), `${kp.url().replace(BASE, "")} · „${boxVal}”`);

  // ── K. Contul cu email nedovedit nu se ia prin linkul pe email; parola nouă închide sesiunile ──
  const regRow = await prisma.user.findFirst({ where: { email: mixed.toLowerCase() }, select: { emailVerified: true } });
  check("K1 înregistrarea nu mai dă emailul drept dovedit", regRow && regRow.emailVerified === null, `${regRow?.emailVerified}`);
  const mctx = await browser.newContext({ locale: "ro-RO" });
  const mp = await mctx.newPage();
  await mp.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await mp.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await mp.locator("button", { hasText: /link/i }).first().click();
  await mp.waitForTimeout(500);
  await mp.fill("#email-magic", mixed.toLowerCase());
  await mp.locator("#email-magic").locator("xpath=ancestor::form").locator('button[type="submit"]').click();
  await mp.waitForTimeout(2500);
  await mp.screenshot({ path: `${SHOTS}/k-link-refuzat.png` });
  const mt = await mp.locator("body").innerText();
  const tokensForIt = await prisma.verificationToken.count({ where: { identifier: mixed.toLowerCase() } });
  check("K2 linkul pe email e refuzat pentru un cont cu parolă și email nedovedit (nimic trimis)", /La acest cont se intră cu parola/.test(mt) && tokensForIt === 0, `tokenuri de link: ${tokensForIt}`);

  // Session A signed in (context `page` is signed in as `mixed` since C3). Reset the password by email.
  const sessBefore = await page.evaluate(async () => (await (await fetch("/api/auth/session")).json())?.user?.email ?? null);
  ip = newIp();
  await api("/api/auth/forgot-password", { email: mixed.toLowerCase(), locale: "ro" }, ip);
  const rt = await prisma.verificationToken.findFirst({ where: { identifier: `reset:${mixed.toLowerCase()}` } });
  const rr = await api("/api/auth/reset-password", { email: mixed.toLowerCase(), token: rt?.token ?? "x", password: "parola-dupa-reset-7" }, ip);
  const afterReset = await prisma.user.findFirst({ where: { email: mixed.toLowerCase() }, select: { emailVerified: true, sessionVersion: true } });
  check("K3 resetarea pe email dovedește emailul și ridică versiunea sesiunii", rr.status === 200 && !!afterReset?.emailVerified && afterReset.sessionVersion === 1, `${rr.status} · v${afterReset?.sessionVersion}`);
  // Force the refresh that normally happens within 5 minutes.
  const sessAfter = await page.evaluate(async () => {
    const { csrfToken } = await (await fetch("/api/auth/csrf")).json();
    await fetch("/api/auth/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csrfToken, data: {} }) });
    return (await (await fetch("/api/auth/session")).json())?.user?.email ?? null;
  });
  check("K4 sesiunea deschisă înainte de resetare se închide", !!sessBefore && sessAfter === null, `înainte: ${sessBefore} · după: ${sessAfter}`);
  const nctx = await browser.newContext({ locale: "ro-RO" });
  const np = await nctx.newPage();
  await signIn(np, mixed.toLowerCase(), "parola-dupa-reset-7");
  const newSess = await np.evaluate(async () => (await (await fetch("/api/auth/session")).json())?.user?.email ?? null);
  check("K5 cu parola nouă se intră normal", newSess === mixed.toLowerCase(), `${newSess}`);

  // ── L. A doua revizie: limita de linkuri, contul luat prin Google, textele ─────────
  const capEmail = `${TAG}-cap-${s}@demo.tutor.app`;
  await prisma.user.create({ data: { email: capEmail, name: "Cap QA", password: await bcrypt.hash(PASS, 10) } });
  await prisma.verificationToken.createMany({
    data: Array.from({ length: 5 }, (_, i) => ({ identifier: `reset-sent:${capEmail}`, token: `${TAG}-sent-${s}-${i}`, expires: new Date(Date.now() + 3_000_000) })),
  });
  ip = newIp();
  const capRes = await api("/api/auth/forgot-password", { email: capEmail, locale: "ro" }, ip);
  const capTok = await prisma.verificationToken.count({ where: { identifier: `reset:${capEmail}` } });
  check("L1 după cinci linkuri într-o oră, al șaselea nu se mai trimite (răspunsul rămâne același)", capRes.status === 200 && capTok === 0, `${capRes.status} · linkuri noi: ${capTok}`);

  // Someone made an account on another person's email and linked Google to it; the owner resets.
  const hijEmail = `${TAG}-hij-${s}@demo.tutor.app`;
  const hij = await prisma.user.create({ data: { email: hijEmail, name: "Hij QA", password: await bcrypt.hash(PASS, 10), emailVerified: null } });
  await prisma.account.create({ data: { userId: hij.id, type: "oidc", provider: "google", providerAccountId: `${TAG}-g-${s}` } });
  ip = newIp();
  await api("/api/auth/forgot-password", { email: hijEmail, locale: "ro" }, ip);
  const hijTok = await prisma.verificationToken.findFirst({ where: { identifier: `reset:${hijEmail}` } });
  const hijRes = await api("/api/auth/reset-password", { email: hijEmail, token: hijTok?.token ?? "x", password: "parola-proprietar-8" }, ip);
  const hijAfter = await prisma.user.findUnique({ where: { id: hij.id }, select: { emailVerified: true, _count: { select: { accounts: true } } } });
  check("L2 resetarea pe un email nedovedit scoate intrările Google puse de altcineva", hijRes.status === 200 && hijAfter._count.accounts === 0 && !!hijAfter.emailVerified, `${hijRes.status} · conturi legate: ${hijAfter._count.accounts}`);

  // A row stored with capitals (made before emails were lowercased).
  const capsStored = `QA-Fix0926-Majuscule-${s}@Demo.Tutor.App`;
  await prisma.user.create({ data: { email: capsStored, name: "Majuscule QA", password: await bcrypt.hash(PASS, 10) } });
  ip = newIp();
  await api("/api/auth/forgot-password", { email: capsStored.toLowerCase(), locale: "ro" }, ip);
  const capsTok = await prisma.verificationToken.findFirst({ where: { identifier: `reset:${capsStored}` } });
  const capsReset = await api("/api/auth/reset-password", { email: capsStored, token: capsTok?.token ?? "x", password: "parola-majuscule-6" }, ip);
  check("L3 un cont vechi salvat cu majuscule își poate reseta parola cerând-o cu litere mici", !!capsTok && capsReset.status === 200, `link: ${!!capsTok} · ${capsReset.status}`);
  const lctx = await browser.newContext({ locale: "ro-RO" });
  const lp = await lctx.newPage();
  await signIn(lp, capsStored.toLowerCase(), "parola-majuscule-6");
  check("L4 și intră cu emailul scris cu litere mici", !lp.url().includes("/auth/signin"), lp.url().replace(BASE, ""));

  const ap = await (await browser.newContext({ locale: "ro-RO" })).newPage();
  await anonPage(ap, "/ro/auth/signin?error=AccessDenied");
  check("L5 ?error=AccessDenied explică intrarea cu parola", /La acest cont se intră cu parola/.test(await ap.locator("body").innerText()));
  await anonPage(ap, "/ro/auth/signin?error=OAuthAccountNotLinked");
  check("L6 ?error=OAuthAccountNotLinked spune că emailul are cont făcut altfel decât cu Google", /făcut altfel decât cu Google/.test(await ap.locator("body").innerText()));
  const signinHtml = await (await fetch(`${BASE}/ro/auth/signin`)).text();
  check("L7 pe pagina românească de intrare nu mai e „Enter your password”", !signinHtml.includes("Enter your password"));

  // An account whose email is proven asks for a link; on this stack no email can leave.
  const provEmail = `${TAG}-prov-${s}@demo.tutor.app`;
  await prisma.user.create({ data: { email: provEmail, name: "Prov QA", emailVerified: new Date() } });
  const pctx2 = await browser.newContext({ locale: "ro-RO" });
  const pg2 = await pctx2.newPage();
  await pg2.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await pg2.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await pg2.locator("button", { hasText: /link/i }).first().click();
  await pg2.waitForTimeout(500);
  await pg2.fill("#email-magic", provEmail);
  await pg2.locator("#email-magic").locator("xpath=ancestor::form").locator('button[type="submit"]').click();
  await pg2.waitForTimeout(3000);
  await pg2.screenshot({ path: `${SHOTS}/l-link-netrimis.png` });
  const pgt = await pg2.locator("body").innerText();
  check("L8 dacă emailul cu linkul nu pleacă, pagina nu spune „Verifică-ți email-ul”", !/Verifică-ți email-ul/.test(pgt) && /Nu am putut trimite|n-a reușit/.test(pgt), pgt.replace(/\s+/g, " ").slice(0, 120));

  const rctx = await browser.newContext({ locale: "ro-RO" });
  const rp = await rctx.newPage();
  await rp.goto(`${BASE}/ro/auth/register`, { waitUntil: "networkidle" });
  await rp.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  const rin = rp.locator("form input:not([type=checkbox]):not([type=hidden])");
  await rin.nth(0).fill("Dublu QA");
  await rin.nth(1).fill(capEmail);
  await rin.nth(2).fill(PASS);
  await rin.nth(3).fill(PASS);
  const rbox = rp.locator("form input[type=checkbox]");
  if (await rbox.count()) await rbox.first().check().catch(() => {});
  await rp.locator("form button[type=submit]").click();
  await rp.waitForTimeout(2500);
  await rp.screenshot({ path: `${SHOTS}/l-inregistrare-dubla.png` });
  const rtext = await rp.locator("body").innerText();
  check("L9 înregistrarea cu un email deja folosit spune, în română, ce e de făcut", /Există deja un cont cu acest email/.test(rtext) && !/An account with this email already exists/.test(rtext));

  // ── M. A treia revizie: analiza de trafic, rafale, conturi dublate, rolul, lista familiei ──
  const home = await (await fetch(`${BASE}/ro`)).text();
  const scrubJs = await fetch(`${BASE}/umami-scrub.js`);
  check("M1 analiza de trafic trece prin curățitor (cheile din adresă nu pleacă)", /data-before-send="etutorUmamiScrub"/.test(home) && home.indexOf("/umami-scrub.js") < home.indexOf("analytics.knowbest.ro/script.js") && scrubJs.status === 200, `script ${scrubJs.status}`);

  const burstEmail = `${TAG}-burst-${s}@demo.tutor.app`;
  await prisma.user.create({ data: { email: burstEmail, name: "Burst QA", password: await bcrypt.hash(PASS, 10) } });
  const burstIp = newIp();
  const burstCodes = await Promise.all(Array.from({ length: 12 }, () => api("/api/auth/forgot-password", { email: burstEmail, locale: "ro" }, burstIp).then((r) => r.status)));
  const burstLinks = await prisma.verificationToken.count({ where: { identifier: `reset:${burstEmail}` } });
  const burstSent = await prisma.verificationToken.count({ where: { identifier: `reset-sent:${burstEmail}` } });
  check("M2 12 cereri de resetare trimise deodată → un singur link, un singur email", burstCodes.every((c) => c === 200) && burstLinks === 1 && burstSent === 1, `${burstCodes.join(",")} · linkuri ${burstLinks} · trimise ${burstSent}`);

  // Two older rows differing only in capitals (the migration leaves such a pair alone).
  const pairLower = `${TAG}-pair-${s}@demo.tutor.app`;
  await prisma.user.create({ data: { email: `QA-Fix0926-Pair-${s}@Demo.Tutor.App`, name: "Pair A", password: await bcrypt.hash(PASS, 10) } });
  const twin = await api("/api/auth/register", { name: "Pair B", email: pairLower, password: PASS, role: "STUDENT" }, newIp());
  check("M3 înregistrarea refuză un email pe care îl are deja un cont vechi scris cu majuscule", twin.status === 409, `${twin.status}`);

  const jp = await (await browser.newContext({ locale: "ro-RO" })).newPage();
  await anonPage(jp, `/ro/auth/signin?callbackUrl=${encodeURIComponent("/family/join?code=ABCD1234")}&role=PARENT`);
  const regHref = await jp.locator("a", { hasText: /Fă-ți unul/ }).first().getAttribute("href");
  check("M4 din codul de familie, „Fă-ți unul” păstrează rolul de părinte", !!regHref && regHref.includes("role=PARENT") && regHref.includes("callbackUrl="), `${regHref}`);

  const ep = await (await browser.newContext({ locale: "ro-RO" })).newPage();
  let magicBody = "";
  ep.on("request", (r) => { if (r.url().includes("/api/auth/signin/resend")) magicBody = r.postData() ?? ""; });
  await anonPage(ep, "/ro/auth/signin?error=Verification");
  const addrAfter = ep.url();
  await ep.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await ep.locator("button", { hasText: /link/i }).first().click();
  await ep.waitForTimeout(500);
  await ep.fill("#email-magic", provEmail);
  await ep.locator("#email-magic").locator("xpath=ancestor::form").locator('button[type="submit"]').click();
  await ep.waitForTimeout(2500);
  const cbSent = decodeURIComponent(new URLSearchParams(magicBody).get("callbackUrl") ?? "");
  check("M5 linkul de intrare duce în panou, nu înapoi pe pagina cu eroarea veche", !addrAfter.includes("error=") && /\/ro\/dashboard$/.test(cbSent), `adresa: ${addrAfter.replace(BASE, "")} · destinație: ${cbSent}`);

  // Back to the sign-in page after an error shows the sign-in page, not the one left from it.
  const bp = await (await browser.newContext({ locale: "ro-RO" })).newPage();
  await anonPage(bp, `/ro/auth/signin?callbackUrl=${encodeURIComponent("/dashboard")}&error=OAuthAccountNotLinked`);
  const errShown = /făcut altfel decât cu Google/.test(await bp.locator("body").innerText());
  const stateKept = await bp.evaluate(() => window.history.state !== null);
  await bp.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await bp.locator("a", { hasText: /Fă-ți unul/ }).first().click();
  await bp.waitForURL(/\/auth\/register/, { timeout: 15000 }).catch(() => {});
  await bp.waitForTimeout(800);
  await bp.goBack();
  await bp.waitForTimeout(1500);
  const backText = await bp.locator("body").innerText();
  check("M7 după o eroare de intrare, „Înapoi” readuce pagina de intrare (nu pe cea de cont nou)", errShown && stateKept && /\/auth\/signin/.test(bp.url()) && !bp.url().includes("error=") && /Nu ai cont\?/.test(backText) && !/Confirmă parola|Confirm password/.test(backText), `${bp.url().replace(BASE, "")} · state ${stateKept}`);

  // A reset link sent before the emails were lowercased: the token keeps the old spelling.
  const oldSpell = `QA-Fix0926-Vechi-${s}@Demo.Tutor.App`;
  await prisma.user.create({ data: { email: oldSpell.toLowerCase(), name: "Vechi QA", password: await bcrypt.hash(PASS, 10) } });
  await prisma.verificationToken.create({ data: { identifier: `reset:${oldSpell}`, token: `${TAG}-old-${s}`, expires: new Date(Date.now() + 3_000_000) } });
  const oldRes = await api("/api/auth/reset-password", { email: oldSpell, token: `${TAG}-old-${s}`, password: "parola-veche-link-5" }, newIp());
  await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${oldSpell}` } });
  check("M8 un link de resetare trimis înainte de trecerea pe litere mici încă merge", oldRes.status === 200, `${oldRes.status}`);

  // Guessing codes: 20 unknown codes from one address, then even a lookup is refused there.
  const sessCookie = (await nctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const activate = (code, ipAddr) =>
    fetch(`${BASE}/api/activate`, { method: "POST", headers: { "content-type": "application/json", "x-real-ip": ipAddr, cookie: sessCookie }, body: JSON.stringify({ voucherCode: code, domainSlugs: ["matematica-v-viii"] }) }).then((r) => r.status);
  const guessIp = newIp();
  const guesses = [];
  for (let i = 0; i < 20; i++) guesses.push(await activate(`QAFIXNOPE${s}${i}`, guessIp));
  const after20 = await activate(`QAFIXNOPE${s}X`, guessIp);
  const otherIp = await activate(`QAFIXNOPE${s}Y`, newIp());
  const realCode = `QAFIXREAL${s}`;
  await prisma.voucher.create({ data: { code: realCode, discountPercent: 30, createdById: otpUser.id } });
  const realIp = newIp();
  const realRuns = [];
  for (let i = 0; i < 25; i++) realRuns.push(await activate(realCode, realIp));
  check("M10 25 de familii cu un cod adevărat, de pe aceeași rețea, nu sunt blocate", realRuns.every((c) => c !== 429), `${[...new Set(realRuns)].join(",")}`);
  check("M9 după 20 de coduri inexistente de pe o adresă, acolo nu se mai caută coduri; alte adrese merg", guesses.every((c) => c === 404) && after20 === 429 && otherIp === 404, `${guesses[0]}×20 → ${after20} · altă adresă ${otherIp}`);

  // ── F. Paginile de parolă uitată, în limba paginii ────────────────────────────────
  await page.goto(`${BASE}/ro/auth/forgot-password`, { waitUntil: "networkidle" });
  const fro = await page.locator("body").innerText();
  check("F1 /ro/auth/forgot-password e în română", /Ai uitat parola\?/.test(fro) && !/Forgot password|Send reset link/.test(fro));
  await page.goto(`${BASE}/ro/auth/reset-password?token=gresit&email=a%40b.ro`, { waitUntil: "networkidle" });
  await page.fill("#new-password", "parola-lunga-1");
  await page.fill("#confirm-password", "parola-lunga-1");
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/f-link-gresit.png` });
  check("F2 un link greșit primește mesaj în română, nu textul serverului", /Linkul de resetare e greșit/.test(await page.locator("body").innerText()));
  await page.goto(`${BASE}/en/auth/forgot-password`, { waitUntil: "networkidle" });
  check("F3 /en/auth/forgot-password e în engleză", /Forgot your password\?/.test(await page.locator("body").innerText()));
  const anon = await (await browser.newContext({ locale: "ro-RO" })).newPage();
  await anon.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  const sro = await anon.locator("body").innerText();
  check("F4 pagina de intrare în română nu mai are „Don't have an account?”", /Nu ai cont\?/.test(sro) && !/Don't have an account/.test(sro));
  await anon.goto(`${BASE}/ro/auth/signin?error=Verification`, { waitUntil: "networkidle" });
  check("F5 un link de intrare expirat e explicat în română", /Linkul de intrare a expirat/.test(await anon.locator("body").innerText()));

  // ── G. <html lang> ────────────────────────────────────────────────────────────────
  const langRo = await (await fetch(`${BASE}/ro`)).text();
  const langEn = await (await fetch(`${BASE}/en`)).text();
  check("G1 /ro are <html lang=\"ro\"> și /en are lang=\"en\"", /<html lang="ro"/.test(langRo) && /<html lang="en"/.test(langEn));

  // ── H. Evaluarea nu mai dă răspunsuri din altă materie ──────────────────────────
  const priv = await prisma.domain.create({ data: { name: `Privat QA ${s}`, slug: `${TAG}-privat-${s}`, isActive: true, visibility: "PRIVATE" } });
  const secret = await prisma.question.create({ data: { domainId: priv.id, subject: "S", topic: "T", content: "Întrebare privată?", options: ["a", "b", "c", "d"], correctAnswer: "RASPUNS-SECRET", status: "PUBLISHED" } });
  // `page` was signed out on purpose by K4; `np` is the same student, signed in with the new password.
  const res = await np.evaluate(
    async ([d, q]) => {
      const r = await fetch("/api/student/assessment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domainId: d, answers: [{ questionId: q, answer: "x" }] }) });
      return { status: r.status, text: await r.text() };
    },
    [anyDomain.id, secret.id]
  );
  check("H1 o întrebare din altă materie nu își dezvăluie răspunsul", res.status === 200 && !res.text.includes("RASPUNS-SECRET"), `${res.status} ${res.text.slice(0, 140)}`);

  check("fără erori în pagină", errs.length === 0, errs.join(" | "));
} catch (e) {
  console.error(e);
  results.push(false);
} finally {
  await browser?.close();
  await wipe();
  await prisma.$disconnect();
  const n = results.filter(Boolean).length;
  console.log(`\n${n}/${results.length} ${n === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(n === results.length ? 0 : 1);
}
