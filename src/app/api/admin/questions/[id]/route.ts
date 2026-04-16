import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const updateSchema = z.object({
  subject: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  type: z.enum(["MULTIPLE_CHOICE", "OPEN"]).optional(),
  content: z.string().min(1).optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1).optional(),
  explanation: z.string().optional(),
  sourceReference: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).optional(),
  tags: z.array(z.string()).optional(),
});

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const question = await prisma.question.findUnique({
    where: { id },
    include: { domain: { select: { name: true, slug: true } }, tags: true, createdBy: { select: { name: true } } },
  });

  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(question);
}

async function _PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tags, ...data } = parsed.data;

  const question = await prisma.question.update({
    where: { id },
    data: {
      ...data,
      options: data.options ? data.options : undefined,
      tags: tags
        ? {
            set: [],
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
    include: { domain: { select: { name: true } }, tags: true },
  });

  return NextResponse.json(question);
}

async function _DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await prisma.question.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
export const DELETE = withErrorHandler(_DELETE);
