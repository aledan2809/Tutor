import { prisma } from "@/lib/prisma";
import { AIGenerateForm } from "@/components/admin/ai-generate-form";

export default async function GeneratePage() {
  const domains = await prisma.domain.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">AI Question Generation</h2>
      <AIGenerateForm domains={domains} />
    </div>
  );
}
