// Verificarea livrării din 29.09.2026, pe stiva QA locală: Tutor :3113 (tutor_qa) + Legal Hub :3120 (legal_ga).
// Cu date adevărate și cron-ul adevărat (/api/cron/account-retention), după a doua verificare independentă:
//   R  remindere către părintele care n-a răspuns — ziua 7, 30, 35, o singură dată, pe perioada de așteptare
//      curentă, cu același link (valabil până la data numită), fără ofertă; conturi plătite (text potrivit);
//      reminder respins de server → reîncercat, de cel mult 3 ori; retrimiterea după ziua 37 nu repornește ceasul;
//   E  ștergerea după tăcere — abia după sfârșitul zilei numite, completă (tabele fără legătură, notificările
//      altora, limitele de e-mail, fișiere), dovada în Legal Hub; răspuns ajuns doar în Hub = aplicat; refuz
//      valabil și după 16 ani; bani încă în mișcare (card, abonament separat, comisioane) = ținut pentru un om;
//      scriptul manual --keep-payments; comisioanele și codurile de reducere rămân;
//   S/C  16 ani împliniți; două răspunsuri deodată; Hub-ul are ștergerea, dar contul trăiește → nu se șterge;
//   T  bara de sus (culori, cine vede reducerea, lățimi 320–1024 fără derulare orizontală);
//   L  mesajul „Ultimele 48 de ore” cu −30%;
//   I  conturile în pauză 12 luni: avertismente 30/7/1 zile, oferta doar adulților (și doar dacă n-au oprit
//      mesajele), niciodată ștergere fără ultimul avertisment, familia întreagă (și celălalt părinte) ține contul,
//      cine plătește ceva nu e atins, oferta ține până la ultima dată scrisă, Hub-ul află după ștergere.
// E-mailurile ajung într-o cutie poștală falsă pornită de acest script (:2525) — nimic nu pleacă în realitate.
// Serverul QA rulează cu MESSAGE_WINDOW_HOURS=0-24, ca proba să meargă la orice oră (în producție: 9–20).
// Adresele care conțin „bounce” sunt refuzate de cutia falsă (ca o adresă moartă).
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/acord-parinte-2026-09-29/verificare-acord-parinte.mjs
import { createRequire } from "node:module";
import { createHmac, createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import net from "node:net";

const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");
const { simpleParser } = createRequire("/Users/danciulescu/Projects/Consult/package.json")("mailparser");

const TUTOR = "/Users/danciulescu/Projects/Tutor";
const BASE = "http://localhost:3113";
const LEGAL = "http://localhost:3120";
const DB = "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa";
const HMAC_KEY = "local-tutor-hmac-key-not-real-0123456789";
const CRON = "qa-cron-local";
const HOLDER = "erased-accounts-payments";
const SHOTS = `${TUTOR}/Reports/acord-parinte-2026-09-29/capturi`;
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: DB } } });
const TAG = "qa-ret0929";
const PASS = "parola-ret-1234";
const DAY = 86_400_000;
const HOUR = 3_600_000;
const results = [];
const check = (n, ok, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};
const ago = (d) => new Date(Date.now() - d * DAY);
const s = Date.now().toString().slice(-6);
const mail = (k) => `${TAG}-${k}-${s}@example.invalid`;
const RO_DATE = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long", year: "numeric" });

// ── Bucharest calendar days (the same rule as src/lib/bucharest-day.ts) ──────────────────────────
const BUC = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const wall = (d) => Object.fromEntries(BUC.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
function bucToUtc(y, m, d) {
  const g = Date.UTC(y, m - 1, d);
  const off = (t) => { const w = wall(new Date(t)); return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(t / 1000) * 1000; };
  let t = g - off(g);
  t = g - off(t);
  return t;
}
const eodOf = (y, m, d) => bucToUtc(y, m, d + 1) - 1;
const eod = (date) => { const w = wall(date); return eodOf(w.year, w.month, w.day); };
/** An account whose 12 months end on the Bucharest day k days from today: [createdAt, eraseAt]. */
function inactiveFor(k) {
  const w = wall(new Date());
  const t = new Date(Date.UTC(w.year, w.month - 1, w.day + k));
  const since = new Date(Date.UTC(t.getUTCFullYear() - 1, t.getUTCMonth(), t.getUTCDate(), 9)); // noon in Bucharest
  return { createdAt: new Date(since.getTime() - 7 * DAY), eraseAt: eodOf(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()) };
}

// ── A fake SMTP inbox: everything the server mails lands here ─────────────────────────────────
const inbox = [];
const smtp = net.createServer((sock) => {
  let buf = "", inData = false, lines = [], to = [], authWait = false;
  const w = (l) => sock.write(l + "\r\n");
  w("220 fake-smtp");
  sock.on("data", (chunk) => {
    buf += chunk.toString("utf8");
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (inData) {
        if (line === ".") {
          inData = false;
          const raw = lines.join("\r\n");
          const rcpt = to.map((t) => t.toLowerCase());
          simpleParser(raw).then((m) => inbox.push({ to: rcpt, subject: m.subject ?? "", html: m.html || m.textAsHtml || "" }));
          lines = [];
          to = [];
          w("250 OK");
        } else lines.push(line.startsWith("..") ? line.slice(1) : line);
        continue;
      }
      if (authWait) { authWait = false; w("235 OK"); continue; }
      const up = line.toUpperCase();
      if (up.startsWith("EHLO")) sock.write("250-fake\r\n250-AUTH PLAIN\r\n250 8BITMIME\r\n");
      else if (up.startsWith("HELO")) w("250 fake");
      else if (up.startsWith("AUTH")) { if (line.trim().split(/\s+/).length > 2) w("235 OK"); else { authWait = true; w("334 "); } }
      else if (up.startsWith("MAIL")) w("250 OK");
      else if (up.startsWith("RCPT")) {
        const addr = (line.match(/<([^>]+)>/) || [])[1] ?? "";
        if (/bounce/i.test(addr)) w("550 no such user");
        else { to.push(addr); w("250 OK"); }
      }
      else if (up.startsWith("DATA")) { if (to.length) { inData = true; w("354 go"); } else w("554 no valid recipients"); }
      else if (up.startsWith("QUIT")) { w("221 bye"); sock.end(); }
      else w("250 OK");
    }
  });
  sock.on("error", () => {});
});
await new Promise((r) => smtp.listen(2525, "127.0.0.1", r));
const mailsTo = (addr) => inbox.filter((m) => m.to.includes(addr.toLowerCase()));

// ── Legal Hub ─────────────────────────────────────────────────────────────────────────────────
const legalSql = (q) => execFileSync("docker", ["exec", "legal-postgres-dev", "psql", "-U", "legal_dev", "-d", "legal_ga", "-Atc", q], { encoding: "utf8" }).trim();
const legalEvents = (id) => legalSql(`select coalesce(string_agg(event||coalesce('/'||reason,''), ',' order by "createdAt"),'') from "GuardianConsent" where "appSlug"='tutor' and "subjectRef"='${id}'`);
const parentalVersion = (await (await fetch(`${LEGAL}/api/v1/public/legal/tutor/parental_consent?locale=ro`)).json()).version.id;
async function legalPost(subjectRef, payload) {
  const body = JSON.stringify({ appSlug: "tutor", subjectRef, ...payload });
  const ts = String(Date.now()), nonce = randomBytes(12).toString("hex");
  const sig = createHmac("sha256", HMAC_KEY).update(["tutor", ts, nonce, subjectRef, createHash("sha256").update(body).digest("hex")].join("\n")).digest("base64");
  const r = await fetch(`${LEGAL}/api/v1/guardian-consents`, { method: "POST", headers: { "content-type": "application/json", "x-app-slug": "tutor", "x-app-timestamp": ts, "x-app-nonce": nonce, "x-app-signature": sig, "x-user-id": subjectRef }, body });
  return r.status;
}
const legalAnswer = (subjectRef, event, guardianEmail) =>
  legalPost(subjectRef, { event, requestId: `tutor:answer:qa${randomBytes(8).toString("hex")}`, guardianEmail, documentVersionId: parentalVersion });

