import { prisma } from "@/lib/prisma";
import { ReviewQueue } from "@/components/admin/review-queue";

export default async function ReviewPage() {
  const draftQuestions = await prisma.question.findMany({
    where: { status: "DRAFT" },
    select: {
      id: true,
      content: true,
      subject: true,
      topic: true,
      difficulty: true,
      type: true,
      options: true,
      correctAnswer: true,
      explanation: true,
      sourceReference: true,
      source: true,
      bookOrder: true,
      meshConfidence: true,
      meshFlags: true,
      createdAt: true,
      domain: { select: { name: true, slug: true } },
      tags: true,
      createdBy: { select: { name: true } },
    },
    orderBy: [
      // Flagged questions first (lower confidence = higher priority)
      { meshConfidence: { sort: "asc", nulls: "last" } },
      { bookOrder: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">
        Review Queue ({draftQuestions.length} drafts)
      </h2>
      <ReviewQueue questions={JSON.parse(JSON.stringify(draftQuestions))} />
    </div>
  );
}
