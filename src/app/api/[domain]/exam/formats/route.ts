import { NextRequest, NextResponse } from "next/server";
import { getSession, hasAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  if (!hasAnyRole(session, domainSlug, ["STUDENT", "ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
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
