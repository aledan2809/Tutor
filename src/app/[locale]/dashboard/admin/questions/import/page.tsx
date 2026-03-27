import { prisma } from "@/lib/prisma";
import { BulkImportForm } from "@/components/admin/bulk-import-form";

export default async function ImportPage() {
  const domains = await prisma.domain.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Bulk Import Questions</h2>
      <BulkImportForm domains={domains} />
    </div>
  );
}
