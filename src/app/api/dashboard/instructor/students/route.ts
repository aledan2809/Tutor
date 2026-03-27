import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary, predictFailureRisk } from "@/lib/predictive-analytics";

export async function GET(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");
  const groupId = searchParams.get("groupId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const instructorDomainIds = session!.user.enrollments
    .filter((e) =>
      e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  const targetDomainIds = domainId ? [domainId] : instructorDomainIds;

  // If groupId specified, filter to group members
  let studentUserIds: string[] | undefined;
  if (groupId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    studentUserIds = members.map((m) => m.userId);
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      domainId: { in: targetDomainIds },
      roles: { hasSome: ["STUDENT"] },
      isActive: true,
      ...(studentUserIds ? { userId: { in: studentUserIds } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      domain: { select: { id: true, name: true, slug: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.enrollment.count({
    where: {
      domainId: { in: targetDomainIds },
      roles: { hasSome: ["STUDENT"] },
      isActive: true,
      ...(studentUserIds ? { userId: { in: studentUserIds } } : {}),
    },
  });

  const students = await Promise.all(
    enrollments.map(async (enrollment) => {
      const [summary, risk] = await Promise.all([
        getStudentProgressSummary(enrollment.userId, enrollment.domainId),
        predictFailureRisk(enrollment.userId, enrollment.domainId),
      ]);

      return {
        id: enrollment.userId,
        name: enrollment.user.name,
        email: enrollment.user.email,
        image: enrollment.user.image,
        domain: enrollment.domain,
        enrolledAt: enrollment.createdAt,
        ...summary,
        risk,
      };
    })
  );

  return NextResponse.json({
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
