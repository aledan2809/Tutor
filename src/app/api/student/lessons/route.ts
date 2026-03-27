import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lessonsQuerySchema = z.object({
  domainId: z.string().uuid("Invalid domainId format"),
  subject: z.string().max(200).optional(),
  topic: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = lessonsQuerySchema.safeParse({
    domainId: searchParams.get("domainId") || undefined,
    subject: searchParams.get("subject") || undefined,
    topic: searchParams.get("topic") || undefined,
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { domainId, subject, topic, page, limit } = parsed.data;

  try {
  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_domainId: {
        userId: session.user.id,
        domainId,
      },
    },
  });

  if (!enrollment?.isActive) {
    return NextResponse.json({ error: "Not enrolled in this domain" }, { status: 403 });
  }

  // Get content sources as lessons
  const where = {
    domainId,
    isActive: true,
    ...(subject ? { metadata: { path: ["subject"], equals: subject } } : {}),
    ...(topic ? { metadata: { path: ["topic"], equals: topic } } : {}),
  };

  const [lessons, total] = await Promise.all([
    prisma.contentSource.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contentSource.count({ where }),
  ]);

  // Get user progress for topics in these lessons
  const userProgress = await prisma.progress.findMany({
    where: { userId: session.user.id },
  });

  const progressMap = new Map(
    userProgress.map((p) => [`${p.subject}:${p.topic}`, p])
  );

  // Get distinct subjects and topics for filters
  const allSources = await prisma.contentSource.findMany({
    where: { domainId, isActive: true },
    select: { metadata: true },
  });

  const subjects = new Set<string>();
  const topics = new Set<string>();
  for (const src of allSources) {
    const meta = src.metadata as Record<string, unknown> | null;
    if (meta?.subject) subjects.add(meta.subject as string);
    if (meta?.topic) topics.add(meta.topic as string);
  }

  return NextResponse.json({
    lessons: lessons.map((l) => {
      const meta = l.metadata as Record<string, unknown> | null;
      const lessonSubject = (meta?.subject as string) || "";
      const lessonTopic = (meta?.topic as string) || "";
      const progress = progressMap.get(`${lessonSubject}:${lessonTopic}`);

      return {
        id: l.id,
        name: l.name,
        type: l.type,
        subject: lessonSubject,
        topic: lessonTopic,
        description: (meta?.description as string) || null,
        difficulty: (meta?.difficulty as number) || null,
        estimatedMinutes: (meta?.estimatedMinutes as number) || null,
        progress: progress
          ? {
              mastery: Math.round(progress.masteryLevel),
              accuracy: progress.totalAttempts > 0
                ? Math.round((progress.correctAttempts / progress.totalAttempts) * 100)
                : 0,
              lastPracticed: progress.lastPracticed,
            }
          : null,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    filters: {
      subjects: Array.from(subjects).sort(),
      topics: Array.from(topics).sort(),
    },
  });
  } catch (error) {
    console.error("Lessons API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
