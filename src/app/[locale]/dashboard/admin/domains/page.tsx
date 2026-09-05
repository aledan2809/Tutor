import { prisma } from "@/lib/prisma";
import { DomainList } from "@/components/admin/domain-list";

export default async function DomainsPage() {
  // Explicit select, not the whole row: joinCode is a key to private content and
  // /dashboard/admin admits any domain ADMIN, not only the superadmin.
  const domains = await prisma.domain.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      visibility: true,
      _count: { select: { questions: true, enrollments: true } },
      examConfig: { select: { questionCount: true, timeLimit: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <DomainList domains={JSON.parse(JSON.stringify(domains))} />
    </div>
  );
}