// ── Tutor ─────────────────────────────────────────────────────────────────────────────────────
let ipSeq = 0;
const RUN_NET = Math.floor(Date.now() / 1000) % 250;
const newIp = () => `10.${RUN_NET}.${200 + Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const api = (path, body) => fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-real-ip": newIp() }, body: JSON.stringify(body) });
const cron = async () => {
  const r = await fetch(`${BASE}/api/cron/account-retention`, { headers: { authorization: `Bearer ${CRON}` } });
  const j = await r.json().catch(() => null);
  await new Promise((res) => setTimeout(res, 800)); // the last message's parse
  return { status: r.status, body: j };
};
const HASH = await bcrypt.hash(PASS, 10);
const mk = (k, data) => prisma.user.create({ data: { email: mail(k), name: `QA ${k}`, password: HASH, ...data } });
const exists = async (id) => (await prisma.user.count({ where: { id } })) === 1;
const rtoken = (id, stage, requestedAt, eraseOn) => `reminder:${id}:${stage}:${requestedAt.getTime()}:${eraseOn}`;
const putReminder = (u, stage, eraseOn, requestedAt = u.parentConsentRequestedAt) =>
  prisma.verificationToken.create({ data: { identifier: `parent-consent-reminder:${u.id}:${stage}`, token: rtoken(u.id, stage, requestedAt, eraseOn), expires: new Date(Date.now() + 40 * DAY) } });
const reminders = async (u) =>
  (await prisma.verificationToken.findMany({ where: { identifier: { startsWith: `parent-consent-reminder:${u.id}:` } }, select: { identifier: true, token: true } }))
    .map((m) => { const p = m.token.split(":"); return { stage: m.identifier.split(":").pop(), requestedAt: Number(p[3]), on: Number(p[4]) }; })
    .filter((m) => m.requestedAt === u.parentConsentRequestedAt.getTime());
const warnings = async (id) =>
  (await prisma.verificationToken.findMany({ where: { identifier: { startsWith: `inactive-warning:${id}:` } }, select: { identifier: true, token: true } }))
    .map((m) => ({ stage: m.identifier.split(":").pop(), on: Number(m.token.split(":").pop()) }));
const failCount = (prefix) => prisma.verificationToken.count({ where: { identifier: prefix } });
const minorBirth = new Date("2013-03-03");
const n = new Date();
const birth16 = new Date(Date.UTC(n.getUTCFullYear() - 16, n.getUTCMonth(), n.getUTCDate() - 1)); // turned 16 yesterday

async function wipe() {
  const users = await prisma.user.findMany({ where: { email: { startsWith: TAG } }, select: { id: true, email: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await prisma.verificationToken.deleteMany({ where: { OR: ids.map((id) => ({ identifier: { contains: id } })) } });
    await prisma.payment.deleteMany({ where: { userId: { in: ids } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    for (const t of ["examAttempt", "studyBreak", "questionFeedback", "licentaDocument"]) await prisma[t].deleteMany({ where: { userId: { in: ids } } });
    await prisma.parentNudge.deleteMany({ where: { OR: [{ parentId: { in: ids } }, { childId: { in: ids } }] } });
    await prisma.watcherReportSchedule.deleteMany({ where: { OR: [{ parentId: { in: ids } }, { childId: { in: ids } }] } });
    await prisma.adminAuditLog.deleteMany({ where: { targetUserId: { in: ids } } });
    await prisma.magicQuiz.deleteMany({ where: { userId: { in: ids } } });
    await prisma.setting.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    for (const id of ids) rmSync(`${TUTOR}/public/certificates/${id}`, { recursive: true, force: true });
  }
  await prisma.verificationToken.deleteMany({ where: { OR: [{ identifier: { contains: `${TAG}-` } }, { token: { startsWith: `qa-ret` } }] } });
  await prisma.referralEarning.deleteMany({ where: { OR: [{ promoterId: HOLDER, currency: "qa" }, { currency: "qa", referralId: null }] } });
  await prisma.voucher.deleteMany({ where: { code: { startsWith: "QARET" } } });
  await prisma.payment.deleteMany({ where: { userId: HOLDER, stripeSessionId: { startsWith: TAG } } });
}

async function signIn(page, email) {
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await page.fill("#email", email);
  await page.fill("#password", PASS);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/signin"), { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
}

let browser;
const origSwitch = await prisma.appSetting.findUnique({ where: { key: "accessTrial" } });
const origCursor = await prisma.appSetting.findUnique({ where: { key: "inactiveSweepCursor" } });
try {
  await wipe();
  // The pause switch on, from long ago: the trial/pause and the 12-month clock apply to the accounts
  // below (the server reads it at most 30 s late). The sweep starts from the beginning of the list.
  await prisma.appSetting.upsert({ where: { key: "accessTrial" }, create: { key: "accessTrial", value: { startsAt: "2025-01-01T00:00:00.000Z" } }, update: { value: { startsAt: "2025-01-01T00:00:00.000Z" } } });
  await prisma.appSetting.deleteMany({ where: { key: "inactiveSweepCursor" } });

  const question = await prisma.question.findFirst({ select: { id: true } });
  const domain = await prisma.domain.findFirst({ select: { id: true } });
  const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { id: true, email: true } });
  const adminMails = (id, re) => mailsTo(admin.email).filter((m) => m.html.includes(id) && (!re || re.test(m.subject + m.html)));

  // ── Setup R: waiting parents ─────────────────────────────────────────────────────────────
  const minor = (k, requestedDays, extra = {}) =>
    mk(k, { accountRole: "STUDENT", birthDate: minorBirth, parentConsentEmail: mail(`p${k}`), parentConsentRequestedAt: ago(requestedDays), createdAt: ago(requestedDays), ...extra });
  const rA = await minor("rA", 8);
  const rAold = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({ data: { identifier: `parent-consent:${rA.id}`, token: rAold, expires: new Date(Date.now() + 6 * DAY) } });
  const rB = await minor("rB", 31);
  await putReminder(rB, "stopped", eod(new Date(rB.parentConsentRequestedAt.getTime() + 37 * DAY)));
  const rC = await minor("rC", 36);
  const rD = await minor("rD", 8, { parentConsentEmail: `${TAG}-prD-${s}@demo.tutor.app` });
  const rEparent = await mk("rEparent", { accountRole: "PARENT" });
  const rE = await minor("rE", 8);
  await prisma.guardian.create({ data: { parentId: rEparent.id, childId: rE.id } });
  const rF = await minor("rF", 8, { birthDate: birth16 });
  const rG = await minor("rG", 8, { parentConsentAt: ago(2) });
  // A record from an earlier waiting period, its date long past: never counts for the current one.
  const rStale = await minor("rStale", 10);
  await putReminder(rStale, "two_days_before", Date.now() - HOUR, ago(45));
  // A cover that came after the last reminder: that reminder stops counting.
  const rCovP = await mk("rCovP", { accountRole: "PARENT" });
  const rCov = await minor("rCov", 40);
  await putReminder(rCov, "two_days_before", Date.now() - HOUR);
  const rCovLink = await prisma.guardian.create({ data: { parentId: rCovP.id, childId: rCov.id } });
  // Paid by card, no answer: reminded (not called stopped), and at the end held for a person.
  const payFields = { stripeSubscriptionId: `sub_${TAG}pay${s}`, subscriptionStatus: "active", subscriptionEndsAt: new Date(Date.now() + 20 * DAY) };
  const rPay = await minor("rPay", 8, payFields);
  const rPay2 = await minor("rPay2", 40, { ...payFields, stripeSubscriptionId: `sub_${TAG}pay2${s}` });
  await putReminder(rPay2, "two_days_before", Date.now() - HOUR);
  // A parent address that refuses mail.
  const rBounce = await minor("rBounce", 8, { parentConsentEmail: `${TAG}-bounce-${s}@example.invalid` });
  // The last reminder went out and names tomorrow; the learner then asks another parent.
  const rExt = await minor("rExt", 40);
  await putReminder(rExt, "two_days_before", eod(new Date(Date.now() + DAY)));

  // ── Setup E: erasures ────────────────────────────────────────────────────────────────────
  const eParent = await mk("eParent", { accountRole: "PARENT" }); // not linked to eA: only named in rows
  const eA = await minor("eA", 40);
  await putReminder(eA, "two_days_before", Date.now() - HOUR);
  await prisma.examAttempt.create({ data: { userId: eA.id, paperId: "qa-paper", objectiveAnswers: {} } });
  await prisma.licentaDocument.create({ data: { userId: eA.id, domainId: domain.id, title: "QA", filePath: `${TAG}-x.pdf`, fileType: "pdf" } });
  await prisma.studyBreak.create({ data: { userId: eA.id, startDate: ago(3), endDate: ago(1) } });
  await prisma.parentNudge.create({ data: { parentId: eParent.id, childId: eA.id, message: "hai" } });
  await prisma.questionFeedback.create({ data: { questionId: question.id, userId: eA.id, rating: "down" } });
  await prisma.watcherReportSchedule.create({ data: { parentId: eParent.id, childId: eA.id } });
  await prisma.adminAuditLog.create({ data: { action: "ROLE_CHANGE", targetUserId: eA.id, performedById: admin.id } });
  await prisma.notification.create({ data: { userId: eParent.id, type: "qa", title: "about eA", message: "x", metadata: { childId: eA.id } } });
  await prisma.notification.create({ data: { userId: eParent.id, type: "threshold_alert", title: "teacher about eA", message: "x", metadata: { studentId: eA.id } } });
  await prisma.notification.create({ data: { userId: eParent.id, type: "call_trigger", title: "call about eA", message: "x", metadata: { studentUserId: eA.id } } });
  await prisma.notification.create({ data: { userId: eParent.id, type: "access_trial_launch", title: "trial naming eA", message: "x", metadata: { aboutUserIds: [eA.id, "someone-else"] } } });
  await prisma.notification.create({ data: { userId: eParent.id, type: "qa", title: "other", message: "x", metadata: { childId: "someone-else", aboutUserIds: ["someone-else"] } } });
  await prisma.notification.create({ data: { userId: eA.id, type: "qa", title: "own", message: "x" } });
  await prisma.magicQuiz.create({ data: { questions: [], sharerScore: 1, total: 1, userId: eA.id, expiresAt: new Date(Date.now() + DAY) } });
  await prisma.familyInvite.create({ data: { inviterId: eParent.id, email: eA.email, token: `${TAG}-inv-${s}`, targetRole: "CHILD", channel: "EMAIL", expiresAt: new Date(Date.now() + DAY) } });
  await prisma.userVisit.create({ data: { userId: eA.id } });
  await prisma.verificationToken.create({ data: { identifier: `otp-sent:${eA.id}`, token: `qa-ret-otp-${s}`, expires: new Date(Date.now() + DAY) } });
  await prisma.verificationToken.create({ data: { identifier: `parent-consent-to:${eA.parentConsentEmail.toLowerCase()}`, token: `qa-ret-to-${s}`, expires: new Date(Date.now() + DAY) } });
  const oldCounter = `parent-consent-to:${TAG}-old-${s}@example.invalid`;
  await prisma.verificationToken.create({ data: { identifier: oldCounter, token: `qa-ret-old-${s}`, expires: ago(1) } });
  const certDir = `${TUTOR}/public/certificates/${eA.id}`;
  mkdirSync(certDir, { recursive: true });
  writeFileSync(`${certDir}/c.pdf`, "qa");
  const eB = await minor("eB", 40);
  await putReminder(eB, "two_days_before", Date.now() + DAY);
  const eC = await minor("eC", 40);
  await putReminder(eC, "two_days_before", Date.now() - HOUR);
  const eCanswer = await legalAnswer(eC.id, "GIVEN", eC.parentConsentEmail);
  const eD = await minor("eD", 3, { parentConsentRefusedAt: ago(1) });
  const eE = await minor("eE", 3, { parentConsentRefusedAt: ago(1) });
  await prisma.payment.create({ data: { userId: eE.id, amount: 2490, currency: "ron", status: "succeeded", type: "subscription", stripeSessionId: `${TAG}-pay-${s}` } });
  const eF = await minor("eF", 3, { parentConsentRefusedAt: ago(1), stripeSubscriptionId: `sub_${TAG}${s}` });
  // An extra subject still billed on its own, next to nothing else.
  const eAdd = await minor("eAdd", 3, { parentConsentRefusedAt: ago(1) });
  await prisma.setting.create({ data: { userId: eAdd.id, key: "addonSubscriptions", value: [{ type: "subject_addon", sessionId: `cs_${TAG}_addon_${s}`, learnerId: eAdd.id, domainId: null, at: new Date().toISOString() }] } });
  // A refusal recorded before the 16th birthday: it still holds after it.
  const e16 = await mk("e16", { accountRole: "STUDENT", birthDate: birth16, parentConsentEmail: mail("pe16"), parentConsentRequestedAt: ago(3), parentConsentRefusedAt: ago(2), createdAt: ago(3) });

  // ── Setup I: 12 months in the pause ──────────────────────────────────────────────────────
  const tA = inactiveFor(25), tW = inactiveFor(5), tD = inactiveFor(0);
  const iA = await mk("iA", { accountRole: "PARENT", createdAt: tA.createdAt });
  const iW = await mk("iW", { accountRole: "PARENT", createdAt: tW.createdAt });
  const iD = await mk("iD", { accountRole: "PARENT", createdAt: tD.createdAt });
  // As if the month warning had opened the offer until the erasure day: the last warning names a later day.
  await prisma.verificationToken.create({ data: { identifier: `winback:${iD.id}`, token: `winback:${iD.id}:${tD.eraseAt}`, expires: new Date(tD.eraseAt) } });
  const dayMarker = (u) => prisma.verificationToken.create({ data: { identifier: `inactive-warning:${u.id}:day`, token: `inactive:${u.id}:day:${Date.now() - HOUR}`, expires: new Date(Date.now() + 20 * DAY) } });
  const iB = await mk("iB", { accountRole: "PARENT", createdAt: ago(400) });
  await dayMarker(iB);
  const iN = await mk("iN", { accountRole: "PARENT", createdAt: ago(400) }); // past its date, never warned
  const promP = await mk("promP", { accountRole: "PARENT" }); // the promoter who recommended iP
  const iP = await mk("iP", { accountRole: "PARENT", createdAt: ago(400) }); // paid once, long ago; recommended by promP
  await dayMarker(iP);
  const iPpay = await prisma.payment.create({ data: { userId: iP.id, amount: 3320, currency: "ron", status: "succeeded", type: "subscription", stripeSessionId: `${TAG}-payI-${s}` } });
  const refP = await prisma.referral.create({ data: { promoterId: promP.id, referredId: iP.id, code: `QA${s}`, status: "ACTIVE" } });
  const earnP = await prisma.referralEarning.create({ data: { referralId: refP.id, promoterId: promP.id, paymentId: iPpay.id, amount: 1660, currency: "qa", status: "PAYABLE", payableAt: new Date() } });
  // A promoter still owed commissions: held for a person.
  const refY = await mk("refY", { accountRole: "PARENT" });
  const iOwe = await mk("iOwe", { accountRole: "PARENT", createdAt: ago(400) });
  await dayMarker(iOwe);
  const refOwe = await prisma.referral.create({ data: { promoterId: iOwe.id, referredId: refY.id, code: `QB${s}` } });
  await prisma.referralEarning.create({ data: { referralId: refOwe.id, promoterId: iOwe.id, amount: 500, currency: "qa", status: "PAYABLE", payableAt: new Date() } });
  // A promoter paid out before, with a discount code a family may still hold: both stay.
  const refZ = await mk("refZ", { accountRole: "PARENT" });
  const iPromo = await mk("iPromo", { accountRole: "PARENT", createdAt: ago(400) });
  await dayMarker(iPromo);
  const refPromo = await prisma.referral.create({ data: { promoterId: iPromo.id, referredId: refZ.id, code: `QC${s}` } });
  const earnPaid = await prisma.referralEarning.create({ data: { referralId: refPromo.id, promoterId: iPromo.id, amount: 700, currency: "qa", status: "PAID", payableAt: ago(30) } });
  const voucher = await prisma.voucher.create({ data: { code: `QARET${s}`, discountPercent: 10, maxUses: 1, createdById: iPromo.id } });
  // A consented child, unused for a year: the Hub hears of the erasure only after it.
  const iStory = await mk("iStory", { accountRole: "STUDENT", birthDate: minorBirth, parentConsentRequestedAt: ago(400), parentConsentAt: ago(399), createdAt: ago(400) });
  await dayMarker(iStory);
  const iG = await mk("iG", { accountRole: "PARENT", createdAt: tA.createdAt });
  const iGc = await mk("iGc", { accountRole: "STUDENT", birthDate: minorBirth, name: "Ionel QA", createdAt: tA.createdAt });
  await prisma.guardian.create({ data: { parentId: iG.id, childId: iGc.id } });
  const iF = await mk("iF", { accountRole: "PARENT", createdAt: ago(400), lastLoginAt: new Date(Date.now() - HOUR) });
  const iFc = await mk("iFc", { accountRole: "STUDENT", birthDate: minorBirth, createdAt: ago(400) });
  await prisma.guardian.create({ data: { parentId: iF.id, childId: iFc.id } });
  await dayMarker(iFc);
  // Two parents of one child: B still signs in, A never does — A is family, and kept.
  const iCoA = await mk("iCoA", { accountRole: "PARENT", createdAt: tA.createdAt });
  const iCoB = await mk("iCoB", { accountRole: "PARENT", createdAt: tA.createdAt, lastLoginAt: new Date(Date.now() - HOUR) });
  const iCoC = await mk("iCoC", { accountRole: "STUDENT", birthDate: minorBirth, createdAt: tA.createdAt });
  await prisma.guardian.create({ data: { parentId: iCoA.id, childId: iCoC.id } });
  await prisma.guardian.create({ data: { parentId: iCoB.id, childId: iCoC.id } });
  const iT = await mk("iT", { accountRole: "STUDENT", birthDate: new Date(Date.UTC(new Date().getUTCFullYear() - 17, 0, 10)), createdAt: tA.createdAt });
  const iL = await mk("iL", { accountRole: "STUDENT", birthDate: new Date("2000-06-15"), createdAt: tA.createdAt });
  const iX = await mk("iX", { accountRole: "PARENT", createdAt: ago(400), freeForever: true });
  const iBan = await mk("iBan", { accountRole: "PARENT", createdAt: tA.createdAt, isBanned: true });
  const iOpt = await mk("iOpt", { accountRole: "PARENT", createdAt: tA.createdAt });
  await prisma.setting.create({ data: { userId: iOpt.id, key: "accessMessages", value: { off: true } } });
  const iAddon = await mk("iAddon", { accountRole: "PARENT", createdAt: ago(400) });
  await prisma.setting.create({ data: { userId: iAddon.id, key: "addonSubscriptions", value: [{ type: "child_addon", sessionId: `cs_${TAG}_seat_${s}`, learnerId: null, domainId: null, at: new Date().toISOString() }] } });
  const iBounce = await mk("iBounce", { accountRole: "PARENT", createdAt: tA.createdAt, email: `${TAG}-bounce-i-${s}@example.invalid` });

  // ── Setup S, C: answers on a link ─────────────────────────────────────────────────────────
  const sU = await mk("sU", { accountRole: "STUDENT", birthDate: birth16, parentConsentEmail: mail("psU"), parentConsentRequestedAt: ago(2) });
  const sTok = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({ data: { identifier: `parent-consent:${sU.id}`, token: sTok, expires: new Date(Date.now() + DAY) } });
  const cU = await minor("cU", 1);
  const cTok = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({ data: { identifier: `parent-consent:${cU.id}`, token: cTok, expires: new Date(Date.now() + DAY) } });
  // The Hub holds an erasure for an account that is alive and waiting.
  const cDis = await minor("cDis", 1);
  const cDisTok = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({ data: { identifier: `parent-consent:${cDis.id}`, token: cDisTok, expires: new Date(Date.now() + DAY) } });
  const cDisHub = await legalPost(cDis.id, { event: "SUBJECT_ERASED", requestId: `tutor:erased:${cDis.id}`, reason: "OTHER" });

  // ── Setup T: the free week in the top bar ────────────────────────────────────────────────
  const tP1 = await mk("tP1", { accountRole: "PARENT", createdAt: new Date(Date.now() - HOUR) });
  const tP2 = await mk("tP2", { accountRole: "PARENT", createdAt: new Date(Date.now() - 5.5 * DAY) });
  const tP3 = await mk("tP3", { accountRole: "PARENT", createdAt: new Date(Date.now() - 6.6 * DAY) });
  const tS = await mk("tS", { accountRole: "STUDENT", birthDate: new Date("2000-06-15"), createdAt: new Date(Date.now() - HOUR) });
  const tC = await mk("tC", { accountRole: "STUDENT", birthDate: minorBirth, parentConsentAt: new Date(), createdAt: new Date(Date.now() - HOUR) });
  await prisma.guardian.create({ data: { parentId: tP1.id, childId: tC.id } });
  const tPaused = await mk("tPaused", { accountRole: "PARENT", createdAt: ago(10) });
  // The trial messages respect each parent's quiet hours (22–7 by default): these two have none now.
  for (const u of [tP2, tP3]) await prisma.notificationPreference.create({ data: { userId: u.id, quietHoursStart: "04:00", quietHoursEnd: "04:01" } });

  console.log("… aștept 31 s (serverul citește comutatorul probei cu cel mult 30 s întârziere)");
  await new Promise((r) => setTimeout(r, 31_000));

  // ════ First cron run ════════════════════════════════════════════════════════════════════
  const run1 = await cron();
  check("0 cron-ul răspunde", run1.status === 200 && run1.body?.ok, JSON.stringify(run1.body));

  // R
  const mA = (await reminders(rA)).find((m) => m.stage === "stopped");
  const rAlink = await prisma.verificationToken.findFirst({ where: { token: rAold } });
  const rAafter = await prisma.user.findUnique({ where: { id: rA.id }, select: { parentConsentRequestedAt: true } });
  const wantA = eod(new Date(rA.parentConsentRequestedAt.getTime() + 37 * DAY));
  check("R1 ziua 7: reminderul „contul s-a oprit”, notat pe perioada curentă, cu data = sfârșitul zilei 37", !!mA && mA.on === wantA, mA ? new Date(mA.on).toISOString() : "lipsă");
  check("R2 ceasul nu repornește (data cererii neschimbată)", rAafter.parentConsentRequestedAt.getTime() === rA.parentConsentRequestedAt.getTime());
  const mailA = mailsTo(rA.parentConsentEmail);
  check("R3 un e-mail, cu ACELAȘI link pe care părintele îl are deja, prelungit până după data numită", mailA.length === 1 && mailA[0].html.includes(`/ro/acord-parinte/${rAold}`) && !!rAlink && rAlink.expires.getTime() >= wantA + DAY, `${mailA.length} e-mailuri · expiră ${rAlink?.expires.toISOString()}`);
  check("R4 textul: „de azi, contul copilului e oprit” + ziua ștergerii + „linkul e același”", /de azi, contul copilului e oprit/.test(mailA[0]?.html) && mailA[0]?.html.includes(RO_DATE.format(new Date(wantA))) && /linkul e același/.test(mailA[0]?.html), mailA[0]?.subject);
  const oldPage = await (await fetch(`${BASE}/ro/acord-parinte/${rAold}`)).text();
  check("R5 linkul din primul e-mail merge în continuare (pagina cu butoanele)", /Sunt de acord/.test(oldPage) && !/Linkul nu mai e valid/.test(oldPage));
  const mB = await reminders(rB);
  const mailB = mailsTo(rB.parentConsentEmail);
  check("R6 ziua 30: reminderul „cu 7 zile înainte”, data = sfârșitul zilei 37", mB.some((m) => m.stage === "week_before" && m.on === eod(new Date(rB.parentConsentRequestedAt.getTime() + 37 * DAY))) && mailB.length === 1 && /iar contul copilului e oprit/.test(mailB[0].html), mB.map((m) => m.stage).join(","));
  const mC = await reminders(rC);
  const mailC = mailsTo(rC.parentConsentEmail);
  check("R7 o rulare întârziată (ziua 36): DOAR ultimul reminder, niciodată unul mai vechi", mC.length === 1 && mC[0].stage === "two_days_before", mC.map((m) => m.stage).join(","));
  const wantC = eod(new Date(Date.now() + 2 * DAY));
  check("R8 data numită: cel puțin 2 zile după reminder, până la sfârșitul acelei zile", mC[0]?.on === wantC && mailC[0]?.subject === `Contul de elev de pe eTutor.ro se șterge pe ${RO_DATE.format(new Date(wantC))}`, mailC[0]?.subject);
  check("R9 adresă de test: reminderul e notat, dar nu se trimite", (await reminders(rD)).some((m) => m.stage === "stopped") && mailsTo(rD.parentConsentEmail).length === 0);
  check("R10 fără reminder: copil cu părinte în cont / a împlinit 16 ani / părintele a spus deja da", (await reminders(rE)).length === 0 && (await reminders(rF)).length === 0 && (await reminders(rG)).length === 0);
  const reminderHtml = [...mailA, ...mailB, ...mailC].map((m) => m.html).join(" ");
  check("R11 niciun reminder nu conține preț, reducere sau ofertă", !/lei|%|reducere|abonament|pachet|packages/i.test(reminderHtml));
  const mStale = await reminders(rStale);
  check("R12 un reminder dintr-o perioadă mai veche nu contează: contul rămâne și primește reminderul perioadei lui", (await exists(rStale.id)) && mStale.length === 1 && mStale[0].stage === "stopped", mStale.map((m) => m.stage).join(","));
  check("R13 un părinte a legat copilul după ultimul reminder: contul rămâne, iar reminderele vechi se șterg", (await exists(rCov.id)) && (await prisma.verificationToken.count({ where: { identifier: { startsWith: `parent-consent-reminder:${rCov.id}:` } } })) === 0);
  const mailPay = mailsTo(rPay.parentConsentEmail);
  check("R14 cont plătit cu cardul, fără răspuns: primește reminderul, fără să i se spună „oprit”", mailPay.length === 1 && /merge în continuare/.test(mailPay[0].html) && !/e oprit/.test(mailPay[0].html), mailPay[0]?.subject);
  check("R15 cont plătit, data trecută: NU e șters, un om e anunțat să oprească abonamentul", (await exists(rPay2.id)) && adminMails(rPay2.id, /abonamentul cu cardul/).length === 1);
  check("R16 adresă care refuză e-mailul: reminderul nu se consideră trimis, se reîncearcă (1 din 3)", (await reminders(rBounce)).length === 0 && (await failCount(`parent-consent-reminder-fail:${rBounce.id}:stopped`)) === 1);

  // E
  const leftA = {
    user: await prisma.user.count({ where: { id: eA.id } }),
    exam: await prisma.examAttempt.count({ where: { userId: eA.id } }),
    lic: await prisma.licentaDocument.count({ where: { userId: eA.id } }),
    brk: await prisma.studyBreak.count({ where: { userId: eA.id } }),
    nudge: await prisma.parentNudge.count({ where: { childId: eA.id } }),
    fb: await prisma.questionFeedback.count({ where: { userId: eA.id } }),
    sched: await prisma.watcherReportSchedule.count({ where: { childId: eA.id } }),
    audit: await prisma.adminAuditLog.count({ where: { targetUserId: eA.id } }),
    notif: await prisma.notification.count({ where: { OR: [{ userId: eA.id }, { metadata: { path: ["childId"], equals: eA.id } }, { metadata: { path: ["studentId"], equals: eA.id } }, { metadata: { path: ["studentUserId"], equals: eA.id } }, { metadata: { path: ["aboutUserIds"], array_contains: [eA.id] } }] } }),
    quiz: await prisma.magicQuiz.count({ where: { userId: eA.id } }),
    invite: await prisma.familyInvite.count({ where: { email: eA.email } }),
    visit: await prisma.userVisit.count({ where: { userId: eA.id } }),
    tokens: await prisma.verificationToken.count({ where: { identifier: { contains: eA.id } } }),
    parentAddress: await prisma.verificationToken.count({ where: { identifier: `parent-consent-to:${eA.parentConsentEmail.toLowerCase()}` } }),
  };
  const leftovers = Object.entries(leftA).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`);
  check("E1 tăcere după ziua numită: contul șters, fără nimic rămas (14 locuri, inclusiv notificările altora și adresa părintelui)", leftovers.length === 0, leftovers.join(" ") || "curat");
  check("E2 fișierele (certificatele) șterse", !existsSync(certDir));
  const eParentNotes = await prisma.notification.findMany({ where: { userId: eParent.id }, select: { title: true } });
  check("E3 părintele de alături rămâne, cu notificările despre alți copii", (await exists(eParent.id)) && eParentNotes.length === 1 && eParentNotes[0].title === "other", eParentNotes.map((x) => x.title).join(","));
  check("E4 dovada în Legal Hub: SUBJECT_ERASED / NO_GUARDIAN_ANSWER", legalEvents(eA.id) === "SUBJECT_ERASED/NO_GUARDIAN_ANSWER", legalEvents(eA.id));
  check("E5 ziua numită încă n-a trecut → contul rămâne", await exists(eB.id));
  const eCrow = await prisma.user.findUnique({ where: { id: eC.id }, select: { parentConsentAt: true, parentConsentEmail: true } });
  check("E6 părintele a răspuns „da” doar în Hub: aplicat în Tutor (adresa lui ștearsă), contul NU se șterge", eCanswer === 201 && !!eCrow?.parentConsentAt && eCrow.parentConsentEmail === null && legalEvents(eC.id) === "GIVEN", `${eCanswer} · ${legalEvents(eC.id)}`);
  check("E7 un refuz rămas neterminat se termină la cron", !(await exists(eD.id)) && legalEvents(eD.id) === "SUBJECT_ERASED/GUARDIAN_REFUSED", legalEvents(eD.id));
  check("E8 cont cu plăți: oprit, NU șters, un om e anunțat o dată, cu comanda exactă", (await exists(eE.id)) && !!(await prisma.verificationToken.findFirst({ where: { identifier: `erasure-held:${eE.id}` } })) && adminMails(eE.id).length === 1 && adminMails(eE.id)[0].html.includes(`--user ${eE.id} --reason GUARDIAN_REFUSED --keep-payments --apply`), `${adminMails(eE.id).length} e-mailuri admin`);
  check("E9 o materie plătită separat încă activă: contul NU se șterge, omul află ce abonament să oprească", (await exists(eAdd.id)) && adminMails(eAdd.id, new RegExp(`cs_${TAG}_addon_${s}`)).length === 1);
  check("E10 refuzul ținut și după împlinirea a 16 ani: contul se șterge", !(await exists(e16.id)) && legalEvents(e16.id) === "SUBJECT_ERASED/GUARDIAN_REFUSED", legalEvents(e16.id));
  check("E11 limitele de e-mail expirate (care țin adrese) se curăță la fiecare rulare", (await prisma.verificationToken.count({ where: { identifier: oldCounter } })) === 0);

  // I
  const mIA = await warnings(iA.id);
  const wbA = await prisma.verificationToken.findFirst({ where: { identifier: `winback:${iA.id}` } });
  const mailIA = mailsTo(iA.email);
  check("I1 cu 25 de zile înainte: avertismentul de o lună + oferta de revenire până la sfârșitul zilei ștergerii", mIA.length === 1 && mIA[0].stage === "month" && mIA[0].on === tA.eraseAt && wbA?.expires.getTime() === tA.eraseAt, mIA.map((m) => `${m.stage}@${new Date(m.on).toISOString()}`).join(","));
  check("I2 e-mailul adultului: data, „e de ajuns să intri”, −30% + „Reactivez” + cum oprește ofertele", mailIA.length === 1 && mailIA[0].html.includes(RO_DATE.format(new Date(tA.eraseAt))) && /e de ajuns să intri în cont/.test(mailIA[0].html) && /Reactivez cu −30%/.test(mailIA[0].html) && /Nu mai vrei oferte/.test(mailIA[0].html), mailIA[0]?.subject);
  const mIW = await warnings(iW.id);
  check("I3 cu 5 zile înainte, fără nimic trimis: doar avertismentul de o săptămână", mIW.length === 1 && mIW[0].stage === "week", mIW.map((m) => m.stage).join(","));
  const mID = await warnings(iD.id);
  const mailID = mailsTo(iD.email);
  const wantD = eod(new Date(Date.now() + DAY));
  check("I4 azi e ultima zi: „Ultima zi”, mutată la sfârșitul zilei de mâine", mID.length === 1 && mID[0].stage === "day" && mID[0].on === wantD && (await exists(iD.id)) && /^Ultima zi:/.test(mailID[0]?.subject ?? ""), mailID[0]?.subject);
  const wbD = await prisma.verificationToken.findFirst({ where: { identifier: `winback:${iD.id}` }, orderBy: { expires: "desc" } });
  check("I5 oferta de revenire se prelungește până la ultima zi scrisă în e-mail", wbD?.expires.getTime() === wantD, wbD?.expires.toISOString());
  check("I6 ultimul avertisment trimis + ziua trecută → șters (fără urmă în Legal Hub: n-a avut acord de părinte)", !(await exists(iB.id)) && legalEvents(iB.id) === "");
  const mIN = await warnings(iN.id);
  check("I7 trecut de dată, dar niciodată avertizat → NU e șters: primește întâi „Ultima zi”", (await exists(iN.id)) && mIN.length === 1 && mIN[0].stage === "day" && mailsTo(iN.email).length === 1, mIN.map((m) => m.stage).join(","));
  const iPpayNow = await prisma.payment.findUnique({ where: { id: iPpay.id }, select: { userId: true } });
  const earnPNow = await prisma.referralEarning.findUnique({ where: { id: earnP.id }, select: { referralId: true, promoterId: true, status: true } });
  check("I8 plătise cândva: șters automat, plata rămâne fără persoană", !(await exists(iP.id)) && iPpayNow?.userId === HOLDER, iPpayNow?.userId);
  check("I9 comisionul celui care l-a recomandat rămâne (fără legătura spre contul șters)", earnPNow?.promoterId === promP.id && earnPNow.referralId === null && earnPNow.status === "PAYABLE", JSON.stringify(earnPNow));
  check("I10 cine mai are de primit comisioane: NU e șters, un om e anunțat să le deconteze", (await exists(iOwe.id)) && adminMails(iOwe.id, /comisioanele/).length === 1);
  const earnPaidNow = await prisma.referralEarning.findUnique({ where: { id: earnPaid.id }, select: { promoterId: true, referralId: true } });
  const voucherNow = await prisma.voucher.findUnique({ where: { id: voucher.id }, select: { createdById: true } });
  check("I11 comisioanele deja plătite și codurile de reducere create de cont rămân, fără persoană", !(await exists(iPromo.id)) && earnPaidNow?.promoterId === HOLDER && voucherNow?.createdById === HOLDER, `${JSON.stringify(earnPaidNow)} · ${voucherNow?.createdById}`);
  const holder = await prisma.user.findUnique({ where: { id: HOLDER }, select: { email: true, isBanned: true, password: true, freeForever: true } });
  check("I12 contul care ține plățile: fără adresă, fără parolă, blocat și niciodată în pauză", !!holder && !holder.email && !holder.password && holder.isBanned && holder.freeForever);
  check("I13 copil cu acordul părintelui, nefolosit un an: șters, iar Legal Hub află după ștergere (INACTIVE)", !(await exists(iStory.id)) && legalEvents(iStory.id) === "SUBJECT_ERASED/INACTIVE" && (await prisma.verificationToken.count({ where: { identifier: `erasure-report:${iStory.id}` } })) === 0, legalEvents(iStory.id));
  const mIG = await warnings(iG.id);
  const mailIG = mailsTo(iG.email);
  check("I14 părinte + copil: avertizat doar părintele, cu numele copilului", mIG.length === 1 && (await warnings(iGc.id)).length === 0 && /contul copilului: Ionel QA/.test(mailIG[0]?.html ?? "") && mailsTo(iGc.email).length === 0);
  check("I15 un părinte care intră în cont ține și contul copilului", (await exists(iF.id)) && (await exists(iFc.id)) && (await warnings(iF.id)).length === 0);
  check("I16 celălalt părinte al copilului intră în cont: părintele care nu intră NU e avertizat", (await warnings(iCoA.id)).length === 0 && mailsTo(iCoA.email).length === 0 && (await warnings(iCoC.id)).length === 0);
  const mailIT = mailsTo(iT.email);
  check("I17 elev de 17 ani singur: avertisment simplu, fără preț și fără ofertă", mailIT.length === 1 && !/%|lei|abonat|packages|reactivez/i.test(mailIT[0].html) && mailIT[0].html.includes("/ro/auth/signin") && !(await prisma.verificationToken.findFirst({ where: { identifier: `winback:${iT.id}` } })));
  check("I18 adult care învață: oferta duce la pachetul Elev", (mailsTo(iL.email)[0]?.html ?? "").includes("plan=ELEV"));
  check("I19 „Gratuit permanent” și conturile blocate: neatinse", (await exists(iX.id)) && (await warnings(iX.id)).length === 0 && (await warnings(iBan.id)).length === 0 && mailsTo(iBan.email).length === 0);
  const mailOpt = mailsTo(iOpt.email);
  check("I20 a oprit mesajele despre prețuri: primește anunțul de ștergere, fără ofertă", mailOpt.length === 1 && !/%|Reactivez/.test(mailOpt[0].html) && !(await prisma.verificationToken.findFirst({ where: { identifier: `winback:${iOpt.id}` } })));
  check("I21 o familie care încă plătește un abonament separat: nu e avertizată, nu e ștearsă", (await exists(iAddon.id)) && (await warnings(iAddon.id)).length === 0 && mailsTo(iAddon.email).length === 0);
  check("I22 adresă care refuză e-mailul: avertismentul nu se consideră dat, se reîncearcă (1 din 3)", (await warnings(iBounce.id)).length === 0 && (await failCount(`inactive-warning-fail:${iBounce.id}:month`)) === 1);

  // ── Between runs: the cover ends ─────────────────────────────────────────────────────────
  await prisma.guardian.update({ where: { id: rCovLink.id }, data: { status: "removed" } });

  // ════ Second run: nothing repeats ═══════════════════════════════════════════════════════
  const before2 = inbox.length;
  const run2 = await cron();
  const again = inbox.slice(before2).map((m) => m.to[0]).filter((t) => (t.includes(TAG) || t === admin.email) && t !== rCov.parentConsentEmail.toLowerCase());
  check("D1 a doua rulare: niciun e-mail repetat (remindere, avertismente, anunțurile pentru om)", run2.status === 200 && again.length === 0, again.join(","));
  check("D2 a doua rulare: conturile avertizate azi cu „Ultima zi” încă există", (await exists(iN.id)) && (await exists(iD.id)));
  const mCov = await reminders(rCov);
  check("D3 acoperirea s-a încheiat: părintele primește un ultim reminder nou, cu 2 zile, iar contul rămâne", (await exists(rCov.id)) && mCov.length === 1 && mCov[0].stage === "two_days_before" && mCov[0].on === eod(new Date(Date.now() + 2 * DAY)) && mailsTo(rCov.parentConsentEmail).length === 1, mCov.map((m) => `${m.stage}@${new Date(m.on).toISOString()}`).join(","));
  check("D4 adresa moartă: a doua încercare, tot neconsiderat trimis (2 din 3)", (await reminders(rBounce)).length === 0 && (await failCount(`parent-consent-reminder-fail:${rBounce.id}:stopped`)) === 2);

  // ── E: the manual script, for the account held for its payments ──────────────────────────
  const tsxEnv = { ...process.env, DATABASE_URL: DB, LEGAL_API_URL: LEGAL, LEGAL_API_KEY: "local-legal-api-key-not-real-0123456789", LEGAL_HMAC_KEY: HMAC_KEY };
  const script = (...a) => execFileSync("npx", ["tsx", "scripts/erase-account.ts", ...a], { cwd: TUTOR, env: tsxEnv, encoding: "utf8" });
  const dry = script("--user", eE.id, "--reason", "GUARDIAN_REFUSED", "--keep-payments");
  check("M1 fără --apply: doar arată, nu șterge", /Probă — nu șterg nimic/.test(dry) && (await exists(eE.id)));
  const sub = script("--user", eF.id, "--reason", "GUARDIAN_REFUSED", "--keep-payments", "--apply");
  check("M2 abonament cu cardul încă activ: refuză, cere oprirea întâi", /Mai sunt bani în mișcare/.test(sub) && (await exists(eF.id)));
  const addonOut = script("--user", eAdd.id, "--reason", "GUARDIAN_REFUSED", "--keep-payments", "--apply");
  check("M3 abonament separat încă activ: îl arată și refuză", addonOut.includes(`cs_${TAG}_addon_${s}`) && /Mai sunt bani în mișcare/.test(addonOut) && (await exists(eAdd.id)));
  const done = script("--user", eE.id, "--reason", "GUARDIAN_REFUSED", "--keep-payments", "--apply");
  const eEpay = await prisma.payment.findFirst({ where: { stripeSessionId: `${TAG}-pay-${s}` }, select: { userId: true } });
  check("M4 --keep-payments --apply: contul șters, plata mutată la deținătorul fără persoană", /ȘTERS/.test(done) && !(await exists(eE.id)) && eEpay?.userId === HOLDER, done.trim().split("\n").pop());
  check("M5 dovada în Legal Hub pentru contul șters de mână", legalEvents(eE.id) === "SUBJECT_ERASED/GUARDIAN_REFUSED", legalEvents(eE.id));

  // ── S: turned 16 ─────────────────────────────────────────────────────────────────────────
  const sRes = await api("/api/parent-consent", { token: sTok, decision: "REFUSED", versionId: parentalVersion });
  const sBody = await sRes.json().catch(() => ({}));
  check("S1 elevul a împlinit 16 ani: refuzul părintelui nu mai e primit (409), contul rămâne, Hub-ul nu notează nimic", sRes.status === 409 && /16 ani/.test(sBody.error ?? "") && (await exists(sU.id)) && legalEvents(sU.id) === "", `${sRes.status}`);

  // ── C: two answers at once on one link; the Hub and eTutor disagreeing ───────────────────
  const [c1, c2] = await Promise.all([
    api("/api/parent-consent", { token: cTok, decision: "GIVEN", versionId: parentalVersion }),
    api("/api/parent-consent", { token: cTok, decision: "REFUSED", versionId: parentalVersion }),
  ]);
  const cb = [await c1.json().catch(() => ({})), await c2.json().catch(() => ({}))];
  await new Promise((r) => setTimeout(r, 1500));
  const cEv = legalEvents(cU.id);
  const cRow = await prisma.user.findUnique({ where: { id: cU.id }, select: { parentConsentAt: true, parentConsentEmail: true } });
  const consistent = (cEv === "GIVEN" && !!cRow?.parentConsentAt && cRow.parentConsentEmail === null) || (cEv === "REFUSED,SUBJECT_ERASED/GUARDIAN_REFUSED" && !cRow);
  check("C1 două răspunsuri deodată: unul câștigă, Tutor și Legal Hub spun același lucru", consistent, `${c1.status}/${c2.status} · Hub: ${cEv} · cont: ${cRow ? (cRow.parentConsentAt ? "cu acord" : "fără acord") : "șters"} · ${JSON.stringify(cb)}`);
  const dRes = await api("/api/parent-consent", { token: cDisTok, decision: "GIVEN", versionId: parentalVersion });
  await new Promise((r) => setTimeout(r, 800));
  check("C2 Hub-ul are o ștergere, dar contul trăiește și așteaptă: nu se șterge pe cuvântul Hub-ului, un om e anunțat", cDisHub === 201 && dRes.status === 409 && (await exists(cDis.id)) && adminMails(cDis.id, /n-a putut fi înregistrat/).length === 1, `${cDisHub} · ${dRes.status}`);

  // ── L: the 48-hour message ───────────────────────────────────────────────────────────────
  const esc = await fetch(`${BASE}/api/cron/escalation`, { method: "POST", headers: { authorization: `Bearer ${CRON}` }, signal: AbortSignal.timeout(180_000) }).catch((e) => ({ status: String(e) }));
  await new Promise((r) => setTimeout(r, 1500));
  const n48 = await prisma.notification.findFirst({ where: { userId: tP2.id, type: "access_trial_two_days" }, select: { title: true, message: true } });
  check("L1 în ultimele 48 de ore părintele primește „Ultimele 48 de ore” cu −30% pe viață", esc.status === 200 && n48?.title === "Ultimele 48 de ore din proba gratuită" && /−30% cât timp rămâi abonat/.test(n48?.message ?? ""), `${esc.status} · ${n48?.message?.slice(0, 120)}`);
  const m48 = mailsTo(tP2.email).find((m) => /Ultimele 48 de ore/.test(m.subject + m.html));
  check("L2 … și pe e-mail, cu butonul „Păstrez −30%”", !!m48 && /Păstrez −30%/.test(m48.html), m48 ? m48.subject : `${mailsTo(tP2.email).length} e-mailuri`);
  const n24 = await prisma.notification.findFirst({ where: { userId: tP3.id, type: { startsWith: "access_trial" } }, select: { type: true } });
  check("L3 în ultima zi: mesajul de ultima zi, nu cel de 48 de ore", n24?.type !== "access_trial_two_days" && !!n24, n24?.type);

  // ── T + I (browser) ──────────────────────────────────────────────────────────────────────
  browser = await chromium.launch();
  const bar = async (email, viewport = { width: 1280, height: 800 }, shot) => {
    const ctx = await browser.newContext({ viewport, ...(viewport.width < 500 ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    await signIn(page, email);
    await page.goto(`${BASE}/ro/dashboard`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const info = await page.evaluate(() => {
      const timer = document.querySelector("header [role=timer]");
      const box = timer?.parentElement;
      return {
        text: box ? box.innerText.replace(/\s+/g, " ").trim() : null,
        tone: timer ? timer.className : "",
        links: box ? [...box.querySelectorAll("a")].filter((a) => a.offsetParent !== null).map((a) => a.innerText.trim()) : [],
        live: box ? [...box.querySelectorAll("[aria-live]")].map((e) => e.getAttribute("aria-live")) : [],
        statusRoles: document.querySelectorAll("header [role=status]").length,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        headerRight: Math.max(0, ...[...document.querySelectorAll("header *")].filter((e) => e.getClientRects().length && e.offsetParent !== null).map((e) => Math.round(e.getBoundingClientRect().right))),
      };
    });
    if (shot) await page.screenshot({ path: `${SHOTS}/${shot}.png` });
    await ctx.close();
    return info;
  };
  const b1 = await bar(tP1.email, undefined, "bara-parinte-7-zile");
  check("T1 părinte, 7 zile: bara albastră cu timpul și −30% dacă plătește în probă", !!b1.text && /Proba gratuită/.test(b1.text) && /blue/.test(b1.tone) && b1.links.some((l) => /−30% dacă plătești în probă/.test(l)), `${b1.text} · ${b1.links.join("|")}`);
  check("T1b cititorul de ecran nu e anunțat la fiecare secundă (timer, fără zonă „status”)", b1.statusRoles === 0 && b1.live.length === 1);
  const b2 = await bar(tP2.email, undefined, "bara-parinte-48h");
  check("T2 ultimele 48 de ore: chihlimbar, „Ultimele 48 de ore: −30% pe viață”", /amber/.test(b2.tone) && b2.links.some((l) => /Ultimele 48 de ore: −30% pe viață/.test(l)), `${b2.text} · ${b2.links.join("|")}`);
  const b3 = await bar(tP3.email, undefined, "bara-parinte-24h");
  check("T3 ultimele 24 de ore: roșu", /red/.test(b3.tone), b3.text);
  const bS = await bar(tS.email, undefined, "bara-elev-adult");
  check("T4 elev care și-a făcut singur cont: vede timpul, fără preț și fără link", !!bS.text && /Proba gratuită/.test(bS.text) && bS.links.length === 0 && !/%/.test(bS.text), bS.text);
  const bC = await bar(tC.email, undefined, "bara-copil");
  check("T5 copilul unui părinte: fără bară", bC.text === null, String(bC.text));
  const bP = await bar(tPaused.email);
  check("T6 cont în pauză: fără bară", bP.text === null, String(bP.text));
  for (const w of [320, 375, 640, 700, 1024]) {
    const bM = await bar(tP2.email, { width: w, height: 812 }, `bara-${w}-48h`);
    check(`T7 lățime ${w} px: timpul și −30% vizibile, pagina nu e mai lată decât ecranul, antetul încape`, !!bM.text && bM.links.some((l) => /−30%/.test(l)) && bM.overflow <= 0 && bM.headerRight <= w, `${bM.text} · ${bM.links.join("|")} · depășire ${bM.overflow}px · antet până la ${bM.headerRight}px`);
  }

  // The learner asks another parent after the last reminder: two days for that parent, same waiting period.
  const lctx = await browser.newContext();
  const lp = await lctx.newPage();
  await signIn(lp, rExt.email);
  const newParent = mail("pExtNew");
  const extRes = await lp.request.post(`${BASE}/api/me/parent-consent`, { data: { parentEmail: newParent, locale: "ro" } });
  await lctx.close();
  await new Promise((r) => setTimeout(r, 1500));
  const rExtAfter = await prisma.user.findUnique({ where: { id: rExt.id }, select: { parentConsentRequestedAt: true, parentConsentEmail: true } });
  const mExt = (await reminders(rExt)).find((m) => m.stage === "two_days_before");
  const wantExt = eod(new Date(Date.now() + 2 * DAY));
  const mailExt = mailsTo(newParent);
  check("X1 alt părinte întrebat după ultimul reminder: ceasul NU repornește, noul părinte are 2 zile, iar e-mailul îi spune ziua", extRes.ok() && rExtAfter.parentConsentRequestedAt.getTime() === rExt.parentConsentRequestedAt.getTime() && rExtAfter.parentConsentEmail === newParent.toLowerCase() && mExt?.on === wantExt && mailExt.length === 1 && mailExt[0].html.includes(RO_DATE.format(new Date(wantExt))) && /Contul e oprit până răspunde un părinte/.test(mailExt[0].html), `${extRes.status()} · ${mExt ? new Date(mExt.on).toISOString() : "—"} · ${rExtAfter.parentConsentEmail} · ${mailExt.length} e-mail`);

  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await signIn(pg, iA.email);
  const plans = await (await pg.request.get(`${BASE}/api/plans`)).json().catch(() => null);
  check("I23 oferta de revenire la plată: activă, de tip „winback”, până la sfârșitul zilei ștergerii", plans?.current?.trialOffer?.active === true && plans.current.trialOffer.kind === "winback" && new Date(plans.current.trialOffer.endsAt).getTime() === tA.eraseAt, JSON.stringify(plans?.current?.trialOffer ?? plans)?.slice(0, 200));
  await pg.goto(`${BASE}/ro/dashboard/packages?plan=FAMILY`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(800);
  const pkg = await pg.evaluate(() => document.body.innerText);
  await pg.screenshot({ path: `${SHOTS}/pachete-oferta-revenire.png`, fullPage: true });
  check("I24 pagina de pachete arată oferta de revenire", /dacă reactivezi acum/.test(pkg));
  await ctx.close();
  const iAlogin = await prisma.user.findUnique({ where: { id: iA.id }, select: { lastLoginAt: true } });
  const run3 = await cron();
  check("I25 după intrarea în cont: ceasul repornește, nimic nu se mai trimite, oferta rămâne până la data ei", run3.status === 200 && !!iAlogin?.lastLoginAt && (await exists(iA.id)) && mailsTo(iA.email).length === 1 && !!(await prisma.verificationToken.findFirst({ where: { identifier: `winback:${iA.id}`, expires: { gt: new Date() } } })));
  check("D5 adresa moartă, a treia încercare: acum reminderul contează ca dat (ca să nu țină contul la nesfârșit)", (await reminders(rBounce)).some((m) => m.stage === "stopped") && (await failCount(`parent-consent-reminder-fail:${rBounce.id}:stopped`)) === 3);
  check("D6 contul inactiv cu adresă moartă: tot neconsiderat avertizat după 3 rulări? — nu: la a treia contează", (await warnings(iBounce.id)).some((m) => m.stage === "month") && (await failCount(`inactive-warning-fail:${iBounce.id}:month`)) === 3);
} catch (e) {
  console.error(e);
  results.push(false);
} finally {
  await browser?.close().catch(() => {});
  await wipe().catch((e) => console.error("wipe", e));
  if (origSwitch) await prisma.appSetting.update({ where: { key: "accessTrial" }, data: { value: origSwitch.value } });
  else await prisma.appSetting.deleteMany({ where: { key: "accessTrial" } });
  if (origCursor) await prisma.appSetting.upsert({ where: { key: "inactiveSweepCursor" }, create: { key: "inactiveSweepCursor", value: origCursor.value }, update: { value: origCursor.value } });
  else await prisma.appSetting.deleteMany({ where: { key: "inactiveSweepCursor" } });
  await prisma.$disconnect();
  smtp.close();
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} trecute`);
  process.exit(passed === results.length ? 0 : 1);
}
