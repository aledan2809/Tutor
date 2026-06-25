import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireAdminOrInstructor } from "@/lib/admin-auth";
import { buildFeedbackDetail } from "@/lib/feedback-admin";

/** GET: full admin detail for one feedback (domain-scoped). */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, allowedDomainIds } = await requireAdminOrInstructor();
  if (error) return error;
  const { id } = await params;

  const detail = await buildFeedbackDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Domain scope: a non-superadmin may only view feedback in their domains.
  if (allowedDomainIds !== null) {
    const q = await prisma.question.findUnique({
      where: { id: detail.question.id },
      select: { domainId: true },
    });
    if (!q || !allowedDomainIds.includes(q.domainId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(detail);
}

export const GET = withErrorHandler(_GET);
