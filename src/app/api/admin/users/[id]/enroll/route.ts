import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { z } from "zod";

const enrollSchema = z.object({
  domainId: z.string().min(1),
  roles: z.array(z.enum(["STUDENT", "WATCHER", "INSTRUCTOR", "ADMIN"])).min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id: userId } = await params;
  const body = await req.json();
  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify domain exists
  const domain = await prisma.domain.findUnique({ where: { id: parsed.data.domainId } });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Upsert enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_domainId: { userId, domainId: parsed.data.domainId },
    },
    update: {
      roles: parsed.data.roles,
      isActive: true,
    },
    create: {
      userId,
      domainId: parsed.data.domainId,
      roles: parsed.data.roles,
    },
    include: {
      domain: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json(enrollment, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id: userId } = await params;
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  if (!domainId) {
    return NextResponse.json({ error: "domainId required" }, { status: 400 });
  }

  await prisma.enrollment.updateMany({
    where: { userId, domainId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
