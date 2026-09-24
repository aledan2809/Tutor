// Două rulări ale verificării automate pornite ÎN ACELAȘI TIMP, pe baza QA, cu modele reale.
// Fiecare reclamație trebuie judecată o singură dată: un singur mesaj către elev, o singură a doua opinie.
//   cd /Users/danciulescu/Projects/Tutor && MESH_CLAUDE_JUDGE=0 DATABASE_URL=postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa \
//     npx tsx --env-file=<fișier cu cheile AI> Reports/feedback-a-doua-opinie-2026-09-24/verificare-doua-rulari.ts
import { prisma } from "@/lib/prisma";
import { runFeedbackReview } from "@/lib/feedback-review";

const TAG = "qa-fb2";
const results: boolean[] = [];
const check = (n: string, ok: boolean, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };

async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

async function main() {
  await wipe();
  // Doar reclamațiile noastre să fie „new" — celelalte din baza QA le lăsăm neatinse, dar le numărăm.
  const foreign = await prisma.questionFeedback.count({ where: { status: "new", rating: "down" } });
  const s = Date.now();
  // Materie de curriculum (publică): acolo reviewerul NU corectează singur — respinge sau semnalează, deci
  // verdictul așteaptă un om și primește a doua opinie.
  const domain = await prisma.domain.create({ data: { name: `Fizică QA ${s}`, slug: `${TAG}-${s}`, isActive: true, visibility: "PUBLIC" } });
  const students = await Promise.all([1, 2, 3].map((i) => prisma.user.create({ data: { email: `${TAG}-${i}-${s}@demo.tutor.app`, name: `Elev ${i}` } })));
  // Întrebare marcată GREȘIT (9 kJ), reclamată corect de 3 elevi.
  const q = await prisma.question.create({ data: {
    domainId: domain.id, subject: "fizica", topic: "energie", status: "PUBLISHED",
    content: "Un corp cu masa de 2 kg se mișcă cu viteza de 3 m/s. Care este energia sa cinetică?",
    options: ["9 J", "9 kJ", "6 J", "18 J"], correctAnswer: "9 kJ",
  } });
  for (const u of students) {
    await prisma.questionFeedback.create({ data: { questionId: q.id, userId: u.id, rating: "down", comment: "Răspunsul corect e 9 J, nu 9 kJ: Ec = m·v²/2 = 2·9/2 = 9 J." } });
  }

  const [a, b] = await Promise.all([runFeedbackReview(), runFeedbackReview()]);
  console.log("rulare A:", JSON.stringify(a), "\nrulare B:", JSON.stringify(b));

  const fbs = await prisma.questionFeedback.findMany({ where: { questionId: q.id } });
  const notes = await prisma.notification.findMany({ where: { userId: { in: students.map((u) => u.id) }, type: "feedback_resolved" } });
  const perStudent = students.map((u) => notes.filter((n) => n.userId === u.id).length);
  // Un furnizor AI indisponibil pune reclamația ÎNAPOI în coadă („new”) — corect; blocată în „reviewing” nu.
  check("nicio reclamație blocată în „reviewing”", fbs.every((f) => f.status !== "reviewing"), fbs.map((f) => f.status).join(","));
  check("toate judecate (furnizorii au răspuns)", fbs.every((f) => f.status !== "new"), fbs.map((f) => f.status).join(","));
  check("fiecare elev primește cel mult UN mesaj (nicio judecată dublă)", perStudent.every((n) => n <= 1), perStudent.join(","));
  check("nicio reclamație judecată de două ori", a.reviewed + b.reviewed <= 3 + foreign, `A=${a.reviewed} B=${b.reviewed}`);
  const dismissedOrFlagged = fbs.filter((f) => f.reviewAction === "dismissed" || f.reviewAction === "flagged");
  check("orice verdict care așteaptă un om are a doua opinie", dismissedOrFlagged.every((f) => !!f.secondOpinion), dismissedOrFlagged.map((f) => `${f.reviewAction}/${f.secondOpinion}`).join(","));
  check("nicio respingere nu rămâne dacă a doua opinie a găsit greșeala", fbs.every((f) => !(f.reviewAction === "dismissed" && f.secondOpinion === "disagrees")));
  console.log("verdicte:", fbs.map((f) => `${f.reviewAction}/${f.secondOpinion ?? "-"}`).join(" · "), `(reclamații străine „new” în QA înainte: ${foreign})`);
}

main().catch((e) => { console.error(e); results.push(false); }).finally(async () => {
  await wipe(); await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
});
