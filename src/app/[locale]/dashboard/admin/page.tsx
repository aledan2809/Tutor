import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [questionStats, domainCount, draftCount] = await Promise.all([
    prisma.question.count(),
    prisma.domain.count(),
    prisma.question.count({ where: { status: "DRAFT" } }),
  ]);

  const approvedCount = await prisma.question.count({ where: { status: "APPROVED" } });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Questions" value={questionStats} />
      <StatCard label="Drafts (Review)" value={draftCount} accent="yellow" />
      <StatCard label="Approved" value={approvedCount} accent="green" />
      <StatCard label="Domains" value={domainCount} accent="blue" />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "gray",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    gray: "border-gray-700",
    yellow: "border-yellow-600",
    green: "border-green-600",
    blue: "border-blue-600",
  };

  return (
    <div className={`rounded-xl border ${colors[accent]} bg-gray-900 p-6`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
