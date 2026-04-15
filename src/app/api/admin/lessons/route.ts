import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const lessonSchema = z.object({
  domainId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).default(1),
  order: z.number().int().default(0),
  isPublished: z.boolean().default(false),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[îï]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

async function _GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  const where: Record<string, unknown> = {};
  if (domainId) where.domainId = domainId;

  const lessons = await prisma.lesson.findMany({
    where,
    include: {
      domain: { select: { id: true, name: true, slug: true } },
      _count: { select: { progress: true } },
    },
    orderBy: [{ subject: "asc" }, { topic: "asc" }, { order: "asc" }],
  });

  const domains = await prisma.domain.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ lessons, domains });
}

async function _POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const baseSlug = slugify(data.title);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.lesson.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const lesson = await prisma.lesson.create({
    data: { ...data, slug },
    include: { domain: { select: { id: true, name: true } } },
  });

  return NextResponse.json(lesson, { status: 201 });
}

async function _PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const parsed = lessonSchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await prisma.lesson.update({
    where: { id },
    data: parsed.data,
    include: { domain: { select: { id: true, name: true } } },
  });

  return NextResponse.json(lesson);
}

async function _DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const PUT = withErrorHandler(_PUT);
export const DELETE = withErrorHandler(_DELETE);
