import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/admin/question-form";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Edit Question</h2>
      <QuestionForm
        domains={domains}
        question={JSON.parse(JSON.stringify(question))}
      />
    </div>
  );
}
