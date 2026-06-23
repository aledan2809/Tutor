import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const breakInput = z
  .object({
    startDate: z.string().regex(DATE_RE),
    endDate: z.string().regex(DATE_RE),
    label: z.string().max(60).nullable().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, { message: "Intervalul e invalid" });

const toDate = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const toYmd = (d: Date) => d.toISOString().slice(0, 10);

/** GET — list a child's vacation periods (guardian only). */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await prisma.studyBreak.findMany({
    where: { userId: childId },
    orderBy: { startDate: "asc" },
  });
  const breaks = rows.map((b) => ({
    id: b.id,
    startDate: toYmd(b.startDate),
    endDate: toYmd(b.endDate),
    label: b.label,
  }));
  return NextResponse.json({ breaks });
}

/** POST — add a vacation period for the child (guardian only). */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = breakInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const b = await prisma.studyBreak.create({
    data: {
      userId: childId,
      startDate: toDate(parsed.data.startDate),
      endDate: toDate(parsed.data.endDate),
      label: parsed.data.label ?? null,
    },
  });
  return NextResponse.json(
    { break: { id: b.id, startDate: toYmd(b.startDate), endDate: toYmd(b.endDate), label: b.label } },
    { status: 201 }
  );
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
