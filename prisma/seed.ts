import { PrismaClient, EnrollmentRole, QuestionSource, QuestionStatus } from "@prisma/client";
import { AVIATION_QUESTIONS, WIZZAIR_EXAM_FORMATS, ESCALATION_TEMPLATES, DEMO_STUDENTS } from "./aviation-questions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create aviation domain
  const aviationDomain = await prisma.domain.upsert({
    where: { slug: "aviation" },
    update: {},
    create: {
      name: "Aviation - WizzAir Academy",
      slug: "aviation",
      description:
        "Comprehensive aviation training for WizzAir Academy cadets. Covers air law, meteorology, navigation, aircraft systems, and flight principles.",
      icon: "✈️",
      isActive: true,
    },
  });

  console.log(`Created domain: ${aviationDomain.name}`);

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@tutor.app" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@tutor.app",
      isSuperAdmin: true,
      locale: "en",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@tutor.app" },
    update: {},
    create: {
      name: "Student User",
      email: "student@tutor.app",
      isSuperAdmin: false,
      locale: "ro",
    },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@tutor.app" },
    update: {},
    create: {
      name: "Instructor User",
      email: "instructor@tutor.app",
      isSuperAdmin: false,
      locale: "en",
    },
  });

  console.log("Created users: admin, student, instructor");

  // Enrollments
  await prisma.enrollment.upsert({
    where: {
      userId_domainId: {
        userId: adminUser.id,
        domainId: aviationDomain.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      domainId: aviationDomain.id,
      roles: [EnrollmentRole.ADMIN, EnrollmentRole.STUDENT],
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_domainId: {
        userId: studentUser.id,
        domainId: aviationDomain.id,
      },
    },
    update: {},
    create: {
      userId: studentUser.id,
      domainId: aviationDomain.id,
      roles: [EnrollmentRole.STUDENT],
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_domainId: {
        userId: instructorUser.id,
        domainId: aviationDomain.id,
      },
    },
    update: {},
    create: {
      userId: instructorUser.id,
      domainId: aviationDomain.id,
      roles: [EnrollmentRole.INSTRUCTOR],
    },
  });

  console.log("Created enrollments with roles");

  // Sample questions
  const questions = [
    {
      domainId: aviationDomain.id,
      subject: "Air Law",
      topic: "ICAO Regulations",
      difficulty: 3,
      content: "What organization is responsible for establishing international standards for civil aviation?",
      correctAnswer: "ICAO (International Civil Aviation Organization)",
      explanation: "ICAO, established in 1944 by the Chicago Convention, is the UN specialized agency responsible for international civil aviation standards and recommended practices.",
      source: QuestionSource.MANUAL,
      status: QuestionStatus.PUBLISHED,
    },
    {
      domainId: aviationDomain.id,
      subject: "Meteorology",
      topic: "Cloud Types",
      difficulty: 2,
      content: "Which type of cloud is typically associated with thunderstorms?",
      correctAnswer: "Cumulonimbus (Cb)",
      explanation: "Cumulonimbus clouds are massive, towering clouds associated with heavy rain, lightning, and turbulence. They can extend from near the surface to the tropopause.",
      source: QuestionSource.MANUAL,
      status: QuestionStatus.PUBLISHED,
    },
    {
      domainId: aviationDomain.id,
      subject: "Navigation",
      topic: "VOR Navigation",
      difficulty: 4,
      content: "What is the maximum usable range of a standard VOR at FL350?",
      correctAnswer: "Approximately 200 NM",
      explanation: "VOR range depends on altitude. Using the formula: range (NM) ≈ 1.23 × √(altitude in feet), at FL350 (35,000 ft): 1.23 × √35000 ≈ 230 NM theoretical, ~200 NM practical.",
      source: QuestionSource.MANUAL,
      status: QuestionStatus.PUBLISHED,
    },
    {
      domainId: aviationDomain.id,
      subject: "Aircraft Systems",
      topic: "Hydraulic Systems",
      difficulty: 3,
      content: "What is the typical hydraulic fluid pressure in a modern commercial aircraft?",
      correctAnswer: "3000 PSI",
      explanation: "Most modern commercial aircraft hydraulic systems operate at 3000 PSI (approximately 207 bar). The A380 uses a higher 5000 PSI system for weight savings.",
      source: QuestionSource.MANUAL,
      status: QuestionStatus.PUBLISHED,
    },
    {
      domainId: aviationDomain.id,
      subject: "Flight Principles",
      topic: "Aerodynamics",
      difficulty: 2,
      content: "According to Bernoulli's principle, what happens to pressure as airflow velocity increases?",
      correctAnswer: "Pressure decreases",
      explanation: "Bernoulli's principle states that an increase in the speed of a fluid occurs simultaneously with a decrease in static pressure. This is fundamental to understanding lift generation over an airfoil.",
      source: QuestionSource.MANUAL,
      status: QuestionStatus.PUBLISHED,
    },
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`Created ${questions.length} sample questions`);

  // Exam simulation
  await prisma.examSimulation.create({
    data: {
      domainId: aviationDomain.id,
      name: "ATPL Theory Mock Exam",
      description: "Full ATPL theory mock examination covering all subjects.",
      timeLimit: 120,
      questionCount: 50,
      passingScore: 75,
      format: {
        type: "multiple_choice",
        optionsCount: 4,
        shuffleOptions: true,
        shuffleQuestions: true,
        showExplanation: true,
        subjects: ["Air Law", "Meteorology", "Navigation", "Aircraft Systems", "Flight Principles"],
      },
    },
  });

  console.log("Created exam simulation");

  // Content source
  await prisma.contentSource.create({
    data: {
      domainId: aviationDomain.id,
      name: "WizzAir Academy Training Materials",
      type: "manual",
      metadata: {
        provider: "WizzAir Academy",
        format: "PDF + Online",
        lastUpdated: "2026-01-01",
      },
    },
  });

  console.log("Created content source");

  // ─── Phase 11: WizzAir Aviation Content ───

  // Seed aviation questions (250+)
  console.log("Seeding aviation questions...");
  const aviationQData = AVIATION_QUESTIONS.map((q) => ({
    domainId: aviationDomain.id,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    type: "MULTIPLE_CHOICE" as const,
    content: q.content,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    source: QuestionSource.MANUAL,
    status: QuestionStatus.PUBLISHED,
    createdById: adminUser.id,
  }));

  const createdQuestions = await prisma.question.createMany({
    data: aviationQData,
    skipDuplicates: true,
  });
  console.log(`Created ${createdQuestions.count} aviation questions`);

  // Seed WizzAir exam formats
  console.log("Seeding WizzAir exam formats...");
  for (const fmt of WIZZAIR_EXAM_FORMATS) {
    const exists = await prisma.examSimulation.findFirst({
      where: { domainId: aviationDomain.id, name: fmt.name },
    });
    if (!exists) {
      await prisma.examSimulation.create({
        data: {
          domainId: aviationDomain.id,
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
  console.log(`Created ${WIZZAIR_EXAM_FORMATS.length} exam formats`);

  // Seed escalation templates (Romanian)
  console.log("Seeding escalation templates...");
  for (const tpl of ESCALATION_TEMPLATES) {
    const exists = await prisma.escalationTemplate.findUnique({
      where: { templateId: tpl.templateId },
    });
    if (!exists) {
      await prisma.escalationTemplate.create({ data: tpl });
    }
  }
  console.log(`Created ${ESCALATION_TEMPLATES.length} escalation templates`);

  // Seed demo students
  console.log("Seeding demo students...");
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

    await prisma.enrollment.upsert({
      where: {
        userId_domainId: { userId: user.id, domainId: aviationDomain.id },
      },
      update: {},
      create: {
        userId: user.id,
        domainId: aviationDomain.id,
        roles: [EnrollmentRole.STUDENT],
      },
    });

    await prisma.userGamification.upsert({
      where: {
        userId_domainId: { userId: user.id, domainId: aviationDomain.id },
      },
      update: {},
      create: {
        userId: user.id,
        domainId: aviationDomain.id,
        xp: Math.floor(Math.random() * 2000) + 100,
        level: "Cadet",
        streak: Math.floor(Math.random() * 14),
        longestStreak: Math.floor(Math.random() * 30) + 5,
        lastActivityDate: new Date(),
        achievements: [{ slug: "first_session", unlockedAt: new Date().toISOString() }],
      },
    });
  }
  console.log(`Created ${DEMO_STUDENTS.length} demo students`);

  // Verification
  const totalQ = await prisma.question.count({ where: { domainId: aviationDomain.id } });
  const bySubject = await prisma.question.groupBy({
    by: ["subject"],
    where: { domainId: aviationDomain.id },
    _count: true,
  });
  console.log(`\nVerification - Total questions: ${totalQ}`);
  bySubject.forEach((g) => console.log(`  ${g.subject}: ${g._count}`));

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
