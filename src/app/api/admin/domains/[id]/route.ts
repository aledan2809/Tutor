import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireContentAdmin, ownsDomain, resolveOwnedDomain } from "@/lib/merchant-auth";
import { withErrorHandling, ApiErrors } from "@/lib/api-error-handler";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// organizationId is deliberately absent: a subject cannot be handed to another
// organization through this form, by a merchant admin or by anyone else.
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
  instructorEnabled: z.boolean().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { error, scope } = await requireContentAdmin();
    if (error) return error;

    const { id } = await params;
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        _count: { select: { questions: true, enrollments: true } },
        examConfig: true,
      },
    });

    if (!domain) {
      return ApiErrors.notFound();
    }

    // 404, not 403: a merchant admin must not learn which subjects other
    // merchants have. Gated on ORG because for PLATFORM ownsDomain can only
    // return true, so the superadmin's answer is unchanged.
    if (scope.kind === "ORG" && !ownsDomain(scope, domain)) {
      return ApiErrors.notFound();
    }

    return NextResponse.json(domain);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { error, scope, userId } = await requireContentAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid request body");
    }

    // The subject written to must be the merchant's own. Gated on ORG because for
    // PLATFORM the check can only pass, which keeps the superadmin's path — including
    // its behaviour on a bogus id — exactly as it was.
    if (scope.kind === "ORG") {
      const owned = await resolveOwnedDomain(scope, id);
      if (!owned.ok) return owned.response;
    }

    // Visibility is the one field here whose flip exposes content to the open
    // internet (or pulls it back). It is audited; the rest of the form is not.
    const before = parsed.data.visibility
      ? await prisma.domain.findUnique({ where: { id }, select: { slug: true, visibility: true, organizationId: true } })
      : null;

    const domain = await prisma.domain.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { questions: true, enrollments: true } } },
    });

    if (before && before.visibility !== domain.visibility) {
      await logAudit({
        action: "DOMAIN_VISIBILITY_CHANGE",
        performedById: userId,
        targetType: "Domain",
        metadata: { domainId: id, slug: before.slug, from: before.visibility, to: domain.visibility, organizationId: before.organizationId },
      });
    }

    return NextResponse.json(domain);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { error, scope } = await requireContentAdmin();
    if (error) return error;

    const { id } = await params;

    // Same gate as PUT: a merchant admin can only delete its own subjects, and
    // PLATFORM runs nothing here, so the superadmin's path is untouched.
    if (scope.kind === "ORG") {
      const owned = await resolveOwnedDomain(scope, id);
      if (!owned.ok) return owned.response;
    }

    await prisma.domain.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
