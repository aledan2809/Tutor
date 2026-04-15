import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/admin/question-form";
import { QuestionNavigation } from "@/components/admin/question-navigation";

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; domain?: string }>;
}) {
  const { id } = await params;
  const filters = await searchParams;

  const [question, domains] = await Promise.all([
    prisma.question.findUnique({
      where: { id },
      include: { tags: true },
    }),
    prisma.domain.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!question) notFound();

  // Get prev/next question IDs (same domain + status filter)
  const where: Record<string, unknown> = { domainId: question.domainId };
  if (filters.status) where.status = filters.status;

  const allIds = await prisma.question.findMany({
    where,
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const currentIndex = allIds.findIndex((q) => q.id === id);
  const prevId = currentIndex > 0 ? allIds[currentIndex - 1].id : null;
  const nextId = currentIndex < allIds.length - 1 ? allIds[currentIndex + 1].id : null;

  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][]
  ).toString();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Edit Question</h2>
        <QuestionNavigation
          prevId={prevId}
          nextId={nextId}
          currentIndex={currentIndex + 1}
          total={allIds.length}
          queryString={queryString}
        />
      </div>
      <QuestionForm
        domains={domains}
        question={JSON.parse(JSON.stringify(question))}
      />
    </div>
  );
}
