import { PrismaClient, EnrollmentRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

const ADMIN_PW = readFileSync("/tmp/.tutor-admin-pw", "utf8").trim();
const INSTRUCTOR_PW = readFileSync("/tmp/.tutor-instructor-pw", "utf8").trim();

if (!ADMIN_PW || !INSTRUCTOR_PW) {
  console.error("Passwords missing");
  process.exit(1);
}

async function main() {
  const aviation = await prisma.domain.findUnique({ where: { slug: "aviation" } });
  if (!aviation) {
    console.error("Aviation domain not found - run seed first");
    process.exit(2);
  }

  const adminHash = await bcrypt.hash(ADMIN_PW, 10);
  const instructorHash = await bcrypt.hash(INSTRUCTOR_PW, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin-test@tutor.app" },
    update: { password: adminHash, isSuperAdmin: true, name: "Admin Test", emailVerified: new Date() },
    create: {
      email: "admin-test@tutor.app",
      name: "Admin Test",
      password: adminHash,
      isSuperAdmin: true,
      locale: "en",
      emailVerified: new Date(),
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor-test@tutor.app" },
    update: { password: instructorHash, isSuperAdmin: false, name: "Instructor Test", emailVerified: new Date() },
    create: {
      email: "instructor-test@tutor.app",
      name: "Instructor Test",
      password: instructorHash,
      isSuperAdmin: false,
      locale: "en",
      emailVerified: new Date(),
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_domainId: { userId: admin.id, domainId: aviation.id } },
    update: { roles: [EnrollmentRole.ADMIN, EnrollmentRole.STUDENT], isActive: true },
    create: {
      userId: admin.id,
      domainId: aviation.id,
      roles: [EnrollmentRole.ADMIN, EnrollmentRole.STUDENT],
      isActive: true,
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_domainId: { userId: instructor.id, domainId: aviation.id } },
    update: { roles: [EnrollmentRole.INSTRUCTOR], isActive: true },
    create: {
      userId: instructor.id,
      domainId: aviation.id,
      roles: [EnrollmentRole.INSTRUCTOR],
      isActive: true,
    },
  });

  const adminCheck = await prisma.user.findUnique({
    where: { email: "admin-test@tutor.app" },
    include: { enrollments: { include: { domain: { select: { slug: true } } } } },
  });
  const instrCheck = await prisma.user.findUnique({
    where: { email: "instructor-test@tutor.app" },
    include: { enrollments: { include: { domain: { select: { slug: true } } } } },
  });

  const questionCount = await prisma.question.count({ where: { domainId: aviation.id } });

  console.log(JSON.stringify({
    admin: {
      id: adminCheck.id,
      email: adminCheck.email,
      isSuperAdmin: adminCheck.isSuperAdmin,
      enrollments: adminCheck.enrollments.map(e => ({ domain: e.domain.slug, roles: e.roles })),
      hasPassword: !!adminCheck.password,
    },
    instructor: {
      id: instrCheck.id,
      email: instrCheck.email,
      isSuperAdmin: instrCheck.isSuperAdmin,
      enrollments: instrCheck.enrollments.map(e => ({ domain: e.domain.slug, roles: e.roles })),
      hasPassword: !!instrCheck.password,
    },
    aviationQuestionCount: questionCount,
  }, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
