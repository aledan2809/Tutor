import { NextRequest, NextResponse } from "next/server";
import { getSession, hasRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/[domain]/calendar/students
 * Returns students enrolled in this domain (for instructor scheduling).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  if (!hasRole(session, domainSlug, "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
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
