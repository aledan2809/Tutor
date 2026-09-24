/**
 * A doua opinie pe reclamațiile care așteaptă deja un om (livrarea din 24.09.2026).
 *
 * Doar citește și arată, fără `--apply`. Cu `--apply` scrie DOAR câmpurile celei de-a doua opinii,
 * iar o respingere contrazisă devine „flagged" (tot în așteptare) — exact ce face acum verificarea
 * automată pentru reclamațiile noi. NU scrie nimic elevilor și NU atinge întrebările.
 *
 *   npx tsx scripts/backfill-second-opinion.ts            # proba
 *   npx tsx scripts/backfill-second-opinion.ts --apply    # scrie
 */
import { prisma } from "@/lib/prisma";
import { applySecondOpinion, describeSecondOpinion, secondOpinionFor, type ReviewAction } from "@/lib/feedback-review";

async function main() {
  const apply = process.argv.includes("--apply");
  const items = await prisma.questionFeedback.findMany({
    where: { status: "pending_review", secondOpinion: null },
    orderBy: { createdAt: "asc" },
  });
  console.log(`${items.length} în așteptare fără a doua opinie. ${apply ? "SCRIU." : "Probă — nu scriu nimic."}\n`);
  for (const fb of items) {
    const q = await prisma.question.findUnique({
      where: { id: fb.questionId },
      select: { content: true, options: true, correctAnswer: true, explanation: true, passage: true },
    });
    if (!q) { console.log(`- ${fb.id}: întrebarea nu mai există, sar peste`); continue; }
    const options = Array.isArray(q.options) ? (q.options as string[]) : [];
    const op = await secondOpinionFor({ ...q, options });
    const next = applySecondOpinion(fb.reviewAction as ReviewAction, fb.resolution ?? "", op);
    console.log(`- ${fb.createdAt.toISOString().slice(0, 10)} ${fb.reviewAction} → ${next.action} · ${op.verdict}`);
    console.log(`  elev: „${(fb.comment ?? "").slice(0, 100)}”`);
    console.log(`  întrebare: ${q.content.replace(/\s+/g, " ").slice(0, 110)} | marcat: ${q.correctAnswer.slice(0, 60)}`);
    console.log(`  ${describeSecondOpinion(op)}\n`);
    if (apply) {
      await prisma.questionFeedback.update({
        where: { id: fb.id },
        data: {
          secondOpinion: op.verdict,
          secondOpinionNote: describeSecondOpinion(op),
          secondOpinionAt: new Date(),
          ...(next.action !== fb.reviewAction ? { reviewAction: next.action, resolution: next.decision } : {}),
        },
      });
    }
  }
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
