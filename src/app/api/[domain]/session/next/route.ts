import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recommendSessionType, SESSION_TYPES } from "@/lib/session-engine";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const recommendation = await recommendSessionType(
    session.user.id,
    domain.id
  );

  // Get progress summary for this domain
  const progressRecords = await prisma.progress.findMany({
    where: { userId: session.user.id, domainId: domain.id },
  });

  const weakAreas = await prisma.weakArea.findMany({
    where: { userId: session.user.id, domainId: domain.id },
  });

  // Count available questions
  const questionCount = await prisma.question.count({
    where: { domainId: domain.id, status: "PUBLISHED" },
  });

  return NextResponse.json({
    recommended: {
      type: recommendation.type,
      reason: recommendation.reason,
      ...SESSION_TYPES[recommendation.type],
    },
    availableTypes: Object.entries(SESSION_TYPES).map(([key, val]) => ({
      type: key,
      ...val,
    })),
    stats: {
      totalQuestions: questionCount,
      topicsStudied: progressRecords.length,
      weakAreas: weakAreas.length,
    },
  });
}

export const GET = withErrorHandler(_GET);
