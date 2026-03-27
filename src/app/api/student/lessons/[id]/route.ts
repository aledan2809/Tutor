import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().min(1, "Lesson ID is required"),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawParams = await params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid lesson ID", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = parsed.data;

  try {
    // Try Lesson model first (has proper markdown content)
    const lessonModel = await prisma.lesson.findUnique({
      where: { id },
      include: { domain: true },
    });

    if (lessonModel) {
      // Verify enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_domainId: {
            userId: session.user.id,
            domainId: lessonModel.domainId,
          },
        },
      });

      if (!enrollment?.isActive) {
        return NextResponse.json({ error: "Not enrolled in this domain" }, { status: 403 });
      }

      // Get lesson progress
      const lessonProgress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: session.user.id,
            lessonId: id,
          },
        },
      });

      // Get topic-level progress
      const topicProgress = await prisma.progress.findUnique({
        where: {
          userId_domainId_subject_topic: {
            userId: session.user.id,
            domainId: lessonModel.domainId,
            subject: lessonModel.subject,
            topic: lessonModel.topic,
          },
        },
      });

      // Get related questions count
      const questionsCount = await prisma.question.count({
        where: {
          domainId: lessonModel.domainId,
          subject: lessonModel.subject,
          topic: lessonModel.topic,
          status: "PUBLISHED",
        },
      });

      // Get adjacent lessons for navigation
      const [prevLesson, nextLesson] = await Promise.all([
        prisma.lesson.findFirst({
          where: {
            domainId: lessonModel.domainId,
            subject: lessonModel.subject,
            topic: lessonModel.topic,
            isPublished: true,
            order: { lt: lessonModel.order },
          },
          orderBy: { order: "desc" },
          select: { id: true, title: true },
        }),
        prisma.lesson.findFirst({
          where: {
            domainId: lessonModel.domainId,
            subject: lessonModel.subject,
            topic: lessonModel.topic,
            isPublished: true,
            order: { gt: lessonModel.order },
          },
          orderBy: { order: "asc" },
          select: { id: true, title: true },
        }),
      ]);

      return NextResponse.json({
        id: lessonModel.id,
        name: lessonModel.title,
        type: "lesson",
        subject: lessonModel.subject,
        topic: lessonModel.topic,
        content: lessonModel.content,
        summary: lessonModel.summary,
        description: lessonModel.summary,
        difficulty: lessonModel.difficulty,
        domain: {
          id: lessonModel.domain.id,
          name: lessonModel.domain.name,
          slug: lessonModel.domain.slug,
        },
        lessonProgress: lessonProgress
          ? {
              status: lessonProgress.status,
              progress: lessonProgress.progress,
              completedAt: lessonProgress.completedAt,
            }
          : null,
        progress: topicProgress
          ? {
              mastery: Math.round(topicProgress.masteryLevel),
              accuracy:
                topicProgress.totalAttempts > 0
                  ? Math.round(
                      (topicProgress.correctAttempts / topicProgress.totalAttempts) * 100
                    )
                  : 0,
              totalAttempts: topicProgress.totalAttempts,
              lastPracticed: topicProgress.lastPracticed,
              nextReview: topicProgress.nextReview,
            }
          : null,
        questionsAvailable: questionsCount,
        navigation: {
          prev: prevLesson,
          next: nextLesson,
        },
      });
    }

    // Fallback to ContentSource
    const contentSource = await prisma.contentSource.findUnique({
      where: { id },
      include: { domain: true },
    });

    if (!contentSource) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_domainId: {
          userId: session.user.id,
          domainId: contentSource.domainId,
        },
      },
    });

    if (!enrollment?.isActive) {
      return NextResponse.json({ error: "Not enrolled in this domain" }, { status: 403 });
    }

    const meta = contentSource.metadata as Record<string, unknown> | null;
    const lessonSubject = (meta?.subject as string) || "";
    const lessonTopic = (meta?.topic as string) || "";

    // Get user progress for this topic
    const progress = await prisma.progress.findUnique({
      where: {
        userId_domainId_subject_topic: {
          userId: session.user.id,
          domainId: contentSource.domainId,
          subject: lessonSubject,
          topic: lessonTopic,
        },
      },
    });

    // Get related questions count
    const questionsCount = await prisma.question.count({
      where: {
        domainId: contentSource.domainId,
        subject: lessonSubject,
        topic: lessonTopic,
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({
      id: contentSource.id,
      name: contentSource.name,
      type: contentSource.type,
      url: contentSource.url,
      subject: lessonSubject,
      topic: lessonTopic,
      content: (meta?.content as string) || null,
      description: (meta?.description as string) || null,
      difficulty: (meta?.difficulty as number) || null,
      estimatedMinutes: (meta?.estimatedMinutes as number) || null,
      domain: {
        id: contentSource.domain.id,
        name: contentSource.domain.name,
        slug: contentSource.domain.slug,
      },
      lessonProgress: null,
      progress: progress
        ? {
            mastery: Math.round(progress.masteryLevel),
            accuracy:
              progress.totalAttempts > 0
                ? Math.round(
                    (progress.correctAttempts / progress.totalAttempts) * 100
                  )
                : 0,
            totalAttempts: progress.totalAttempts,
            lastPracticed: progress.lastPracticed,
            nextReview: progress.nextReview,
          }
        : null,
      questionsAvailable: questionsCount,
      navigation: { prev: null, next: null },
    });
  } catch (error) {
    console.error("Lesson detail API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawParams = await params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid lesson ID", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const bodySchema = z.object({
    progress: z.number().min(0).max(100),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bodyParsed = bodySchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: bodyParsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = parsed.data;
  const { progress, status } = bodyParsed.data;

  try {
    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { domainId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_domainId: {
          userId: session.user.id,
          domainId: lesson.domainId,
        },
      },
    });

    if (!enrollment?.isActive) {
      return NextResponse.json({ error: "Not enrolled in this domain" }, { status: 403 });
    }

    const computedStatus = status || (progress >= 100 ? "COMPLETED" : progress > 0 ? "IN_PROGRESS" : "NOT_STARTED");

    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: id,
        },
      },
      create: {
        userId: session.user.id,
        lessonId: id,
        progress,
        status: computedStatus,
        completedAt: computedStatus === "COMPLETED" ? new Date() : null,
      },
      update: {
        progress,
        status: computedStatus,
        completedAt: computedStatus === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json({
      id: lessonProgress.id,
      status: lessonProgress.status,
      progress: lessonProgress.progress,
      completedAt: lessonProgress.completedAt,
    });
  } catch (error) {
    console.error("Lesson progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update lesson progress" },
      { status: 500 }
    );
  }
}
