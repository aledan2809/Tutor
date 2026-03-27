import { prisma } from "@/lib/prisma";
import { DomainList } from "@/components/admin/domain-list";

export default async function DomainsPage() {
  const domains = await prisma.domain.findMany({
    include: {
      _count: { select: { questions: true, enrollments: true } },
      examConfig: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <DomainList domains={JSON.parse(JSON.stringify(domains))} />
    </div>
  );
}
