import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { predictFailureRisk } from "@/lib/predictive-analytics";

export async function GET(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  const instructorDomainIds = session!.user.enrollments
    .filter((e) =>
      e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  const targetDomainIds = domainId ? [domainId] : instructorDomainIds;

  const studentEnrollments = await prisma.enrollment.findMany({
    where: {
      domainId: { in: targetDomainIds },
      roles: { hasSome: ["STUDENT"] },
      isActive: true,
    },
    include: {
      user: { select: { id: true, name: true } },
      domain: { select: { id: true, name: true, slug: true } },
    },
  });

  // Calculate predictive analytics for all students
  const predictions = await Promise.all(
    studentEnrollments.map(async (enrollment) => {
      const risk = await predictFailureRisk(enrollment.userId, enrollment.domainId);
      return {
        ...risk,
        studentName: enrollment.user.name,
        domain: enrollment.domain,
      };
    })
  );

  // Sort by failure probability (highest risk first)
  predictions.sort((a, b) => b.failureProbability - a.failureProbability);

  // Summary stats
  const atRisk = predictions.filter((p) => p.failureProbability > 60);
  const declining = predictions.filter((p) => p.trend === "declining");
  const improving = predictions.filter((p) => p.trend === "improving");

  return NextResponse.json({
    predictions,
    summary: {
      totalStudents: predictions.length,
      atRiskCount: atRisk.length,
      decliningCount: declining.length,
      improvingCount: improving.length,
      averageRisk:
        predictions.length > 0
          ? Math.round(
              predictions.reduce((s, p) => s + p.failureProbability, 0) / predictions.length
            )
          : 0,
    },
  });
}
