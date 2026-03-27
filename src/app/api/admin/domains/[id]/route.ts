import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const domain = await prisma.domain.findUnique({
    where: { id },
    include: {
      _count: { select: { questions: true, enrollments: true } },
      examConfig: true,
    },
  });

  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(domain);
}

export async function PUT(
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

  const domain = await prisma.domain.update({
    where: { id },
    data: parsed.data,
    include: { _count: { select: { questions: true, enrollments: true } } },
  });

  return NextResponse.json(domain);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await prisma.domain.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
