import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireContentAdmin, domainScopeWhere } from "@/lib/merchant-auth";

/**
 * The subjects this admin may work in — what a merchant UI populates its pickers
 * from, so a merchant admin is never offered a subject they cannot touch.
 * The superadmin gets every subject, which is what domainScopeWhere returning {} means.
 */
async function _GET() {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const domains = await prisma.domain.findMany({
    where: domainScopeWhere(scope),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      isActive: true,
      visibility: true,
      organizationId: true,
      _count: { select: { questions: true, enrollments: true } },
    },
  });

  return NextResponse.json({ domains, scope: scope.kind });
}

export const GET = withErrorHandler(_GET);
