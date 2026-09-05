import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireContentAdmin, ownsDomain } from "@/lib/merchant-auth";
import { withErrorHandling, ApiErrors } from "@/lib/api-error-handler";
import { logAudit } from "@/lib/audit";
import { formatJoinCode } from "@/lib/join-code";
import { generateJoinCode } from "@/lib/join-code-server";
import { z } from "zod";

const bodySchema = z.object({ action: z.enum(["rotate", "clear"]) });

/**
 * POST /api/admin/domains/[id]/join-code { action: "rotate" | "clear" }
 *
 * "rotate" issues a fresh code (replacing any previous one); "clear" withdraws
 * the code so no one else can self-enroll. Neither touches existing enrollments.
 * Both are audited: a code is a key to private content.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { error, scope, userId } = await requireContentAdmin();
    if (error) return error;

    const { id } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return ApiErrors.badRequest("Invalid request body");

    const domain = await prisma.domain.findUnique({
      where: { id },
      select: { slug: true, joinCode: true, organizationId: true },
    });
    if (!domain) return ApiErrors.notFound();

    // A code is a key to that subject's content, so it may only be issued, rotated
    // or withdrawn on the merchant's own subjects. 404, not 403: a subject outside
    // the scope must read as non-existent. Gated on ORG because for PLATFORM
    // ownsDomain can only return true — the superadmin's path is unchanged.
    if (scope.kind === "ORG" && !ownsDomain(scope, domain)) return ApiErrors.notFound();

    if (parsed.data.action === "clear") {
      await prisma.domain.update({ where: { id }, data: { joinCode: null } });
      await logAudit({
        action: "DOMAIN_JOIN_CODE_CLEAR",
        performedById: userId,
        targetType: "Domain",
        metadata: { domainId: id, slug: domain.slug, hadCode: domain.joinCode !== null },
      });
      return NextResponse.json({ joinCode: null });
    }

    // Unique column: on the astronomically rare collision, draw again.
    let code = generateJoinCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const clash = await prisma.domain.findUnique({ where: { joinCode: code }, select: { id: true } });
      if (!clash) break;
      code = generateJoinCode();
    }
    await prisma.domain.update({ where: { id }, data: { joinCode: code } });
    await logAudit({
      action: "DOMAIN_JOIN_CODE_ROTATE",
      performedById: userId,
      targetType: "Domain",
      metadata: { domainId: id, slug: domain.slug, replaced: domain.joinCode !== null },
    });
    return NextResponse.json({ joinCode: code, display: formatJoinCode(code) });
  });
}
