import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { sanitizeForTake } from "@/lib/exam-bank/sanitize";
import { ExamBankTake } from "@/components/exam-bank/exam-bank-take";

// Ecran elev — „dă examenul". Itemii sunt trimiși FĂRĂ chei (sanitizeForTake);
// corectarea se face la /api/exam-bank/[paperId]/score după trimitere.
export default async function ExamBankTakePage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({
    where: { id: paperId },
    include: {
      passages: { orderBy: { orderIndex: "asc" } },
      items: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!paper || !paper.isActive) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const takeItems = sanitizeForTake(paper.items as any);
  const passages = paper.passages.map((p) => ({
    ref: p.ref,
    title: p.title,
    author: p.author,
    sourceNote: p.sourceNote,
    body: p.body,
  }));

  return (
    <ExamBankTake
      paperId={paper.id}
      subjectName={paper.subjectName}
      examLabel={`${paper.examType.replace("_", " ")} ${paper.year}`}
      maxScore={paper.maxScore}
      officeBonus={paper.officeBonus}
      timeLimit={paper.timeLimit}
      items={takeItems}
      passages={passages}
    />
  );
}
