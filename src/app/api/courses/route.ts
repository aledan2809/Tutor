import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";

/**
 * The courses a learner can open in a subject.
 *
 * Goes through the same domain gate as every other subject-scoped route, so a
 * course inside a private subject is invisible exactly like the subject is —
 * 404, not an empty list, which would confirm the subject exists.
 */
async function _GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domainSlug = req.nextUrl.searchParams.get("domain")?.trim();
  if (!domainSlug) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }

  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;

  const isAdmin =
    session.user.isSuperAdmin ||
    (session.user.isOrgAdmin === true && Boolean(session.user.organizationId));

  const courses = await prisma.course.findMany({
    // Drafts are visible to whoever is building them, not to learners.
    where: { domainId: gate.domain.id, ...(isAdmin ? {} : { isPublished: true }) },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      isPublished: true,
      _count: { select: { modules: true } },
    },
  });

  return NextResponse.json({ domain: { slug: gate.domain.slug, name: gate.domain.name }, courses });
}

export const GET = withErrorHandler(_GET);
