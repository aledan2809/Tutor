import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const lessonsQuerySchema = z.object({
  domainId: z.string().min(1, "domainId is required"),
  subject: z.string().max(200).optional(),
  topic: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

async function _GET(req: NextRequest) {
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

  // Lessons come from the Lesson table — the one the admin form writes into.
  // Until 2026-09-05 this read ContentSource instead, a parallel table nothing in
  // the app writes to (one seeded row), so a lesson written from admin was
  // invisible here and reachable only by typing its URL. Drafts stay out.
  const where = {
    domainId,
    isPublished: true,
    ...(subject ? { subject } : {}),
    ...(topic ? { topic } : {}),
  };

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ subject: "asc" }, { topic: "asc" }, { order: "asc" }],
    }),
    prisma.lesson.count({ where }),
  ]);

  // Get user progress for topics in these lessons
  const userProgress = await prisma.progress.findMany({
    where: { userId: session.user.id },
  });

  const progressMap = new Map(
    userProgress.map((p) => [`${p.subject}:${p.topic}`, p])
  );

  // Get distinct subjects and topics for filters
  const allSources = await prisma.lesson.findMany({
    where: { domainId, isPublished: true },
    select: { subject: true, topic: true },
  });

  const subjects = new Set<string>();
  const topics = new Set<string>();
  for (const src of allSources) {
    if (src.subject) subjects.add(src.subject);
    if (src.topic) topics.add(src.topic);
  }

  return NextResponse.json({
    lessons: lessons.map((l) => {
      const progress = progressMap.get(`${l.subject}:${l.topic}`);

      return {
        id: l.id,
        name: l.title,
        type: "lesson",
        slug: l.slug,
        subject: l.subject,
        topic: l.topic,
        moduleId: l.moduleId,
        description: l.summary,
        difficulty: l.difficulty,
        estimatedMinutes: null,
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
}

export const GET = withErrorHandler(_GET);
