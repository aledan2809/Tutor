import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const examConfigSchema = z.object({
  questionTypes: z.array(z.enum(["MULTIPLE_CHOICE", "OPEN"])),
  timeLimit: z.number().int().positive().nullable().optional(),
  questionCount: z.number().int().min(1).max(200).default(20),
  passingScore: z.number().min(0).max(100).default(75),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const config = await prisma.examConfig.findUnique({
    where: { domainId: id },
    include: { domain: { select: { name: true } } },
  });

  if (!config) {
    // Return defaults
    return NextResponse.json({
      domainId: id,
      questionTypes: ["MULTIPLE_CHOICE"],
      timeLimit: null,
      questionCount: 20,
      passingScore: 75,
      shuffleQuestions: true,
      shuffleOptions: true,
    });
  }

  return NextResponse.json(config);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = examConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { metadata, ...rest } = parsed.data;
  const data = {
    ...rest,
    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
  };

  const config = await prisma.examConfig.upsert({
    where: { domainId: id },
    update: data,
    create: { domainId: id, ...data },
  });

  return NextResponse.json(config);
}
