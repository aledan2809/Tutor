import { NextRequest, NextResponse } from "next/server";
import { getSession, hasRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";

/**
 * GET /api/[domain]/calendar/students
 * Returns students enrolled in this domain (for instructor scheduling).
 */
async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;
  const domain = gate.domain;

  if (!hasRole(session, domainSlug, "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      domainId: domain.id,
      roles: { has: "STUDENT" },
      isActive: true,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const students = enrollments.map((e) => ({
    id: e.user.id,
    name: e.user.name,
    email: e.user.email,
  }));

  return NextResponse.json({ students });
}

export const GET = withErrorHandler(_GET);
