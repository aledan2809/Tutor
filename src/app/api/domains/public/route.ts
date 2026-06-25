import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isRestrictedDomainSlug } from "@/lib/domain-access";

async function _GET() {
  const all = await prisma.domain.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, icon: true },
    orderBy: { name: "asc" },
  });
  // Public (no-account) pickers must NEVER list restricted/non-curriculum domains
  // (e.g. aviation, a student's private licență grile).
  const domains = all.filter((d) => !isRestrictedDomainSlug(d.slug));

  return NextResponse.json({ domains });
}

export const GET = withErrorHandler(_GET);
