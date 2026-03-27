import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(
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

  // Get progress records for this domain
  const progressRecords = await prisma.progress.findMany({
    where: { userId: session.user.id, domainId: domain.id },
    orderBy: { lastPracticed: "desc" },
  });

  // Get weak areas for this domain
  const weakAreas = await prisma.weakArea.findMany({
    where: { userId: session.user.id, domainId: domain.id },
    orderBy: { errorRate: "desc" },
  });

  // Get recent sessions for this domain
  const recentSessions = await prisma.session.findMany({
    where: { userId: session.user.id, domainId: domain.id },
    orderBy: { startedAt: "desc" },
    take: 10,
    include: {
      _count: { select: { attempts: true } },
    },
  });

  // Aggregate by subject
  const subjectMap = new Map<
    string,
    { totalAttempts: number; correctAttempts: number; topics: string[] }
  >();
  for (const p of progressRecords) {
    const existing = subjectMap.get(p.subject) || {
      totalAttempts: 0,
      correctAttempts: 0,
      topics: [],
    };
    existing.totalAttempts += p.totalAttempts;
    existing.correctAttempts += p.correctAttempts;
    existing.topics.push(p.topic);
    subjectMap.set(p.subject, existing);
  }

  const subjects = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    accuracy:
      data.totalAttempts > 0
        ? Math.round((data.correctAttempts / data.totalAttempts) * 100)
        : 0,
    totalAttempts: data.totalAttempts,
    topicCount: data.topics.length,
  }));

  // Overall stats
  const totalAttempts = progressRecords.reduce(
    (s, p) => s + p.totalAttempts,
    0
  );
  const totalCorrect = progressRecords.reduce(
    (s, p) => s + p.correctAttempts,
    0
  );

  return NextResponse.json({
    overall: {
      totalAttempts,
      accuracy:
        totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
      topicsStudied: progressRecords.length,
      sessionsCompleted: recentSessions.filter((s) => s.endedAt).length,
    },
    subjects,
    topics: progressRecords.map((p) => ({
      subject: p.subject,
      topic: p.topic,
      accuracy:
        p.totalAttempts > 0
          ? Math.round((p.correctAttempts / p.totalAttempts) * 100)
          : 0,
      totalAttempts: p.totalAttempts,
      masteryLevel: Math.round(p.masteryLevel),
      nextReview: p.nextReview,
      status:
        p.totalAttempts < 5
          ? "not_enough_data"
          : p.correctAttempts / p.totalAttempts < 0.6
            ? "weak"
            : "good",
    })),
    weakAreas: weakAreas.map((w) => ({
      subject: w.subject,
      topic: w.topic,
      errorRate: Math.round(w.errorRate * 100),
      suggestion: w.suggestion,
    })),
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      type: s.type,
      score: s.score !== null ? Math.round(s.score) : null,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      questionsAnswered: s._count.attempts,
    })),
  });
}
