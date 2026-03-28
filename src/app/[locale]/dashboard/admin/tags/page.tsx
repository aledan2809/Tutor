import { prisma } from "@/lib/prisma";
import { TagManager } from "@/components/admin/tag-manager";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Tag Management</h2>
      <TagManager initialTags={JSON.parse(JSON.stringify(tags))} />
    </div>
  );
}
