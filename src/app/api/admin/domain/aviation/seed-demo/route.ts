import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  AVIATION_QUESTIONS,
  WIZZAIR_EXAM_FORMATS,
  ESCALATION_TEMPLATES,
  DEMO_STUDENTS,
} from "@/../prisma/aviation-questions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  // Require SuperAdmin for seeding
  if (!session!.user.isSuperAdmin) {
    return NextResponse.json({ error: "SuperAdmin required for seeding" }, { status: 403 });
  }

  const domain = await prisma.domain.findUnique({ where: { slug: "aviation" } });
  if (!domain) {
    return NextResponse.json({ error: "Aviation domain not found. Run base seed first." }, { status: 404 });
  }

  const results: Record<string, number | string> = {};

  // 1. Seed questions
  const existingCount = await prisma.question.count({ where: { domainId: domain.id } });
  if (existingCount < 50) {
    const created = await prisma.question.createMany({
      data: AVIATION_QUESTIONS.map((q) => ({
        domainId: domain.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        type: "MULTIPLE_CHOICE" as const,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        source: "MANUAL" as const,
        status: "PUBLISHED" as const,
        createdById: session!.user.id,
      })),
      skipDuplicates: true,
    });
    results.questionsCreated = created.count;
  } else {
    results.questionsCreated = `Skipped (${existingCount} already exist)`;
  }

  // 2. Seed exam formats
  for (const fmt of WIZZAIR_EXAM_FORMATS) {
    const exists = await prisma.examSimulation.findFirst({
      where: { domainId: domain.id, name: fmt.name },
    });
    if (!exists) {
      await prisma.examSimulation.create({
        data: {
          domainId: domain.id,
          name: fmt.name,
          description: fmt.description,
          timeLimit: fmt.timeLimit,
          questionCount: fmt.questionCount,
          passingScore: fmt.passingScore,
          format: fmt.format,
        },
      });
    }
  }
  results.examFormats = WIZZAIR_EXAM_FORMATS.length;

  // 3. Seed escalation templates
  for (const tpl of ESCALATION_TEMPLATES) {
    const exists = await prisma.escalationTemplate.findUnique({
      where: { templateId: tpl.templateId },
    });
    if (!exists) {
      await prisma.escalationTemplate.create({ data: tpl });
    }
  }
  results.escalationTemplates = ESCALATION_TEMPLATES.length;

  // 4. Seed demo students
  const createdStudents: string[] = [];
  for (const student of DEMO_STUDENTS) {
    const user = await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        name: student.name,
        email: student.email,
        locale: student.locale,
      },
    });

    // Enroll in aviation domain
    await prisma.enrollment.upsert({
      where: {
        userId_domainId: { userId: user.id, domainId: domain.id },
      },
      update: {},
      create: {
        userId: user.id,
        domainId: domain.id,
        roles: ["STUDENT"],
      },
    });

    // Create gamification record
    await prisma.userGamification.upsert({
      where: {
        userId_domainId: { userId: user.id, domainId: domain.id },
      },
      update: {},
      create: {
        userId: user.id,
        domainId: domain.id,
        xp: Math.floor(Math.random() * 2000) + 100,
        level: ["Cadet", "Co-pilot", "Captain"][Math.floor(Math.random() * 3)],
        streak: Math.floor(Math.random() * 14),
        longestStreak: Math.floor(Math.random() * 30) + 5,
        lastActivityDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        achievements: [
          { slug: "first_session", unlockedAt: new Date().toISOString() },
          { slug: "streak_7", unlockedAt: new Date().toISOString() },
        ],
      },
    });

    // Create some progress records
    const subjects = ["Math", "Physics", "Psychology", "Aviation English"];
    const topics = ["Algebra", "Mechanics", "Cognitive Psychology", "ICAO Phraseology"];
    for (let i = 0; i < subjects.length; i++) {
      await prisma.progress.upsert({
        where: {
          userId_domainId_subject_topic: {
            userId: user.id,
            domainId: domain.id,
            subject: subjects[i],
            topic: topics[i],
          },
        },
        update: {},
        create: {
          userId: user.id,
          domainId: domain.id,
          subject: subjects[i],
          topic: topics[i],
          masteryLevel: Math.random() * 0.8 + 0.1,
          totalAttempts: Math.floor(Math.random() * 50) + 5,
          correctAttempts: Math.floor(Math.random() * 30) + 3,
          easeFactor: 2.5 + (Math.random() - 0.5),
          interval: Math.floor(Math.random() * 14) + 1,
          repetitions: Math.floor(Math.random() * 5),
        },
      });
    }

    // Create a demo exam session for some students
    if (Math.random() > 0.3) {
      const examFormat = await prisma.examSimulation.findFirst({
        where: { domainId: domain.id },
      });
      if (examFormat) {
        const score = Math.floor(Math.random() * 40) + 50;
        await prisma.examSession.create({
          data: {
            userId: user.id,
            domainId: domain.id,
            formatId: examFormat.id,
            mode: "PRACTICE",
            status: "COMPLETED",
            submittedAt: new Date(),
            timeLimit: examFormat.timeLimit,
            score,
            passed: score >= examFormat.passingScore,
            questionIds: [],
            answers: [],
            results: {
              correct: Math.floor(score / 100 * 40),
              incorrect: 40 - Math.floor(score / 100 * 40),
              timeTaken: Math.floor(Math.random() * 80) + 20,
            },
          },
        });
      }
    }

    createdStudents.push(student.name);
  }
  results.demoStudents = createdStudents.length;

  // 5. Count totals for verification
  const totalQuestions = await prisma.question.count({ where: { domainId: domain.id } });
  const questionsBySubject = await prisma.question.groupBy({
    by: ["subject"],
    where: { domainId: domain.id },
    _count: true,
  });

  return NextResponse.json({
    success: true,
    results,
    verification: {
      totalQuestions,
      questionsBySubject: questionsBySubject.map((g) => ({
        subject: g.subject,
        count: g._count,
      })),
      demoStudents: createdStudents,
    },
  });
}
