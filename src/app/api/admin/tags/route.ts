import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

async function _GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}

const tagSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.enum(["domain", "subject", "topic", "general"]).default("general"),
});

async function _POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  }

  const tag = await prisma.tag.create({
    data: parsed.data,
    include: { _count: { select: { questions: true } } },
  });

  return NextResponse.json(tag, { status: 201 });
}

async function _DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Tag id required" }, { status: 400 });
  }

  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const DELETE = withErrorHandler(_DELETE);
