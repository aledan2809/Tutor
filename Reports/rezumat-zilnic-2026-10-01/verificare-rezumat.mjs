// Rezumatul zilnic pentru părinți (01.10.2026), pe stiva QA locală (Tutor :3113, tutor_qa), cu cron-ul adevărat
// și e-mailurile prinse într-o cutie poștală falsă (:2525). Ora „acum” e cea a României.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/rezumat-zilnic-2026-10-01/verificare-rezumat.mjs
import { createRequire } from "node:module";
import net from "node:net";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const { simpleParser } = createRequire("/Users/danciulescu/Projects/Consult/package.json")("mailparser");

const BASE = "http://localhost:3113";
const TZ = "Europe/Bucharest";
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-rezumat1001";
const s = Date.now().toString().slice(-6);
const MIN = 60_000;
const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };
const hhmm = (ms) => new Date(ms).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

const inbox = [];
const smtp = net.createServer((sock) => {
  let buf = "", inData = false, lines = [], to = [], authWait = false;
  const w = (l) => sock.write(l + "\r\n");
  w("220 fake");
  sock.on("data", (c) => {
    buf += c.toString("utf8");
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2);
      if (inData) {
        if (line === ".") { inData = false; const rcpt = to.map((t) => t.toLowerCase()); simpleParser(lines.join("\r\n")).then((m) => inbox.push({ to: rcpt, subject: m.subject ?? "", text: m.html || m.text || "" })); lines = []; to = []; w("250 OK"); }
        else lines.push(line.startsWith("..") ? line.slice(1) : line);
        continue;
      }
      if (authWait) { authWait = false; w("235 OK"); continue; }
      const up = line.toUpperCase();
      if (up.startsWith("EHLO")) sock.write("250-fake\r\n250-AUTH PLAIN\r\n250 8BITMIME\r\n");
      else if (up.startsWith("AUTH")) { if (line.trim().split(/\s+/).length > 2) w("235 OK"); else { authWait = true; w("334 "); } }
      else if (up.startsWith("RCPT")) { to.push((line.match(/<([^>]+)>/) || [])[1] ?? ""); w("250 OK"); }
      else if (up.startsWith("DATA")) { inData = true; w("354 go"); }
      else if (up.startsWith("QUIT")) { w("221 bye"); sock.end(); }
      else w("250 OK");
    }
  });
  sock.on("error", () => {});
});
await new Promise((r) => smtp.listen(2525, "127.0.0.1", r));
const mailsTo = (a) => inbox.filter((m) => m.to.includes(a.toLowerCase()));

const cron = async () => {
  const r = await fetch(`${BASE}/api/cron/escalation`, { method: "POST", headers: { authorization: "Bearer qa-cron-local" }, signal: AbortSignal.timeout(300_000) });
  const j = await r.json().catch(() => null);
  await new Promise((res) => setTimeout(res, 800));
  return j;
};
const mk = (k, data = {}, domain = "qa.etutor.ro") => prisma.user.create({ data: { email: `${TAG}-${k}-${s}@${domain}`, name: `QA ${k}`, ...data } });
const ev = (userId, level, channel, createdMinAgo, sentMinAgo) =>
  prisma.escalationEvent.create({ data: { userId, level, status: "COMPLETED", channel, createdAt: new Date(Date.now() - createdMinAgo * MIN), sentAt: new Date(Date.now() - sentMinAgo * MIN) } });
const lapse = async (childId, agoMin) => { const f = await ev(childId, 1, "PUSH", agoMin + 10, agoMin + 10); await ev(childId, 5, "SMS", agoMin + 5, agoMin); return f; };
const digestPrefs = (userId, at, quiet = {}) =>
  prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, selfAlertMode: "DIGEST", selfAlertAt: at, timezone: TZ, ...quiet },
    update: { selfAlertMode: "DIGEST", selfAlertAt: at, timezone: TZ, ...quiet },
  });
const later = hhmm(Date.now() + 120 * MIN);
const dueNow = hhmm(Date.now() - MIN);

