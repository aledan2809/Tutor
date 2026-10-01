// Adresele oprite + limitele de timp la trimitere (01.10.2026), pe stiva QA locală (Tutor :3113, tutor_qa),
// cu webhook-ul semnat ca de Resend și e-mailurile prinse într-o cutie poștală falsă (:2525).
// Serverul QA rulează cu RESEND_WEBHOOK_SECRET=whsec_cWEtcmVzZW5kLXdlYmhvb2stc2VjcmV0LW5vdC1yZWFs (de test).
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/adrese-oprite-2026-10-01/verificare-adrese-oprite.mjs
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import net from "node:net";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const { simpleParser } = createRequire("/Users/danciulescu/Projects/Consult/package.json")("mailparser");

const BASE = "http://localhost:3113";
const SECRET = "whsec_cWEtcmVzZW5kLXdlYmhvb2stc2VjcmV0LW5vdC1yZWFs";
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-oprite1001";
const s = Date.now().toString().slice(-6);
const MIN = 60_000;
const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── fake SMTP; a recipient matching `stallFor` gets no answer after its message (a server gone silent) ──
const inbox = [];
let stallFor = null;
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
        if (line === ".") {
          inData = false;
          const rcpt = to.map((t) => t.toLowerCase());
          if (stallFor && rcpt.some((r) => stallFor.test(r))) { to = []; lines = []; continue; } // silent
          simpleParser(lines.join("\r\n")).then((m) => inbox.push({ to: rcpt, subject: m.subject ?? "" }));
          lines = []; to = []; w("250 OK");
        } else lines.push(line.startsWith("..") ? line.slice(1) : line);
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

