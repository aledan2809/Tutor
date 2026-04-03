import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export default async function AdminOverviewPage() {
  const [
    totalQuestions,
    draftCount,
    approvedCount,
    publishedCount,
    domainCount,
    aiCount,
    manualCount,
    recentQuestions,
    domainStats,
  ] = await Promise.all([
    prisma.question.count(),
    prisma.question.count({ where: { status: "DRAFT" } }),
    prisma.question.count({ where: { status: "APPROVED" } }),
    prisma.question.count({ where: { status: "PUBLISHED" } }),
    prisma.domain.count(),
    prisma.question.count({ where: { source: "AI_GENERATED" } }),
    prisma.question.count({ where: { source: "MANUAL" } }),
    prisma.question.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        status: true,
        source: true,
        type: true,
        createdAt: true,
        domain: { select: { name: true } },
      },
    }),
    prisma.domain.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        _count: { select: { questions: true, enrollments: true } },
        examConfig: { select: { questionCount: true, timeLimit: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Questions" value={totalQuestions} />
        <StatCard label="Drafts (Review)" value={draftCount} accent="yellow" href="/dashboard/admin/questions/review" />
        <StatCard label="Approved" value={approvedCount} accent="green" />
        <StatCard label="Published" value={publishedCount} accent="blue" />
      </div>

      {/* Content Pipeline + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content Pipeline */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Content Pipeline</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <PipelineCard
              label="Manual Content"
              count={manualCount}
              total={totalQuestions}
              color="blue"
            />
            <PipelineCard
              label="AI Generated"
              count={aiCount}
              total={totalQuestions}
              color="purple"
            />
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Domains</p>
              <p className="mt-1 text-2xl font-bold text-white">{domainCount}</p>
              <div className="mt-2 space-y-1">
                {domainStats.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{d.name}</span>
                    <span className="text-gray-500">{d._count.questions}q</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction href="/dashboard/admin/questions/new" label="Create Question" />
            <QuickAction href="/dashboard/admin/questions/generate" label="AI Generate" accent="purple" />
            <QuickAction href="/dashboard/admin/questions/import" label="Bulk Import" />
            <QuickAction href="/dashboard/admin/domains/new" label="New Domain" accent="green" />
            {draftCount > 0 && (
              <QuickAction
                href="/dashboard/admin/questions/review"
                label={`Review ${draftCount} Draft${draftCount > 1 ? "s" : ""}`}
                accent="yellow"
              />
            )}
          </div>
        </div>
      </div>

      {/* Domain Overview */}
      {domainStats.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Domain Overview</h3>
            <Link
              href="/dashboard/admin/domains"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Manage Domains
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-800 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="pb-2 pr-4">Domain</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Questions</th>
                  <th className="pb-2 pr-4">Enrollments</th>
                  <th className="pb-2 pr-4">Exam Config</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {domainStats.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 pr-4 font-medium text-white">{d.name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${d.isActive ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-300">{d._count.questions}</td>
                    <td className="py-2.5 pr-4 text-gray-300">{d._count.enrollments}</td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">
                      {d.examConfig
                        ? `${d.examConfig.questionCount}q${d.examConfig.timeLimit ? ` / ${d.examConfig.timeLimit}min` : ""}`
                        : "Not configured"}
                    </td>
                    <td className="py-2.5">
                      <Link
                        href={`/dashboard/admin/domains/${d.id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Questions */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Questions</h3>
          <Link
            href="/dashboard/admin/questions"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            View All
          </Link>
        </div>
        <div className="space-y-2">
          {recentQuestions.map((q) => (
            <Link
              key={q.id}
              href={`/dashboard/admin/questions/${q.id}/edit`}
              className="flex items-center justify-between rounded-lg border border-gray-800/50 bg-gray-800/30 px-4 py-2.5 hover:bg-gray-800/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-white">
                  {q.content.substring(0, 100)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {q.domain.name} &middot; {q.type === "MULTIPLE_CHOICE" ? "MC" : "Open"}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  q.source === "AI_GENERATED" ? "bg-purple-900/50 text-purple-400" : "bg-gray-700 text-gray-400"
                }`}>
                  {q.source === "AI_GENERATED" ? "AI" : "Manual"}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[q.status]}`}>
                  {q.status}
                </span>
              </div>
            </Link>
          ))}
          {recentQuestions.length === 0 && (
            <p className="py-8 text-center text-gray-500">No questions yet. Start by creating or generating some.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-900/50 text-yellow-400",
  APPROVED: "bg-green-900/50 text-green-400",
  PUBLISHED: "bg-blue-900/50 text-blue-400",
};

function StatCard({
  label,
  value,
  accent = "gray",
  href,
}: {
  label: string;
  value: number;
  accent?: string;
  href?: string;
}) {
  const colors: Record<string, string> = {
    gray: "border-gray-700",
    yellow: "border-yellow-600",
    green: "border-green-600",
    blue: "border-blue-600",
  };

  const content = (
    <div className={`rounded-xl border ${colors[accent]} bg-gray-900 p-6 ${href ? "hover:bg-gray-800/80 transition-colors" : ""}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function PipelineCard({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const barColor = color === "purple" ? "bg-purple-500" : "bg-blue-500";

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{count}</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-700">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-500">{pct}% of total</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  accent = "blue",
}: {
  href: string;
  label: string;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 hover:bg-blue-900/20",
    purple: "text-purple-400 hover:bg-purple-900/20",
    green: "text-green-400 hover:bg-green-900/20",
    yellow: "text-yellow-400 hover:bg-yellow-900/20",
  };

  return (
    <Link
      href={href}
      className={`block rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium transition-colors ${colors[accent]}`}
    >
      {label}
    </Link>
  );
}
