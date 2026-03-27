import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}
