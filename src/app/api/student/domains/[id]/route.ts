import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { refuseIfPaused } from "@/lib/access-gate";
import { canSeePrivateDomains } from "@/lib/domain-access";
import { activeSetters, lockedText } from "@/lib/guardian-lock";
import { ensureWatcherEnrollments } from "@/lib/family-invite";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().min(1, "Domain ID required"),
});

/** The family's adults follow the child into a new subject, as they do into the first ones. */
async function familyFollows(childId: string, domainId: string) {
  const guardians = await prisma.guardian.findMany({ where: { childId, status: "active" }, select: { parentId: true } });
  for (const g of guardians) await ensureWatcherEnrollments(g.parentId, [domainId]);
}

async function _POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // A paused account (access.ts) picks no subjects: the page shows the pause screen (review r6, U7).
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;

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

  // A private domain cannot be self-joined — not from the picker, not by POSTing
  // its id. Only an admin enrolls into it (or an access code they issued does).
  // 404, not 403: a private domain must not confirm that it exists. This runs
  // BEFORE the isActive check, which answers 400 "is not active" and would
  // otherwise confirm a private domain simply by being switched off.
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

  if (!domain.isActive) {
    return NextResponse.json({ error: "Domain is not active" }, { status: 400 });
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
    // A subject a parent removed stays removed while they're the child's parent (guardian-lock.ts).
    if (existing.setById) {
      const owner = (await activeSetters(session.user.id, [existing.setById])).get(existing.setById);
      if (owner) {
        return NextResponse.json({ error: lockedText(owner, "subject"), locked: true }, { status: 403 });
      }
    }
    // Re-activate enrollment — the child's own choice again.
    const updated = await prisma.enrollment.update({
      where: { id: existing.id },
      data: { isActive: true, setById: null },
      include: { domain: true },
    });
    await familyFollows(session.user.id, domainId);
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
  if (enrollment.roles.includes("STUDENT")) await familyFollows(session.user.id, domainId);

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
