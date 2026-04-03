import { prisma } from "@/lib/prisma";
import { QuestionList } from "@/components/admin/question-list";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = params.status;
  const domainId = params.domainId;
  const search = params.search;
  const source = params.source;
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (domainId) where.domainId = domainId;
  if (source) where.source = source;
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      { topic: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  const [questions, total, domains] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        domain: { select: { name: true, slug: true } },
        tags: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.question.count({ where }),
    prisma.domain.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <QuestionList
      questions={JSON.parse(JSON.stringify(questions))}
      domains={domains}
      total={total}
      page={page}
      limit={limit}
      filters={{ status, domainId, search, source }}
    />
  );
}
