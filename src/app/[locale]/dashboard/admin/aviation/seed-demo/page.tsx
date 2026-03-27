import { prisma } from "@/lib/prisma";
import { SeedDemoButton } from "@/components/admin/seed-demo-button";

export default async function SeedDemoPage() {
  const domain = await prisma.domain.findUnique({ where: { slug: "aviation" } });

  const [questionCount, templateCount, examFormatCount, studentCount] = await Promise.all([
    prisma.question.count({ where: { domainId: domain?.id ?? "" } }),
    prisma.escalationTemplate.count(),
    prisma.examSimulation.count({ where: { domainId: domain?.id ?? "" } }),
    prisma.enrollment.count({
      where: { domainId: domain?.id ?? "", roles: { has: "STUDENT" } },
    }),
  ]);

  const questionsBySubject = domain
    ? await prisma.question.groupBy({
        by: ["subject"],
        where: { domainId: domain.id },
        _count: true,
      })
    : [];

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Aviation Demo Data Seeder</h2>

      <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950 p-4">
        <p className="text-sm text-yellow-300">
          This will populate the aviation domain with WizzAir Academy content: 250+ questions across all subjects,
          exam formats, escalation templates, and demo student accounts. SuperAdmin access required.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Questions" value={questionCount} />
        <StatCard label="Exam Formats" value={examFormatCount} />
        <StatCard label="Escalation Templates" value={templateCount} />
        <StatCard label="Enrolled Students" value={studentCount} />
      </div>

      {questionsBySubject.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-400">Questions by Subject</h3>
          <div className="grid gap-2 md:grid-cols-4">
            {questionsBySubject.map((g) => (
              <div key={g.subject} className="rounded border border-gray-700 bg-gray-900 px-3 py-2">
                <p className="text-xs text-gray-400">{g.subject}</p>
                <p className="text-lg font-bold text-white">{g._count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <SeedDemoButton />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
