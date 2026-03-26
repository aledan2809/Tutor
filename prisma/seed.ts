import { PrismaClient, EnrollmentRole, Difficulty, QuestionSource, QuestionStatus } from "@prisma/client";

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
      difficulty: Difficulty.MEDIUM,
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
      difficulty: Difficulty.EASY,
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
      difficulty: Difficulty.HARD,
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
      difficulty: Difficulty.MEDIUM,
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
      difficulty: Difficulty.EASY,
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
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
