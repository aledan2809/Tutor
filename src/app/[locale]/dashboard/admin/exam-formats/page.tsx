import { prisma } from "@/lib/prisma";
import { ExamFormatManager } from "@/components/admin/exam-format-manager";

export default async function ExamFormatsPage() {
  const domains = await prisma.domain.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      examConfig: {
        select: {
          questionCount: true,
          timeLimit: true,
          passingScore: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const formats = await prisma.examSimulation.findMany({
    where: { domainId: { in: domains.map((d) => d.id) } },
    include: {
      domain: { select: { id: true, name: true, slug: true } },
      _count: { select: { examSessions: true } },
    },
    orderBy: [{ domain: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Exam Formats</h2>

      {/* Domain exam defaults overview */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
          Domain Defaults
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {domains.map((d) => (
            <div
              key={d.id}
              className="rounded-lg border border-gray-700 bg-gray-900 p-4"
            >
              <p className="font-semibold text-white">{d.name}</p>
              {d.examConfig ? (
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span>{d.examConfig.questionCount} questions</span>
                  <span>{d.examConfig.timeLimit} min</span>
                  <span>Pass: {d.examConfig.passingScore}%</span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">No exam config set</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Per-domain exam formats */}
      {domains.map((domain) => {
        const domainFormats = formats.filter((f) => f.domainId === domain.id);
        return (
          <div key={domain.id} className="mb-8">
            <h3 className="mb-3 text-lg font-semibold text-white">
              {domain.name}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({domainFormats.length} formats)
              </span>
            </h3>
            <ExamFormatManager
              domainId={domain.id}
              initialFormats={domainFormats}
            />
          </div>
        );
      })}
    </div>
  );
}
