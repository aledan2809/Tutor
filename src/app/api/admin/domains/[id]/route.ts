import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandling, ApiErrors } from "@/lib/api-error-handler";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

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
    const { error } = await requireAdmin();
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

    return NextResponse.json(domain);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid request body");
    }

    // Visibility is the one field here whose flip exposes content to the open
    // internet (or pulls it back). It is audited; the rest of the form is not.
    const before = parsed.data.visibility
      ? await prisma.domain.findUnique({ where: { id }, select: { slug: true, visibility: true } })
      : null;

    const domain = await prisma.domain.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { questions: true, enrollments: true } } },
    });

    if (before && before.visibility !== domain.visibility) {
      await logAudit({
        action: "DOMAIN_VISIBILITY_CHANGE",
        performedById: session.user.id,
        targetType: "Domain",
        metadata: { domainId: id, slug: before.slug, from: before.visibility, to: domain.visibility },
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
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    await prisma.domain.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
