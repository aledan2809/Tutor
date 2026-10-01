// Bucla de alerte către părinți (01.10.2026): pe stiva QA locală (Tutor :3113, baza tutor_qa), cu cron-ul adevărat
// (/api/cron/escalation) și e-mailurile prinse într-o cutie poștală falsă (:2525). Verifică limitele noi:
//   o ratare deja raportată nu mai pare nouă (nici când prima treaptă iese din fereastră, nici când o treaptă
//   târzie apare după episod) · reminderul autorizat nu deschide alt episod · ratarea de seară după o reacție
//   de dimineață se raportează · o ratare nouă înlocuiește episodul care aștepta · cel mult 3
//   re-anunțări pe episod · episodul de peste o zi se închide fără mesaj · un singur „A reacționat ✅” per copil,
//   oricâte episoade închide · cel mult 8 alerte livrate pe zi unui părinte, în afară de prima a unei ratări,
//   și niciodată peste 12 ·
//   nimic spre adrese de test (test.com) · nimic spre un părinte scos din familie · două rulări simultane nu
//   dublează nimic.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/bucla-alerte-2026-10-01/verificare-alerte-parinte.mjs
import { createRequire } from "node:module";
import net from "node:net";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const { simpleParser } = createRequire("/Users/danciulescu/Projects/Consult/package.json")("mailparser");

const BASE = "http://localhost:3113";
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-alerte1001";
const s = Date.now().toString().slice(-6);
const MIN = 60_000, HOUR = 60 * MIN;
const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };

// ── fake SMTP inbox ──
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
        if (line === ".") { inData = false; const rcpt = to.map((t) => t.toLowerCase()); simpleParser(lines.join("\r\n")).then((m) => inbox.push({ to: rcpt, subject: m.subject ?? "" })); lines = []; to = []; w("250 OK"); }
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
const mailsTo = (a, re) => inbox.filter((m) => m.to.includes(a.toLowerCase()) && (!re || re.test(m.subject)));

const cron = async () => {
  const r = await fetch(`${BASE}/api/cron/escalation`, { method: "POST", headers: { authorization: "Bearer qa-cron-local" }, signal: AbortSignal.timeout(300_000) });
  const j = await r.json().catch(() => null);
  await new Promise((res) => setTimeout(res, 800));
  return j?.parentMonitoring ?? j;
};
const notes = (userId, alertType) => prisma.notification.count({ where: { userId, type: "parent_alert", ...(alertType ? { metadata: { path: ["alertType"], equals: alertType } } : {}) } });

async function wipe() {
  const users = await prisma.user.findMany({ where: { email: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } }); // episodes, events, sessions, links cascade
  }
}

// Parents: an address the new guard lets through (the fake inbox on :2525 takes it; nothing leaves this machine).
const mk = (k, data = {}, domain = "qa.etutor.ro") => prisma.user.create({ data: { email: `${TAG}-${k}-${s}@${domain}`, name: `QA ${k}`, ...data } });
// A chain that ran to its last rung without a reaction: its first rung (level 1, which is how a chain is
// known) and its last (5 = SMS). On an earlier rung the engine would carry the chain on, and a running
// chain opens no episode. Returns the first rung.
const ev = (userId, level, channel, createdMinAgo, sentMinAgo, metadata) =>
  prisma.escalationEvent.create({
    data: { userId, level, status: "COMPLETED", channel, createdAt: new Date(Date.now() - createdMinAgo * MIN), sentAt: sentMinAgo == null ? null : new Date(Date.now() - sentMinAgo * MIN), ...(metadata ? { metadata } : {}) },
  });
const lapse = async (childId, agoMin, metadata) => {
  const first = await ev(childId, 1, "PUSH", agoMin + 10, agoMin + 10, metadata);
  await ev(childId, 5, "SMS", agoMin + 5, agoMin, metadata);
  return first;
};

