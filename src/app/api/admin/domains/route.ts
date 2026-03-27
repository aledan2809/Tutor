import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const domainSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const domains = await prisma.domain.findMany({
    include: {
      _count: { select: { questions: true, enrollments: true } },
      examConfig: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(domains);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = domainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.domain.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A domain with this slug already exists" }, { status: 409 });
  }

  const domain = await prisma.domain.create({
    data: parsed.data,
    include: { _count: { select: { questions: true, enrollments: true } } },
  });

  return NextResponse.json(domain, { status: 201 });
}
