import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";

async function _GET(
  _req: Request,
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