async function wipe() {
  const users = await prisma.user.findMany({ where: { email: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
}

try {
  await wipe();
  const pd = await mk("pd", { accountRole: "PARENT" });
  const c = await mk("c", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: pd.id, childId: c.id } });
  await digestPrefs(pd.id, later);

  // ── The day: two ignored reminders (the second replaces the first), a late answer, a prompt answer ──
  const a = await lapse(c.id, 120);
  await cron();
  const b = await lapse(c.id, 60);
  await cron();
  await lapse(c.id, 20);
  await prisma.session.create({ data: { userId: c.id, startedAt: new Date() } });
  await cron();
  const rows = await prisma.notification.findMany({ where: { userId: pd.id, type: "parent_alert" } });
  check("1 în timpul zilei: nimic pe e-mail, alertele rămân doar în aplicație", mailsTo(pd.email).length === 0 && rows.length >= 2 && rows.every((r) => r.metadata?.delivered === false), `${rows.length} rânduri în aplicație`);

  // ── The chosen time comes (inside quiet hours, on purpose) ──
  await digestPrefs(pd.id, dueNow, { quietHoursStart: hhmm(Date.now() - 60 * MIN), quietHoursEnd: hhmm(Date.now() + 60 * MIN) });
  await cron();
  const mails = mailsTo(pd.email);
  const body = mails[0]?.text ?? "";
  check("2 la ora aleasă, chiar în orele de liniște: exact un mesaj", mails.length === 1 && mails[0].subject === "Rezumatul zilei pe eTutor.ro: QA c", mails.map((m) => m.subject).join(" | "));
  check(
    "3 mesajul spune ce s-a întâmplat: cele două remindere ignorate cu orele lor, revenirea, răspunsul, sesiunea",
    body.includes(`2 remindere ignorate (${hhmm(a.createdAt.getTime())}, ${hhmm(b.createdAt.getTime())})`) && body.includes("a revenit mai târziu la unul dintre ele") && body.includes("a răspuns la un reminder") && body.includes("o sesiune de studiu"),
    body.replace(/<[^>]+>/g, " ").slice(0, 300),
  );
  await cron();
  check("4 a doua rulare în aceeași zi nu mai trimite nimic", mailsTo(pd.email).length === 1);

  // ── The next digest: it starts where the previous one stopped, and tells what changed since ──
  const yesterday = new Date(Date.now() - 24 * 60 * MIN).toLocaleDateString("en-CA", { timeZone: TZ });
  await prisma.setting.update({
    where: { userId_key: { userId: pd.id, key: "parentDigest" } },
    data: { value: { day: yesterday, checkedAtMs: Date.now() } },
  });
  await new Promise((r) => setTimeout(r, 1000));
  const old = await prisma.parentEscalation.create({
    data: { parentId: pd.id, childId: c.id, status: "resolved_positive", parentAlertRung: 1, openedFor: new Date(Date.now() - 130 * MIN), createdAt: new Date(Date.now() - 120 * MIN), resolvedAt: new Date() },
  });
  await prisma.notification.create({ data: { userId: pd.id, type: "threshold_alert", title: "Prag atins: QA c", message: "m", metadata: {} } });
  await cron();
  const next = mailsTo(pd.email)[1]?.text ?? "";
  check(
    "7 rezumatul următor: doar ce a venit de la cel dinainte — reminderul de ieri la care a răspuns între timp și alerta de prag, fără reminderele deja spuse",
    mailsTo(pd.email).length === 2 && next.includes(`a răspuns între timp la reminderul de la ${hhmm(old.openedFor.getTime())}`) && next.includes("Alte alerte: Prag atins: QA c") && !next.includes("ignorat"),
    next.replace(/<[^>]+>/g, " ").slice(0, 300),
  );

  // ── A day with nothing: no message ──
  const pn = await mk("pn", { accountRole: "PARENT" });
  const cn = await mk("cn", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: pn.id, childId: cn.id } });
  await digestPrefs(pn.id, dueNow);
  await cron();
  check("5 o zi fără nimic: niciun mesaj", mailsTo(pn.email).length === 0);

  // ── Two runs at once: one message ──
  const pk = await mk("pk", { accountRole: "PARENT" });
  const ck = await mk("ck", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: pk.id, childId: ck.id } });
  await digestPrefs(pk.id, dueNow);
  await lapse(ck.id, 60);
  await Promise.all([cron(), cron()]);
  await cron();
  check("6 rulări suprapuse: un singur mesaj", mailsTo(pk.email).length === 1, `${mailsTo(pk.email).length} mesaje`);
} catch (e) {
  console.error(e);
  results.push(false);
} finally {
  await wipe().catch((e) => console.error("wipe", e));
  await prisma.$disconnect();
  smtp.close();
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} trecute`);
  process.exit(passed === results.length ? 0 : 1);
}
