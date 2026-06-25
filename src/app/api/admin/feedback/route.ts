import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireAdminOrInstructor } from "@/lib/admin-auth";

/** GET: list 👎 feedbacks for the admin (scoped to their domains; superadmin = all). */
async function _GET() {
  const { error, allowedDomainIds } = await requireAdminOrInstructor();
  if (error) return error;

  const feedbacks = await prisma.questionFeedback.findMany({
    where: { rating: "down" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  if (feedbacks.length === 0) return NextResponse.json({ feedbacks: [] });

  const qIds = [...new Set(feedbacks.map((f) => f.questionId))];
  const uIds = [...new Set(feedbacks.map((f) => f.userId))];
  const questions = await prisma.question.findMany({
    where: { id: { in: qIds } },
    select: { id: true, content: true, domainId: true, status: true },
  });
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const dIds = [...new Set(questions.map((q) => q.domainId))];
  const domains = await prisma.domain.findMany({
    where: { id: { in: dIds } },
    select: { id: true, name: true, slug: true },
  });
  const dMap = new Map(domains.map((d) => [d.id, d]));
  const users = await prisma.user.findMany({
    where: { id: { in: uIds } },
    select: { id: true, name: true, email: true },
  });
  const uMap = new Map(users.map((u) => [u.id, u]));

  const rows = feedbacks
    .map((f) => {
      const q = qMap.get(f.questionId);
      const domain = q ? dMap.get(q.domainId) : null;
      const student = uMap.get(f.userId);
      return {
        id: f.id,
        status: f.status,
        reviewAction: f.reviewAction,
        overridden: !!f.overriddenById,
        comment: f.comment,
        createdAt: f.createdAt,
        domainId: q?.domainId ?? null,
        domainName: domain?.name ?? null,
        questionStatus: q?.status ?? null,
        questionPreview: (q?.content ?? "(întrebare ștearsă)").slice(0, 120),
        studentName: student?.name ?? student?.email ?? "—",
      };
    })
    .filter((r) => allowedDomainIds === null || (r.domainId !== null && allowedDomainIds.includes(r.domainId)));

  return NextResponse.json({ feedbacks: rows });
}

export const GET = withErrorHandler(_GET);
