// A doua opinie pe două întrebări cu răspuns cunoscut: una marcată GREȘIT, una marcată corect.
//   cd /Users/danciulescu/Projects/Tutor && npx tsx --env-file=<fișier cu cheile AI> Reports/feedback-a-doua-opinie-2026-09-24/proba-a-doua-opinie.ts
import { secondOpinion } from "@/lib/content-quality-mesh";

const cases = [
  { name: "energia cinetică, marcată de 1000× greșit", expect: "disagrees",
    q: { content: "Un corp cu masa de 2 kg se mișcă cu viteza de 3 m/s. Care este energia sa cinetică?", options: ["9 J", "9 kJ", "6 J", "18 J"], correctAnswer: "9 kJ" } },
  { name: "aceeași întrebare, marcată corect", expect: "agrees",
    q: { content: "Un corp cu masa de 2 kg se mișcă cu viteza de 3 m/s. Care este energia sa cinetică?", options: ["9 J", "9 kJ", "6 J", "18 J"], correctAnswer: "9 J" } },
];
async function main() {
let ok = 0;
for (const c of cases) {
  const r = await secondOpinion(c.q);
  const pass = r.verdict === c.expect;
  if (pass) ok++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.name} → ${r.verdict} ${r.defect ?? ""} ${r.reason.slice(0, 120)}`);
}
console.log(`\n${ok}/${cases.length}`);
process.exit(ok === cases.length ? 0 : 1);
}
main();
