import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { domainScopeWhere, isPlatform, requireContentAdmin } from "@/lib/merchant-auth";
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
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // The ids arrive from the client, so ownership is enforced in the `where` itself:
  // a merchant admin publishes only rows sitting in his organization's subjects, and
  // ids outside it are left untouched rather than refused (refusing would confirm
  // that someone else's question id exists). The superadmin's filter is unchanged.
  const result = await prisma.question.updateMany({
    where: isPlatform(scope)
      ? { id: { in: parsed.data.ids }, status: "DRAFT" }
      : { id: { in: parsed.data.ids }, status: "DRAFT", domain: domainScopeWhere(scope) },
    data: { status: "PUBLISHED" },
  });

  return NextResponse.json({ published: result.count, requested: parsed.data.ids.length });
}

export const POST = withErrorHandler(_POST);
