import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;
  const domain = await prisma.domain.findUnique({ where: { slug: domainSlug } });
  if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

  // Students see only APPROVED and PUBLISHED bibliography
  const items = await prisma.bibliography.findMany({
    where: { domainId: domain.id, status: { in: ["APPROVED", "PUBLISHED"] } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, title: true, authors: true, publisher: true, year: true,
      edition: true, city: true, isbn: true, url: true, notes: true,
    },
  });

  return NextResponse.json({ items });
}

export const GET = withErrorHandler(_GET);
