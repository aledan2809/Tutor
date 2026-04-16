import { prisma } from "@/lib/prisma";
import { ReviewQueue } from "@/components/admin/review-queue";

export default async function ReviewPage() {
  const draftQuestions = await prisma.question.findMany({
    where: { status: "DRAFT" },
    include: {
      domain: { select: { name: true, slug: true } },
      tags: true,
      createdBy: { select: { name: true } },
    },
    orderBy: [{ bookOrder: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
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
