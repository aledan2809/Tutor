import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({
  domainId: z.string().min(1),
  title: z.string().min(1),
  authors: z.string().min(1),
  publisher: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  edition: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  order: z.number().int().default(0),
  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).default("DRAFT"),
});

async function _GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (domainId) where.domainId = domainId;
  if (status) where.status = status;

  const items = await prisma.bibliography.findMany({
    where,
    include: { domain: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const domains = await prisma.domain.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items, domains });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.bibliography.create({
    data: { ...parsed.data, createdBy: session!.user.id },
  });
  return NextResponse.json(item, { status: 201 });
}

async function _PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const parsed = schema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.bibliography.update({ where: { id }, data: parsed.data });
  return NextResponse.json(item);
}

async function _DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.bibliography.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const PUT = withErrorHandler(_PUT);
export const DELETE = withErrorHandler(_DELETE);
