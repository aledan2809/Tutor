import { prisma } from "@/lib/prisma";
import { EscalationTemplateManager } from "@/components/admin/escalation-template-manager";

export default async function TemplatesPage() {
  const templates = await prisma.escalationTemplate.findMany({
    orderBy: [{ channel: "asc" }, { triggerType: "asc" }],
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Escalation Templates</h2>
      <p className="mb-4 text-sm text-gray-400">
        Manage notification templates for student engagement escalation. Templates use variables like{" "}
        <code className="text-blue-400">{"{{userName}}"}</code> that are replaced at send time.
      </p>
      <EscalationTemplateManager initialTemplates={templates} />
    </div>
  );
}
