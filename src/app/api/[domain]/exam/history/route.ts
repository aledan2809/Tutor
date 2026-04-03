import { NextRequest, NextResponse } from "next/server";
import { getSession, hasAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  if (!hasAnyRole(session, domainSlug, ["STUDENT", "ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.examSession.findMany({
      where: {
        userId: session.user.id,
        domainId: domain.id,
        status: { not: "IN_PROGRESS" },
      },
      include: {
        format: { select: { name: true, passingScore: true } },
        certificates: { select: { id: true, filePath: true } },
      },
      orderBy: { startedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.examSession.count({
      where: {
        userId: session.user.id,
        domainId: domain.id,
        status: { not: "IN_PROGRESS" },
      },
    }),
  ]);

  const history = sessions.map((s) => {
    const results = s.results as Record<string, unknown> | null;
    return {
      id: s.id,
      formatName: s.format.name,
      mode: s.mode,
      score: s.score,
      passed: s.passed,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      submittedAt: s.submittedAt?.toISOString() ?? null,
      timeTaken: results?.timeTaken ?? null,
      totalQuestions: results?.total ?? null,
      correct: results?.correct ?? null,
      passingScore: s.format.passingScore,
      certificateUrl: s.certificates[0]?.filePath ?? null,
    };
  });

  // Compute trends
  const allScores = sessions
    .filter((s) => s.score !== null)
    .map((s) => s.score!);
  const averageScore = allScores.length > 0
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
    : null;
  const passRate = sessions.length > 0
    ? Math.round((sessions.filter((s) => s.passed).length / sessions.length) * 10000) / 100
    : null;

  return NextResponse.json({
    history,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    trends: {
      totalAttempts: total,
      averageScore,
      passRate,
      bestScore: allScores.length > 0 ? Math.max(...allScores) : null,
    },
  });
}

export const GET = withErrorHandler(_GET);
