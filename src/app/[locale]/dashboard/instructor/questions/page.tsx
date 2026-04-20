import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionList } from "@/components/admin/question-list";

export default async function InstructorQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = params.status;
  const domainId = params.domainId;
  const search = params.search;
  const source = params.source;
  const limit = 20;

  const allowedDomainIds = session.user.isSuperAdmin
    ? null
    : (session.user.enrollments ?? [])
        .filter((e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN"))
        .map((e) => e.domainId);

  if (allowedDomainIds && allowedDomainIds.length === 0) {
    redirect("/dashboard");
  }

  const where: Record<string, unknown> = {};
  if (allowedDomainIds) where.domainId = { in: allowedDomainIds };
  if (status) where.status = status;
  if (domainId) {
    where.domainId = allowedDomainIds && !allowedDomainIds.includes(domainId)
      ? { in: [] }
      : domainId;
  }
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
      orderBy: [{ bookOrder: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.question.count({ where }),
    prisma.domain.findMany({
      where: allowedDomainIds ? { id: { in: allowedDomainIds } } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <QuestionList
      questions={JSON.parse(JSON.stringify(questions))}
      domains={domains}
      total={total}
      page={page}
      limit={limit}
      filters={{ status, domainId, search, source }}
      readOnly
    />
  );
}
