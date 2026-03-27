import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/admin/question-form";

export default async function NewQuestionPage() {
  const domains = await prisma.domain.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Create Question</h2>
      <QuestionForm domains={domains} />
    </div>
  );
}
