import { prisma } from "@/lib/prisma";
import { ExamFormatManager } from "@/components/admin/exam-format-manager";

export default async function AviationExamFormatsPage() {
  const domain = await prisma.domain.findUnique({ where: { slug: "aviation" } });
  if (!domain) {
    return <p className="text-gray-400">Aviation domain not found. Run seed first.</p>;
  }

  const formats = await prisma.examSimulation.findMany({
    where: { domainId: domain.id },
    include: { _count: { select: { examSessions: true } } },
    orderBy: { name: "asc" },
  });

  const questionCounts = await prisma.question.groupBy({
    by: ["subject"],
    where: { domainId: domain.id, status: "PUBLISHED" },
    _count: true,
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">WizzAir Exam Formats</h2>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {questionCounts.map((q) => (
          <div key={q.subject} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">{q.subject}</p>
            <p className="text-2xl font-bold text-white">{q._count}</p>
            <p className="text-xs text-gray-500">published questions</p>
          </div>
        ))}
      </div>
      <ExamFormatManager domainId={domain.id} initialFormats={formats} />
    </div>
  );
}
