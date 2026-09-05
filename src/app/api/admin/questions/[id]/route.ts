import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDomainAdmin } from "@/lib/admin-auth";
import { isPlatform, requireContentAdmin, resolveOwnedDomain } from "@/lib/merchant-auth";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const updateSchema = z.object({
  subject: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  type: z.enum(["MULTIPLE_CHOICE", "OPEN"]).optional(),
  content: z.string().min(1).optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1).optional(),
  explanation: z.string().optional(),
  sourceReference: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Who may touch a question that lives in this subject.
 *
 * Superadmin: every subject, unscoped — exactly as before. Merchant admin: only
 * his organization's subjects, and without needing an enrollment on them.
 * Everyone else: the per-domain ADMIN/INSTRUCTOR enrollment gate, unchanged.
 *
 * Returns the refusal to hand back, or null when the caller may proceed.
 */
async function authorizeQuestionDomain(domainId: string) {
  const admin = await requireContentAdmin();
  if (!admin.error) {
    if (isPlatform(admin.scope)) return null;
    const owned = await resolveOwnedDomain(admin.scope, domainId);
    return owned.ok ? null : owned.response;
  }
  const domainGate = await requireDomainAdmin(domainId);
  return domainGate.error;
}

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const question = await prisma.question.findUnique({
    where: { id },
    include: { domain: { select: { name: true, slug: true } }, tags: true, createdBy: { select: { name: true } } },
  });

  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const denied = await authorizeQuestionDomain(question.domainId);
  if (denied) return denied;

  return NextResponse.json(question);
}

async function _PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.question.findUnique({
    where: { id },
    select: { domainId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const denied = await authorizeQuestionDomain(existing.domainId);
  if (denied) return denied;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tags, ...data } = parsed.data;

  const question = await prisma.question.update({
    where: { id },
    data: {
      ...data,
      options: data.options ? data.options : undefined,
      tags: tags
        ? {
            set: [],
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
    include: { domain: { select: { name: true } }, tags: true },
  });

  return NextResponse.json(question);
}

async function _DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.question.findUnique({
    where: { id },
    select: { domainId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const denied = await authorizeQuestionDomain(existing.domainId);
  if (denied) return denied;

  await prisma.question.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
export const PATCH = withErrorHandler(_PUT);
export const DELETE = withErrorHandler(_DELETE);
