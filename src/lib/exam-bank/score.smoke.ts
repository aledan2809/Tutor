/**
 * Smoke test for the exam-bank scoring engine. Run: `npx tsx src/lib/exam-bank/score.smoke.ts`
 * Pure, offline, no DB / no API cost.
 */
import { scoreExamPaper, classifyPaperPoints, type ExamItemForScoring } from "./score";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}`, extra ?? "");
  }
}

// A tiny 3-item "paper": 1 MCQ (5p), 1 TF_GRID (6p, 6 cells), 1 OPEN (5p) → 16 item points + 4 oficiu = 20 max.
const items: ExamItemForScoring[] = [
  { label: "1", section: "S-I", type: "MCQ", points: 5, correctAnswer: "c" },
  {
    label: "2", section: "S-I", type: "TF_GRID", points: 6,
    rubric: [
      { points: 1, answer: "Adevărat" }, { points: 1, answer: "Fals" }, { points: 1, answer: "Adevărat" },
      { points: 1, answer: "Adevărat" }, { points: 1, answer: "Fals" }, { points: 1, answer: "Fals" },
    ],
  },
  { label: "3", section: "S-II", type: "OPEN", points: 5 },
];
const OFFICE = 4;
const MAXSCORE = 20;

// 1) perfect
let r = scoreExamPaper(items, {
  "S-I::1": { kind: "objective", value: "c" },
  "S-I::2": { kind: "grid", cells: ["Adevărat", "Fals", "Adevărat", "Adevărat", "Fals", "Fals"] },
  "S-II::3": { kind: "self", awardedPoints: 5 },
}, { officeBonus: OFFICE, maxScore: MAXSCORE });
check("perfect → note 10.00", r.note10 === 10 && !r.isEstimate, r);
check("perfect → rawPoints 16", r.rawPoints === 16, r.rawPoints);

// 2) all wrong (but all attempted) → office only → 1.00
r = scoreExamPaper(items, {
  "S-I::1": { kind: "objective", value: "a" },
  "S-I::2": { kind: "grid", cells: ["Fals", "Adevărat", "Fals", "Fals", "Adevărat", "Adevărat"] },
  "S-II::3": { kind: "self", awardedPoints: 0 },
}, { officeBonus: OFFICE, maxScore: MAXSCORE });
// scale divisor = maxScore/10 = 2 → office-only = 4/2 = 2.00 (on a 100-pt paper the analogue is 1.00)
check("all wrong → note = oficiu only (2.00 on this 20-pt mini)", r.note10 === 2 && !r.isEstimate, r);

// 3) TF_GRID partial 4/6
r = scoreExamPaper(items, {
  "S-I::2": { kind: "grid", cells: ["Adevărat", "Fals", "Adevărat", "Adevărat", "Adevărat", "Adevărat"] }, // cells 5,6 wrong
}, { officeBonus: OFFICE, maxScore: MAXSCORE });
const gridItem = r.items.find((i) => i.label === "2")!;
check("TF_GRID 4/6 → awarded 4", gridItem.awarded === 4 && gridItem.graded === "auto", gridItem);

// 4) OPEN self-score clamps above max
r = scoreExamPaper([items[2]], { "S-II::3": { kind: "self", awardedPoints: 99 } }, { officeBonus: OFFICE, maxScore: MAXSCORE });
check("OPEN self clamps to max 5", r.items[0].awarded === 5 && r.items[0].graded === "self", r.items[0]);

// 5) partial subset (only MCQ answered) → isEstimate true, extrapolated
r = scoreExamPaper(items, { "S-I::1": { kind: "objective", value: "c" } }, { officeBonus: OFFICE, maxScore: MAXSCORE });
check("partial → isEstimate true", r.isEstimate === true, r);
check("partial → 2 items ungraded", r.items.filter((i) => i.graded === "ungraded").length === 2, r.items);
// only MCQ attempted (5/5 right): extrapolate ratio 1.0 → (1.0*16 + 4)/2 = 10.00
check("partial extrapolation (aced the 1 attempted) → 10.00", r.note10 === 10, r.note10);

// 6) nothing attempted → office only, estimate (4/2 = 2.00 on this mini)
r = scoreExamPaper(items, {}, { officeBonus: OFFICE, maxScore: MAXSCORE });
check("nothing attempted → oficiu only (2.00), estimate", r.note10 === 2 && r.isEstimate, r);

// 7) MCQ with figure still auto-grades once answered
const figMcq: ExamItemForScoring[] = [{ label: "II.1", section: "S-II", type: "MCQ", points: 5, correctAnswer: "b", hasFigure: true }];
r = scoreExamPaper(figMcq, { "S-II::II.1": { kind: "objective", value: "b" } }, { officeBonus: 0, maxScore: 5 });
check("figure MCQ auto-grades (gradability≠renderability)", r.items[0].graded === "auto" && r.items[0].awarded === 5, r.items[0]);

// 8) classifyPaperPoints buckets
const cls = classifyPaperPoints([
  { label: "1", section: "S-I", type: "MCQ", points: 5 }, // auto
  { label: "2", section: "S-II", type: "MCQ", points: 5, hasFigure: true }, // figure
  { label: "3", section: "S-III", type: "OPEN", points: 5 }, // manual
]);
check("classify buckets auto/fig/manual = 5/5/5", cls.autoPoints === 5 && cls.figurePoints === 5 && cls.manualPoints === 5 && cls.total === 15, cls);

// 9) duplicate labels across sections must NOT collide (Math numbers 1..6 in each subiect)
const dup: ExamItemForScoring[] = [
  { label: "1", section: "Subiectul I", type: "MCQ", points: 5, correctAnswer: "c" },
  { label: "1", section: "Subiectul al II-lea", type: "MCQ", points: 5, correctAnswer: "a" },
];
r = scoreExamPaper(dup, {
  "Subiectul I::1": { kind: "objective", value: "c" }, // correct
  "Subiectul al II-lea::1": { kind: "objective", value: "b" }, // wrong
}, { officeBonus: 0, maxScore: 10 });
const sI = r.items.find((i) => i.section === "Subiectul I")!;
const sII = r.items.find((i) => i.section === "Subiectul al II-lea")!;
check("duplicate labels graded independently (no collision)", sI.awarded === 5 && sII.awarded === 0, r.items);

console.log(`\n${fail === 0 ? "✅" : "❌"} exam-bank score smoke: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
