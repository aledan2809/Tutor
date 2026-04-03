import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary, predictFailureRisk } from "@/lib/predictive-analytics";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "student"; // student, group, domain
  const targetId = searchParams.get("id");
  const format = searchParams.get("format") ?? "json"; // json, csv

  const instructorDomainIds = session!.user.enrollments
    .filter((e) =>
      e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  if (type === "student" && targetId) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: targetId,
        domainId: { in: instructorDomainIds },
        roles: { hasSome: ["STUDENT"] },
      },
      include: { domain: true },
    });

    const report = await Promise.all(
      enrollments.map(async (e) => {
        const [summary, risk] = await Promise.all([
          getStudentProgressSummary(targetId, e.domainId),
          predictFailureRisk(targetId, e.domainId),
        ]);
        return { domain: e.domain.name, ...summary, risk };
      })
    );

    if (format === "csv") {
      return generateCSV(report, "student-report");
    }
    return NextResponse.json({ type: "student", report });
  }

  if (type === "group" && targetId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId: targetId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { include: { domain: true } },
      },
    });

    const report = await Promise.all(
      members.map(async (m) => {
        const [summary, risk] = await Promise.all([
          getStudentProgressSummary(m.userId, m.group.domainId),
          predictFailureRisk(m.userId, m.group.domainId),
        ]);
        return {
          studentName: m.user.name,
          studentEmail: m.user.email,
          ...summary,
          risk,
        };
      })
    );

    if (format === "csv") {
      return generateCSV(report, "group-report");
    }
    return NextResponse.json({ type: "group", groupId: targetId, report });
  }

  if (type === "domain" && targetId) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        domainId: targetId,
        roles: { hasSome: ["STUDENT"] },
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        domain: true,
      },
    });

    const report = await Promise.all(
      enrollments.map(async (e) => {
        const [summary, risk] = await Promise.all([
          getStudentProgressSummary(e.userId, targetId),
          predictFailureRisk(e.userId, targetId),
        ]);
        return {
          studentName: e.user.name,
          studentEmail: e.user.email,
          ...summary,
          risk,
        };
      })
    );

    if (format === "csv") {
      return generateCSV(report, "domain-report");
    }
    return NextResponse.json({
      type: "domain",
      domainName: enrollments[0]?.domain.name,
      report,
    });
  }

  return NextResponse.json({ error: "Invalid report type or missing id" }, { status: 400 });
}

export const GET = withErrorHandler(_GET);

function generateCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    return new NextResponse("No data", { status: 200 });
  }

  const flattenObj = (obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        Object.assign(result, flattenObj(val as Record<string, unknown>, newKey));
      } else {
        result[newKey] = String(val ?? "");
      }
    }
    return result;
  };

  const flattened = data.map((d) => flattenObj(d));
  const headers = [...new Set(flattened.flatMap((r) => Object.keys(r)))];
  const csvLines = [
    headers.join(","),
    ...flattened.map((row) =>
      headers.map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];

  return new NextResponse(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
