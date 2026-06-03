import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(5000),
});

/**
 * POST /api/admin/questions/bulk-publish
 *
 * Publish a set of DRAFT questions in one call (e.g. all questions of a subject
 * above a confidence threshold the operator chose). Only DRAFT rows are moved to
 * PUBLISHED — already-published/approved rows are untouched. Admin-gated.
 */
async function _POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await prisma.question.updateMany({
    where: { id: { in: parsed.data.ids }, status: "DRAFT" },
    data: { status: "PUBLISHED" },
  });

  return NextResponse.json({ published: result.count, requested: parsed.data.ids.length });
}

export const POST = withErrorHandler(_POST);
