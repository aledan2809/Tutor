// Rândul (lease) se reînnoiește cât lucrează rularea (01.10.2026), pe baza de test locală tutor_qa:
// un rând de 15 s, o rulare de 25 s; la secunda 20 — după ce rândul inițial ar fi expirat — o a doua
// încercare trebuie să se dea la o parte. După rulare, rândul e eliberat.
//   cd /Users/danciulescu/Projects/Tutor && DATABASE_URL=postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa npx tsx Reports/bucla-alerte-2026-10-01/verificare-rand-reinnoit.ts
import { prisma } from "@/lib/prisma";
import { withCronLease } from "@/lib/cron-lease";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const results: boolean[] = [];
const check = (n: string, ok: boolean, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};

async function main() {
  const name = `qa-reinnoire-${Date.now()}`;
  let second: { ran: boolean } | null = null;
  const first = withCronLease(name, 15_000, async () => {
    await sleep(20_000);
    second = await withCronLease(name, 15_000, async () => "a doua");
    await sleep(5_000);
    return "prima";
  });
  const r = await first;
  check("1 rularea lungă își termină lucrul", r.ran === true);
  check("2 la secunda 20 (rândul inițial de 15 s expirase) a doua încercare s-a dat la o parte", second !== null && (second as { ran: boolean }).ran === false);
  const after = await withCronLease(name, 15_000, async () => "după");
  check("3 după rulare, rândul e liber", after.ran === true);
  await prisma.appSetting.delete({ where: { key: `cronLease:${name}` } }).catch(() => undefined);
  await prisma.$disconnect();
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} trecute`);
  process.exit(passed === results.length ? 0 : 1);
}
main();
