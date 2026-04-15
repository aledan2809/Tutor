import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET() {
  const domains = await prisma.domain.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, icon: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ domains });
}

export const GET = withErrorHandler(_GET);
