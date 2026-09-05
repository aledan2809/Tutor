import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/**
 * The three things that define a merchant, all superadmin-only:
 *   assignDomains  — which subjects belong to it
 *   grantAdmin     — who administers it
 *   revokeAdmin    — and who stops
 *
 * `grantAdmin` sets organizationId AND isOrgAdmin together. The two are never set
 * apart: isOrgAdmin without an organization is an admin of nothing, and every
 * check in merchant-auth.ts reads both, so a half-set account would be a silent
 * no-op rather than an error.
 */
const patchSchema = z.union([
  z.object({ action: z.literal("assignDomains"), domainIds: z.array(z.string().min(1)).min(1) }),
  z.object({ action: z.literal("releaseDomains"), domainIds: z.array(z.string().min(1)).min(1) }),
  z.object({ action: z.literal("grantAdmin"), userId: z.string().min(1) }),
  z.object({ action: z.literal("revokeAdmin"), userId: z.string().min(1) }),
]);

async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const organization = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      domains: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, visibility: true, isActive: true },
      },
      members: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, isOrgAdmin: true, isBanned: true },
      },
    },
  });
  if (!organization) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ organization });
}

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = parsed.data;
  let changed = 0;

  if (body.action === "assignDomains") {
    // Only subjects that belong to nobody yet: moving one merchant's subject to
    // another merchant would hand over its content and its enrolled people at once.
    const res = await prisma.domain.updateMany({
      where: { id: { in: body.domainIds }, organizationId: null },
      data: { organizationId: id },
    });
    changed = res.count;
  } else if (body.action === "releaseDomains") {
    const res = await prisma.domain.updateMany({
      where: { id: { in: body.domainIds }, organizationId: id },
      data: { organizationId: null },
    });
    changed = res.count;
  } else if (body.action === "grantAdmin") {
    const target = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, isSuperAdmin: true },
    });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    // A superadmin is already unlimited; narrowing them into an organization
    // would read as a demotion that this route does not actually perform.
    if (target.isSuperAdmin) {
      return NextResponse.json(
        { error: "Contul e superadmin — are deja acces nelimitat" },
        { status: 409 }
      );
    }
    await prisma.user.update({
      where: { id: body.userId },
      data: { organizationId: id, isOrgAdmin: true },
    });
    changed = 1;
  } else {
    const res = await prisma.user.updateMany({
      where: { id: body.userId, organizationId: id },
      data: { isOrgAdmin: false },
    });
    changed = res.count;
  }

  await logAudit({
    action: `ORGANIZATION_${body.action.replace(/([A-Z])/g, "_$1").toUpperCase()}`,
    performedById: session.user.id,
    targetUserId: "userId" in body ? body.userId : undefined,
    targetType: "Organization",
    metadata: { organizationId: id, slug: org.slug, ...body, changed },
  });

  return NextResponse.json({ ok: true, changed });
}

export const GET = withErrorHandler(_GET);
export const PATCH = withErrorHandler(_PATCH);
