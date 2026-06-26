import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";

/**
 * GET/PUT /api/family/[childId]/tone — parent control over a child's encouragement tone.
 * Stored as the CHILD's own `toneRestriction` Setting (so the student read-path stays
 * single-user), but writable only by a verified guardian of that child.
 */
async function guard(childId: string) {
  const session = await getSession();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const ok = await isGuardianOf(session.user.id, childId);
  if (!ok) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { userId: session.user.id };
}

async function _GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const g = await guard(childId);
  if (g.error) return g.error;
  const setting = await prisma.setting.findUnique({
    where: { userId_key: { userId: childId, key: "toneRestriction" } },
  });
  const restrictPlayful = (setting?.value as { restrictPlayful?: boolean } | undefined)?.restrictPlayful === true;
  return NextResponse.json({ restrictPlayful });
}

async function _PUT(req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const g = await guard(childId);
  if (g.error) return g.error;
  const { restrictPlayful } = (await req.json()) as { restrictPlayful?: boolean };
  if (typeof restrictPlayful !== "boolean") {
    return NextResponse.json({ error: "restrictPlayful must be boolean" }, { status: 400 });
  }
  await prisma.setting.upsert({
    where: { userId_key: { userId: childId, key: "toneRestriction" } },
    update: { value: { restrictPlayful } },
    create: { userId: childId, key: "toneRestriction", value: { restrictPlayful } },
  });
  return NextResponse.json({ success: true, restrictPlayful });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
