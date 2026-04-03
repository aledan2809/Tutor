import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const createAdSchema = z.object({
  name: z.string().min(1).max(100),
  slot: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  clickUrl: z.string().url().nullable().optional(),
  priority: z.number().int().min(0).optional(),
});

async function _GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const ads = await prisma.adPlacement.findMany({
    orderBy: [{ slot: "asc" }, { priority: "desc" }],
  });

  return NextResponse.json(ads);
}

async function _POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = createAdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ad = await prisma.adPlacement.create({
    data: {
      name: parsed.data.name,
      slot: parsed.data.slot,
      imageUrl: parsed.data.imageUrl ?? null,
      clickUrl: parsed.data.clickUrl ?? null,
      priority: parsed.data.priority ?? 0,
    },
  });

  return NextResponse.json(ad, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