try {
  await wipe();
  // A child with two parents; the second has a seed-style address (test.com).
  const p1 = await mk("p1", { accountRole: "PARENT" });
  const p2 = await prisma.user.create({ data: { email: `${TAG}-p2-${s}@test.com`, name: "QA p2", accountRole: "PARENT" } });
  const c = await mk("c", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p1.id, childId: c.id } });
  await prisma.guardian.create({ data: { parentId: p2.id, childId: c.id } });
  const chain1 = await lapse(c.id, 60);

  // ── 1. A lapse opens one episode per parent and one notice; nothing goes to test.com ──
  const r1 = await cron();
  const eps1 = await prisma.parentEscalation.findMany({ where: { childId: c.id }, orderBy: { createdAt: "asc" } });
  check("1 o ratare deschide câte un episod pentru fiecare părinte și un singur anunț", r1?.opened >= 1 && eps1.length === 2 && eps1.every((e) => e.status === "awaiting_parent") && (await notes(p1.id, "no_reaction")) === 1, JSON.stringify(r1));
  check("2 părintele real primește e-mailul; cel cu adresă test.com primește doar anunțul din aplicație", mailsTo(p1.email, /Nu a reacționat/).length === 1 && mailsTo(p2.email).length === 0 && (await notes(p2.id, "no_reaction")) === 1);

  // ── 2. The same lapse, its first rung leaving the 12-hour window: nothing new (the old loop) ──
  const aged = new Date(Date.now() - 13 * HOUR);
  await prisma.escalationEvent.update({ where: { id: chain1.id }, data: { createdAt: aged, sentAt: aged } });
  await prisma.parentEscalation.updateMany({ where: { childId: c.id }, data: { openedFor: aged } });
  const r2 = await cron();
  check("3 aceeași ratare, cu evenimentele vechi ieșite din fereastră: niciun episod nou, niciun anunț nou", (await prisma.parentEscalation.count({ where: { childId: c.id } })) === 2 && mailsTo(p1.email, /Nu a reacționat/).length === 1 && (await notes(p1.id, "no_reaction")) === 1, JSON.stringify(r2));

  // ── 3. Re-notifications: at most 3 per episode ──
  const e1 = eps1.find((e) => e.parentId === p1.id);
  for (let i = 0; i < 5; i++) {
    await prisma.parentEscalation.update({ where: { id: e1.id }, data: { lastParentNotifiedAt: new Date(Date.now() - 31 * MIN) } });
    await cron();
  }
  const e1after = await prisma.parentEscalation.findUnique({ where: { id: e1.id } });
  check("4 cel mult 3 re-anunțări pe episod, apoi așteaptă în liniște", mailsTo(p1.email, /Încă nu a reacționat/).length === 3 && e1after.parentAlertRung === 4 && e1after.status === "awaiting_parent", `${mailsTo(p1.email, /Încă nu a reacționat/).length} e-mailuri · treapta ${e1after.parentAlertRung}`);

  // ── 4. Two runs at once: one does the work, the other stands aside ──
  const e2 = eps1.find((e) => e.parentId === p2.id);
  await prisma.parentEscalation.update({ where: { id: e2.id }, data: { lastParentNotifiedAt: new Date(Date.now() - 31 * MIN), parentAlertRung: 1 } });
  const before = await notes(p2.id, "no_reaction_reminder");
  const [a, b] = await Promise.all([cron(), cron()]);
  const after = await notes(p2.id, "no_reaction_reminder");
  check("5 două rulări simultane: re-anunțul pleacă o singură dată", after - before === 1 && [a, b].some((x) => x?.ran === true), `${JSON.stringify(a)} | ${JSON.stringify(b)} · ${after - before} re-anunț`);
  // A run still holding the lease (the 30.09 case: a run 14 hours long): the next one stands aside.
  const holdLease = (key) =>
    prisma.appSetting.upsert({
      where: { key },
      create: { key, value: { untilMs: Date.now() + 10 * MIN, token: "qa-held" } },
      update: { value: { untilMs: Date.now() + 10 * MIN, token: "qa-held" } },
    });
  const freeLease = (key) => prisma.appSetting.update({ where: { key }, data: { value: { untilMs: 0 } } });
  await prisma.parentEscalation.update({ where: { id: e2.id }, data: { lastParentNotifiedAt: new Date(Date.now() - 31 * MIN) } });
  await holdLease("cronLease:parent-monitoring");
  const held = await cron();
  const afterHeld = await notes(p2.id, "no_reaction_reminder");
  await freeLease("cronLease:parent-monitoring");
  check("5b cât o rulare ține încă rândul monitorizării, următoarea nu trimite nimic", held?.ran === false && afterHeld === after, JSON.stringify(held));
  await holdLease("cronLease:escalation-route");
  const heldRoute = await cron();
  const afterRoute = await notes(p2.id, "no_reaction_reminder");
  await freeLease("cronLease:escalation-route");
  check("5c cât o rulare a întregului cron ține rândul, următoarea nu face nimic", heldRoute?.ran === false && heldRoute?.parentMonitoring === undefined && afterRoute === after, JSON.stringify(heldRoute));

  // ── 5. A NEW lapse while the old episode still waits (yesterday evening's, capped): it replaces it ──
  await prisma.parentEscalation.updateMany({ where: { childId: c.id }, data: { createdAt: new Date(Date.now() - 3 * HOUR), openedFor: new Date(Date.now() - 4 * HOUR) } });
  await lapse(c.id, 50); // this morning's chain, created after the waiting episode
  const r5 = await cron();
  const superseded = await prisma.parentEscalation.count({ where: { childId: c.id, status: "superseded" } });
  const openNow = await prisma.parentEscalation.findMany({ where: { childId: c.id, status: "awaiting_parent" } });
  check("6 o ratare nouă înlocuiește episodul care încă aștepta: părintele află de ea", superseded === 2 && openNow.length === 2 && openNow.every((e) => e.parentAlertRung === 1) && mailsTo(p1.email, /Nu a reacționat/).length === 2 && (await notes(p2.id, "no_reaction")) === 2 && mailsTo(p2.email).length === 0, JSON.stringify(r5));

  // ── 6. The child reacts: the open episodes close, one notice per parent ──
  await prisma.session.create({ data: { userId: c.id, startedAt: new Date() } });
  const r6 = await cron();
  const closed = await prisma.parentEscalation.count({ where: { childId: c.id, status: "resolved_positive" } });
  check("7 copilul reacționează: episoadele deschise se închid, fiecare părinte e anunțat O dată", r6?.resolvedPositive >= 2 && closed === 2 && (await notes(p1.id, "reacted_positive")) === 1 && (await notes(p2.id, "reacted_positive")) === 1 && mailsTo(p1.email, /A reacționat/).length === 1, JSON.stringify(r6));
  await cron();
  check("8 rularea următoare nu mai anunță nimic", (await notes(p1.id, "reacted_positive")) === 1 && mailsTo(p1.email, /A reacționat/).length === 1 && (await notes(p1.id, "no_reaction")) === 2);

  // ── 7. An episode left a day: closed without a word ──
  const p3 = await mk("p3", { accountRole: "PARENT" });
  const c3 = await mk("c3", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p3.id, childId: c3.id } });
  const old = await prisma.parentEscalation.create({ data: { parentId: p3.id, childId: c3.id, status: "awaiting_parent", createdAt: new Date(Date.now() - 25 * HOUR), openedFor: new Date(Date.now() - 26 * HOUR), parentAlertRung: 1, lastParentNotifiedAt: new Date(Date.now() - 2 * HOUR) } });
  const r7 = await cron();
  const oldAfter = await prisma.parentEscalation.findUnique({ where: { id: old.id } });
  check("9 un episod vechi de peste o zi se închide fără niciun mesaj", oldAfter.status === "expired" && (await notes(p3.id)) === 0 && mailsTo(p3.email).length === 0 && r7?.expired >= 1, JSON.stringify(r7));

  // ── 8. A parent who had 8 alerts delivered today ──
  const seedDelivered = async (parentId, childId) => {
    for (let i = 0; i < 8; i++) await prisma.notification.create({ data: { userId: parentId, type: "parent_alert", title: "qa", message: "x", metadata: { childId, alertType: "qa", delivered: true } } });
  };
  const p4 = await mk("p4", { accountRole: "PARENT" });
  const c4 = await mk("c4", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p4.id, childId: c4.id } });
  await seedDelivered(p4.id, c4.id);
  await prisma.parentEscalation.create({ data: { parentId: p4.id, childId: c4.id, status: "awaiting_parent", openedFor: new Date(Date.now() - 2 * HOUR), parentAlertRung: 1, lastParentNotifiedAt: new Date(Date.now() - 31 * MIN) } });
  await cron();
  check("10 peste 8 alerte livrate azi: re-anunțul rămâne în aplicație, fără e-mail", (await notes(p4.id, "no_reaction_reminder")) === 1 && mailsTo(p4.email).length === 0);
  // Rows that never reached a device (in-app only) don't count: a parent with 8 of those still gets mail.
  const p4b = await mk("p4b", { accountRole: "PARENT" });
  const c4b = await mk("c4b", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p4b.id, childId: c4b.id } });
  for (let i = 0; i < 8; i++) await prisma.notification.create({ data: { userId: p4b.id, type: "parent_alert", title: "qa", message: "x", metadata: { childId: c4b.id, alertType: "nudge_reacted" } } });
  await prisma.parentEscalation.create({ data: { parentId: p4b.id, childId: c4b.id, status: "awaiting_parent", openedFor: new Date(Date.now() - 2 * HOUR), parentAlertRung: 1, lastParentNotifiedAt: new Date(Date.now() - 31 * MIN) } });
  await cron();
  check("11 rândurile rămase doar în aplicație nu consumă plafonul", mailsTo(p4b.email, /Încă nu a reacționat/).length === 1);
  // The first alert of an episode always goes, whatever the day's count.
  const p5 = await mk("p5", { accountRole: "PARENT" });
  const c5 = await mk("c5", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p5.id, childId: c5.id } });
  await seedDelivered(p5.id, c5.id);
  await lapse(c5.id, 60);
  await cron();
  check("12 prima alertă a unei ratări pleacă și peste plafonul zilei", mailsTo(p5.email, /Nu a reacționat/).length === 1);
  // …but not past the hard ceiling: a child with many reminders can't make it lapses + 8.
  const p5b = await mk("p5b", { accountRole: "PARENT" });
  const c5b = await mk("c5b", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p5b.id, childId: c5b.id } });
  for (let i = 0; i < 12; i++) await prisma.notification.create({ data: { userId: p5b.id, type: "parent_alert", title: "qa", message: "x", metadata: { childId: c5b.id, alertType: "qa", delivered: true } } });
  await lapse(c5b.id, 60);
  await cron();
  check("12b peste 12 alerte livrate azi nu mai pleacă nici prima alertă a unei ratări (rămâne în aplicație)", mailsTo(p5b.email).length === 0 && (await notes(p5b.id, "no_reaction")) === 1);

  // ── 9. A slow cascade set by the parent: a rung of the same chain created after its episode ──
  const p7 = await mk("p7", { accountRole: "PARENT" });
  const c7 = await mk("c7", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p7.id, childId: c7.id } });
  await prisma.notificationPreference.create({ data: { userId: c7.id, escalationSteps: [{ channel: "PUSH", delayMinutes: 0 }, { channel: "EMAIL", delayMinutes: 600 }] } });
  await ev(c7.id, 1, "PUSH", 70, 70); // first rung; the next one waits 10 hours
  await cron();
  const opened7 = await notes(p7.id, "no_reaction");
  await ev(c7.id, 2, "EMAIL", 0, 50); // the chain's second (last) rung, created after the episode
  await cron();
  check("13 o treaptă târzie a aceluiași lanț nu deschide alt episod", opened7 === 1 && (await notes(p7.id, "no_reaction")) === 1 && (await prisma.parentEscalation.count({ where: { childId: c7.id } })) === 1);

  // ── 10. An extra cascade authorized by a parent without a paid plan, ignored again ──
  const p8 = await mk("p8", { accountRole: "PARENT" });
  const c8 = await mk("c8", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p8.id, childId: c8.id } });
  const chain8 = await lapse(c8.id, 120);
  // Opened after the first lapse and before the authorization, as in real life: the extra cascade's rungs
  // are newer than the episode, so a rule that only looked at "newer than the episode" took them for a
  // new lapse (the second review's P1-2).
  await prisma.parentEscalation.create({ data: { parentId: p8.id, childId: c8.id, status: "authorized", openedFor: chain8.createdAt, createdAt: new Date(Date.now() - 70 * MIN), authorizedAt: new Date(Date.now() - 61 * MIN), parentAlertRung: 1, lastParentNotifiedAt: new Date(Date.now() - 70 * MIN) } });
  await lapse(c8.id, 50, { reason: "parent_authorized", parentAuthorized: false });
  await cron();
  await cron();
  check("14 reminderul autorizat ignorat: un singur „Nu a reacționat ❌”, fără episod nou", (await notes(p8.id, "reacted_negative")) === 1 && (await notes(p8.id, "no_reaction")) === 0 && (await prisma.parentEscalation.count({ where: { childId: c8.id } })) === 1);

  // ── 11. Morning chain answered, evening chain ignored: the evening miss is reported ──
  const p9 = await mk("p9", { accountRole: "PARENT" });
  const c9 = await mk("c9", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p9.id, childId: c9.id } });
  await lapse(c9.id, 350);
  await prisma.session.create({ data: { userId: c9.id, startedAt: new Date(Date.now() - 340 * MIN), endedAt: new Date(Date.now() - 330 * MIN) } });
  await cron(); // the morning chain: answered
  await lapse(c9.id, 60); // the evening chain: ignored
  await cron();
  check("15 dimineața a răspuns, seara a ignorat: ratarea de seară ajunge la părinte", (await notes(p9.id, "no_reaction")) === 1 && mailsTo(p9.email, /Nu a reacționat la reminder/).length === 1);

  // ── 12. A prompt reaction is told once — even if the parent deletes the notice ──
  const p10 = await mk("p10", { accountRole: "PARENT" });
  const c10 = await mk("c10", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p10.id, childId: c10.id } });
  await lapse(c10.id, 60);
  await prisma.session.create({ data: { userId: c10.id, startedAt: new Date(Date.now() - 55 * MIN), endedAt: new Date(Date.now() - 40 * MIN) } });
  await cron();
  const told10 = await notes(p10.id, "reacted_positive");
  await prisma.notification.deleteMany({ where: { userId: p10.id } });
  await cron();
  check("16 o reacție promptă se anunță o dată, chiar dacă părintele șterge anunțul", told10 === 1 && (await notes(p10.id)) === 0 && mailsTo(p10.email, /A reacționat/).length === 1);

  // ── 13. A parent removed from the family gets no more re-notifications ──
  const p6 = await mk("p6", { accountRole: "PARENT" });
  const c6 = await mk("c6", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: p6.id, childId: c6.id, status: "removed" } });
  await prisma.parentEscalation.create({ data: { parentId: p6.id, childId: c6.id, status: "awaiting_parent", openedFor: new Date(Date.now() - 2 * HOUR), parentAlertRung: 1, lastParentNotifiedAt: new Date(Date.now() - 31 * MIN) } });
  await cron();
  check("17 un părinte scos din familie nu mai primește re-anunțuri", (await notes(p6.id)) === 0 && mailsTo(p6.email).length === 0);
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
