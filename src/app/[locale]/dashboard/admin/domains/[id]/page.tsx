import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DomainForm } from "@/components/admin/domain-form";
import { ExamConfigForm } from "@/components/admin/exam-config-form";

export default async function EditDomainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const domain = await prisma.domain.findUnique({
    where: { id },
    include: { examConfig: true },
  });

  if (!domain) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-6 text-xl font-semibold text-white">Edit Domain</h2>
        <DomainForm domain={JSON.parse(JSON.stringify(domain))} />
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
