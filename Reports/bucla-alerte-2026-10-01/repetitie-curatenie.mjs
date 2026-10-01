// Repetiția curățeniei de dinainte de repornire (01.10.2026), pe baza de test locală tutor_qa:
// seamănă cele trei situații, rulează curatenie-inainte-de-repornire.sql și verifică rezultatul.
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/bucla-alerte-2026-10-01/repetitie-curatenie.mjs
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const MIN = 60_000, HOUR = 60 * MIN, ago = (ms) => new Date(Date.now() - ms);
const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };
const TAG = "qa-curatenie1001";
const wipe = () => prisma.user.deleteMany({ where: { email: { startsWith: TAG } } });
try {
  await wipe();
  const p = await prisma.user.create({ data: { email: `${TAG}-p@qa.etutor.ro`, accountRole: "PARENT" } });
  const c = await prisma.user.create({ data: { email: `${TAG}-c@example.invalid`, accountRole: "STUDENT" } });
  // An older chain's last rung (the old rule's window start) and the current chain: first rung + a rung still waiting.
  await prisma.escalationEvent.create({ data: { userId: c.id, level: 5, status: "COMPLETED", channel: "SMS", createdAt: ago(9 * HOUR), sentAt: ago(9 * HOUR) } });
  const first = await prisma.escalationEvent.create({ data: { userId: c.id, level: 1, status: "COMPLETED", channel: "PUSH", createdAt: ago(5 * HOUR), sentAt: ago(5 * HOUR) } });
  const waiting = await prisma.escalationEvent.create({ data: { userId: c.id, level: 2, status: "PENDING", channel: "TELEGRAM", createdAt: ago(4.5 * HOUR) } });
  // An episode opened under the old rule (start = the window's earliest event) and still waiting, rung 84.
  const ep = await prisma.parentEscalation.create({ data: { parentId: p.id, childId: c.id, status: "awaiting_parent", createdAt: ago(4 * HOUR), openedFor: ago(9 * HOUR), parentAlertRung: 84 } });
  // A closed episode whose start is already the right one: must not move.
  const right = await prisma.parentEscalation.create({ data: { parentId: p.id, childId: c.id, status: "resolved_positive", createdAt: ago(3 * HOUR), openedFor: ago(2 * HOUR) } });

  execSync("docker exec -i tutor-qa-pg psql -U tutor -d tutor_qa -v ON_ERROR_STOP=1 -q", {
    input: (await import("node:fs")).readFileSync(new URL("./curatenie-inainte-de-repornire.sql", import.meta.url)),
    stdio: ["pipe", "ignore", "inherit"],
  });

  const w = await prisma.escalationEvent.findUnique({ where: { id: waiting.id } });
  check("1 treapta care aștepta e închisă, netrimisă, marcată „paused”", w.status === "COMPLETED" && w.sentAt === null && w.metadata?.closed === "paused");
  const f = await prisma.escalationEvent.findUnique({ where: { id: first.id } });
  check("2 treptele deja trimise rămân neatinse", f.status === "COMPLETED" && f.metadata == null);
  const e = await prisma.parentEscalation.findUnique({ where: { id: ep.id } });
  check("3 episodul deschis e închis fără mesaj", e.status === "expired" && e.resolvedAt != null);
  check("4 episodul vechi primește începutul lanțului raportat (prima treaptă)", e.openedFor.getTime() === first.createdAt.getTime(), `${e.openedFor.toISOString()} vs ${first.createdAt.toISOString()}`);
  const r = await prisma.parentEscalation.findUnique({ where: { id: right.id } });
  check("5 un început deja corect nu coboară", r.openedFor.getTime() === right.openedFor.getTime() && r.status === "resolved_positive");
} catch (err) {
  console.error(err);
  results.push(false);
} finally {
  await wipe().catch(() => undefined);
  await prisma.$disconnect();
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} trecute`);
  process.exit(passed === results.length ? 0 : 1);
}
