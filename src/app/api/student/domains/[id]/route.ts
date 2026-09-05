import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { canSeePrivateDomains } from "@/lib/domain-access";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().min(1, "Domain ID required"),
});

async function _POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawParams = await params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid domain ID", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const domainId = parsed.data.id;

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  if (!domain.isActive) {
    return NextResponse.json({ error: "Domain is not active" }, { status: 400 });
  }

  // A private domain cannot be self-joined — not from the picker, not by POSTing
  // its id. Only an admin enrolls into it (or an access code they issued does).
  // 404, not 403: a private domain must not confirm that it exists.
  if (
    domain.visibility === "PRIVATE" &&
    !canSeePrivateDomains({
      isSuperAdmin: (session.user as { isSuperAdmin?: boolean }).isSuperAdmin,
      email: session.user.email,
      enrollments: session.user.enrollments,
    })
  ) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_domainId: {
        userId: session.user.id,
        domainId,
      },
    },
  });

  if (existing) {
    if (existing.isActive) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }
    // Re-activate enrollment
    const updated = await prisma.enrollment.update({
      where: { id: existing.id },
      data: { isActive: true },
      include: { domain: true },
    });
    return NextResponse.json({
      id: updated.id,
      domainId: updated.domainId,
      domainName: updated.domain.name,
      domainSlug: updated.domain.slug,
      roles: updated.roles,
      enrolledAt: updated.createdAt,
    }, { status: 200 });
  }

  // Same guard as /api/activate: joining a domain must not turn a parent account
  // into a learner one.
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: session.user.id,
      domainId,
      roles: [session.user.accountRole === "PARENT" ? "WATCHER" : "STUDENT"],
    },
    include: { domain: true },
  });

  return NextResponse.json({
    id: enrollment.id,
    domainId: enrollment.domainId,
    domainName: enrollment.domain.name,
    domainSlug: enrollment.domain.slug,
    roles: enrollment.roles,
    enrolledAt: enrollment.createdAt,
  }, { status: 201 });
}

export const POST = withErrorHandler(_POST);
