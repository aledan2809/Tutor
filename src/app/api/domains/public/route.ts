import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET() {
  // Public (no-account) pickers list PUBLIC domains only. A private domain must
  // not appear here by name, icon or count — "private" means invisible.
  const domains = await prisma.domain.findMany({
    where: { isActive: true, visibility: "PUBLIC" },
    select: { slug: true, name: true, icon: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ domains });
}

export const GET = withErrorHandler(_GET);