// ── a webhook signed like Resend's (Svix) ──
const key = Buffer.from(SECRET.slice("whsec_".length), "base64");
let n = 0;
const hook = async (event, { sign = true, ts = Math.floor(Date.now() / 1000) } = {}) => {
  const body = JSON.stringify(event);
  const id = `msg_${s}_${++n}`;
  const sig = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  const headers = { "content-type": "application/json", "svix-id": id, "svix-timestamp": String(ts) };
  if (sign) headers["svix-signature"] = `v1,${sig}`;
  const r = await fetch(`${BASE}/api/webhooks/resend`, { method: "POST", headers, body });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const at = (msAgo = 0) => new Date(Date.now() - msAgo).toISOString();
const bounced = (to) => ({ type: "email.bounced", created_at: at(), data: { from: "eTutor <noreply@techbiz.ae>", to: [to], bounce: { type: "Permanent", subType: "General", message: "x" } } });
const complained = (to, from = "MA <hello@techbiz.ae>") => ({ type: "email.complained", created_at: at(), data: { from, to: [to] } });
const delivered = (to, msAgo = 0) => ({ type: "email.delivered", created_at: at(msAgo), data: { from: "MA <hello@techbiz.ae>", to: [to] } });
// Only a keyed hash of the address is kept (the QA server's AUTH_SECRET).
const hashOf = (email) => createHmac("sha256", "email-suppression:local-qa-secret-not-real-0123456789abcdef").update(email.trim().toLowerCase()).digest("hex");
const released = async (email) => { const r = await row(email); return !!r && r.releasedAt !== null && r.lastEventAt < r.releasedAt; };
const row = (email) => prisma.emailSuppression.findUnique({ where: { emailHash: hashOf(email) } });

const cron = async () => {
  const t = Date.now();
  const r = await fetch(`${BASE}/api/cron/escalation`, { method: "POST", headers: { authorization: "Bearer qa-cron-local" }, signal: AbortSignal.timeout(300_000) });
  const j = await r.json().catch(() => null);
  await sleep(800);
  return { ms: Date.now() - t, pm: j?.parentMonitoring };
};
const notes = (userId, alertType) => prisma.notification.count({ where: { userId, type: "parent_alert", ...(alertType ? { metadata: { path: ["alertType"], equals: alertType } } : {}) } });
const mk = (k, data = {}, domain = "qa.etutor.ro") => prisma.user.create({ data: { email: `${TAG}-${k}-${s}@${domain}`, name: `QA ${k}`, ...data } });
const ev = (userId, level, channel, createdMinAgo, sentMinAgo) =>
  prisma.escalationEvent.create({ data: { userId, level, status: "COMPLETED", channel, createdAt: new Date(Date.now() - createdMinAgo * MIN), sentAt: new Date(Date.now() - sentMinAgo * MIN) } });
const lapse = async (childId) => { await ev(childId, 1, "PUSH", 70, 70); await ev(childId, 5, "SMS", 65, 60); };

const probeHashes = new Set();
async function wipe() {
  const users = await prisma.user.findMany({ where: { email: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.verificationToken.deleteMany({ where: { identifier: { contains: TAG } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.emailSuppression.deleteMany({ where: { emailHash: { in: [...probeHashes] } } });
}

try {
  await wipe();
  const pa = await mk("pa", { accountRole: "PARENT", password: "x" }); // will bounce
  const pb = await mk("pb", { accountRole: "PARENT", password: "x" }); // will complain
  const pc = await mk("pc", { accountRole: "PARENT" }); // control
  for (const p of [pa, pb, pc]) probeHashes.add(hashOf(p.email));

  // ── 1. The webhook only takes what Resend signed, and only recently ──
  const unsigned = await hook(bounced(pa.email), { sign: false });
  const stale = await hook(bounced(pa.email), { ts: Math.floor(Date.now() / 1000) - 600 });
  const big = await fetch(`${BASE}/api/webhooks/resend`, {
    method: "POST",
    headers: { "content-type": "application/json", "svix-id": "msg_big", "svix-timestamp": String(Math.floor(Date.now() / 1000)), "svix-signature": "v1,x" },
    body: JSON.stringify({ pad: "x".repeat(70 * 1024) }),
  });
  check("1 fără semnătură, cu semnătură veche sau prea mare: refuzat, nimic oprit", unsigned.status === 401 && stale.status === 401 && big.status === 413 && !(await row(pa.email)), `${unsigned.status} / ${stale.status} / ${big.status}`);

  // ── 2. A permanent bounce stops the address; Resend's retry of the same event changes nothing else ──
  const b1 = await hook(bounced(pa.email.toUpperCase()));
  const b2 = await hook(bounced(pa.email));
  const ra = await row(pa.email);
  check("2 o respingere definitivă oprește adresa: o singură înregistrare, doar amprenta adresei", b1.status === 200 && b1.json?.changed === 1 && b2.status === 200 && ra?.reason === "bounced" && ra?.count === 2 && !JSON.stringify(ra).includes("@"), JSON.stringify({ reason: ra?.reason, count: ra?.count }));

  // ── 3. A complaint (about any app's mail: Resend suppresses per account) stops automatic mail; a bounce stays a bounce ──
  const comp = await hook(complained(pb.email));
  await hook(complained(pa.email));
  const supp = await hook({ type: "email.suppressed", created_at: at(), data: { to: [pc.email.replace("-pc-", "-px-")] } });
  probeHashes.add(hashOf(pc.email.replace("-pc-", "-px-")));
  const group = await hook({ type: "email.bounced", created_at: at(), data: { to: [pc.email, `${TAG}-alt-${s}@qa.etutor.ro`], bounce: { type: "Permanent" } } });
  check("3 plângerea oprește adresa (de la orice aplicație), o respingere rămâne respingere, „suppressed” e notată; un mesaj cu mai mulți destinatari e ignorat", group.json?.changed === 0 && !(await row(pc.email)) && comp.json?.changed === 1 && (await row(pb.email))?.reason === "complained" && (await row(pa.email))?.reason === "bounced" && (await row(pc.email.replace("-pc-", "-px-")))?.reason === "suppressed" && supp.status === 200);

  // ── 4. Automatic mail: nothing to a bounced or complained address; the in-app alert stays ──
  const c = await mk("c", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  for (const p of [pa, pb, pc]) await prisma.guardian.create({ data: { parentId: p.id, childId: c.id } });
  await lapse(c.id);
  await cron();
  check("4 alerta automată: nimic spre adresele oprite, anunțul rămâne în aplicație; adresa normală primește", mailsTo(pa.email).length === 0 && mailsTo(pb.email).length === 0 && (await notes(pa.id, "no_reaction")) === 1 && (await notes(pb.id, "no_reaction")) === 1 && mailsTo(pc.email, /Nu a reacționat/).length === 1);

  // ── 5. Mail the person asks for always goes to the provider (on production Resend decides) ──
  for (const p of [pb, pa]) {
    await fetch(`${BASE}/api/auth/forgot-password`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: p.email }) });
  }
  await sleep(4000);
  check("5 resetarea parolei cerută de om nu e oprită de listă (decide Resend)", mailsTo(pb.email, /Parola nouă/).length === 1 && mailsTo(pa.email, /Parola nouă/).length === 1, `pb ${mailsTo(pb.email).length} · pa ${mailsTo(pa.email).length}`);

  // ── 5b. A later delivery releases the address; one dated before the complaint doesn't ──
  const olderDelivery = await hook(delivered(pb.email, 10 * MIN));
  const stillThere = await row(pb.email);
  const fresh = await hook(delivered(pb.email));
  const lateOld = await hook({ ...complained(pb.email), created_at: at(5 * MIN) }); // a retry, older than the release
  check("5b o livrare mai veche decât plângerea n-o eliberează; una mai nouă da; o plângere veche sosită târziu n-o oprește din nou", olderDelivery.json?.changed === 0 && !!stillThere && stillThere.releasedAt === null && fresh.json?.changed === 1 && lateOld.status === 200 && (await released(pb.email)));
  // Released: the next automatic alert reaches pb again.
  await prisma.parentEscalation.updateMany({ where: { childId: c.id, parentId: pb.id }, data: { lastParentNotifiedAt: new Date(Date.now() - 31 * MIN) } });
  await cron();
  check("5c după eliberare, alerta automată ajunge din nou la adresă", mailsTo(pb.email, /Încă nu a reacționat/).length === 1);

  // ── 6. A mail server gone silent no longer holds the run: the send gives up within its limit ──
  const pd = await mk("pd", { accountRole: "PARENT" });
  const cd = await mk("cd", { accountRole: "STUDENT", birthDate: new Date("2000-01-01") }, "example.invalid");
  await prisma.guardian.create({ data: { parentId: pd.id, childId: cd.id } });
  await lapse(cd.id);
  stallFor = new RegExp(`^${TAG}-pd-`);
  const r6 = await cron();
  stallFor = null;
  check("6 un server de e-mail care tace după mesaj nu mai ține rularea: renunță în ~20 s", r6.pm?.opened >= 1 && r6.ms < 60_000 && (await notes(pd.id, "no_reaction")) === 1, `rularea a durat ${Math.round(r6.ms / 1000)} s`);
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
