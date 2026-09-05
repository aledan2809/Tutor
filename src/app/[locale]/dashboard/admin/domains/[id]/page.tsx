import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { DomainForm } from "@/components/admin/domain-form";
import { ExamConfigForm } from "@/components/admin/exam-config-form";

export default async function EditDomainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, domain] = await Promise.all([
    auth(),
    prisma.domain.findUnique({ where: { id }, include: { examConfig: true } }),
  ]);

  if (!domain) notFound();

  // The access code is a key to private content; /dashboard/admin admits any
  // domain ADMIN, so only the superadmin gets to see (and rotate) it.
  const visible = session?.user?.isSuperAdmin ? domain : { ...domain, joinCode: null };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-6 text-xl font-semibold text-white">Edit Domain</h2>
        <DomainForm domain={JSON.parse(JSON.stringify(visible))} />
      </div>
      <div>
        <h2 className="mb-6 text-xl font-semibold text-white">Exam Configuration</h2>
        <ExamConfigForm
          domainId={id}
          config={domain.examConfig ? JSON.parse(JSON.stringify(domain.examConfig)) : null}
        />
      </div>
    </div>
  );
}
