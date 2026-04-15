import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const templateSchema = z.object({
  language: z.string().min(2).max(5).default("ro"),
  channel: z.enum(["whatsapp", "sms", "push", "email"]),
  triggerType: z.string().min(1),
  templateId: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

async function _GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");
  const triggerType = searchParams.get("triggerType");
  const language = searchParams.get("language");

  const where: Record<string, unknown> = {};
  if (channel) where.channel = channel;
  if (triggerType) where.triggerType = triggerType;
  if (language) where.language = language;

  const templates = await prisma.escalationTemplate.findMany({
    where,
    orderBy: [{ channel: "asc" }, { triggerType: "asc" }],
  });

  return NextResponse.json({ templates });
}

async function _POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.escalationTemplate.findUnique({
    where: { templateId: parsed.data.templateId },
  });

  if (existing) {
    return NextResponse.json({ error: "Template with this templateId already exists" }, { status: 409 });
  }

  const template = await prisma.escalationTemplate.create({
    data: parsed.data,
  });

  return NextResponse.json(template, { status: 201 });
}

async function _PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const parsed = templateSchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await prisma.escalationTemplate.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(template);
}

async function _DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.escalationTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const PUT = withErrorHandler(_PUT);
export const DELETE = withErrorHandler(_DELETE);
