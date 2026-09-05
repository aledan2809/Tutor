import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";
import { moduleProgress, courseProgress, nextModuleIndex } from "@/lib/course-progress";

/**
 * One course, its modules in order, and how far this learner has got.
 *
 * Progress is computed, not stored: reading it from LessonProgress and Attempt at
 * request time cannot drift out of step with the lessons and questions themselves,
 * which is what a stored counter would eventually do.
 */
async function _GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      isPublished: true,
      domain: { select: { slug: true, name: true } },
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          title: true,
          summary: true,
          questionTopic: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, slug: true, summary: true, order: true, isPublished: true },
          },
        },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The subject gate decides visibility; the course inherits it.
  const gate = await resolveDomainOrForbid(course.domain.slug, session.user);
  if (!gate.ok) return gate.response;

  const isAdmin =
    session.user.isSuperAdmin ||
    (session.user.isOrgAdmin === true && Boolean(session.user.organizationId));
  if (!course.isPublished && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const topics = course.modules.map((m) => m.questionTopic).filter((t): t is string => Boolean(t));
  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  const [questionRows, readRows, correctRows] = await Promise.all([
    topics.length
      ? prisma.question.groupBy({
          by: ["topic"],
          where: { domainId: gate.domain.id, status: "PUBLISHED", topic: { in: topics } },
          _count: { _all: true },
        })
      : Promise.resolve([] as { topic: string; _count: { _all: number } }[]),
    lessonIds.length
      ? prisma.lessonProgress.findMany({
          where: { userId: session.user.id, lessonId: { in: lessonIds }, status: "completed" },
          select: { lessonId: true },
        })
      : Promise.resolve([] as { lessonId: string }[]),
    topics.length
      ? prisma.attempt.findMany({
          where: {
            userId: session.user.id,
            isCorrect: true,
            question: { domainId: gate.domain.id, topic: { in: topics } },
          },
          select: { questionId: true, question: { select: { topic: true } } },
          distinct: ["questionId"],
        })
      : Promise.resolve([] as { questionId: string; question: { topic: string } }[]),
  ]);

  const questionsByTopic = new Map(questionRows.map((r) => [r.topic, r._count._all]));
  const readSet = new Set(readRows.map((r) => r.lessonId));
  const correctByTopic = new Map<string, number>();
  for (const a of correctRows) {
    correctByTopic.set(a.question.topic, (correctByTopic.get(a.question.topic) ?? 0) + 1);
  }

  const modules = course.modules.map((m) => {
    const visibleLessons = m.lessons.filter((l) => l.isPublished || isAdmin);
    const facts = {
      lessonCount: visibleLessons.length,
      lessonsRead: visibleLessons.filter((l) => readSet.has(l.id)).length,
      questionCount: m.questionTopic ? questionsByTopic.get(m.questionTopic) ?? 0 : 0,
      answeredCorrect: m.questionTopic ? correctByTopic.get(m.questionTopic) ?? 0 : 0,
    };
    return { ...m, lessons: visibleLessons, facts, progress: moduleProgress(facts) };
  });

  const overall = courseProgress(modules.map((m) => m.progress));
  const nextIdx = nextModuleIndex(modules.map((m) => m.progress));

  return NextResponse.json({
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      isPublished: course.isPublished,
      domain: course.domain,
    },
    modules,
    progress: overall,
    nextModuleId: nextIdx === null ? null : modules[nextIdx].id,
  });
}

export const GET = withErrorHandler(_GET);
