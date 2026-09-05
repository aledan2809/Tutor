import { NextRequest, NextResponse } from "next/server";
import { getSession, hasAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";

async function _GET(
  req: NextRequest,
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

  if (!hasAnyRole(session, domainSlug, ["STUDENT", "ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formats = await prisma.examSimulation.findMany({
    where: { domainId: domain.id, isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      timeLimit: true,
      questionCount: true,
      passingScore: true,
      format: true,
    },
  });

  return NextResponse.json({ formats });
}

export const GET = withErrorHandler(_GET);
