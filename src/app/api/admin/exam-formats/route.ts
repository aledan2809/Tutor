import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireContentAdmin,
  domainScopeWhere,
  ownsDomain,
  resolveOwnedDomain,
} from "@/lib/merchant-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const examFormatSchema = z.object({
  domainId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  timeLimit: z.number().int().min(1).optional(),
  questionCount: z.number().int().min(1).max(200).default(20),
  passingScore: z.number().min(0).max(100).default(75),
  format: z.object({
    type: z.string().default("multiple_choice"),
    optionsCount: z.number().default(4),
    shuffleOptions: z.boolean().default(true),
    shuffleQuestions: z.boolean().default(true),
    showExplanation: z.boolean().default(false),
    subjects: z.array(z.string()).optional(),
    topics: z.array(z.string()).optional(),
    isPlacement: z.boolean().optional(),
    difficultyDistribution: z.object({
      easy: z.number().optional(),
      medium: z.number().optional(),
      hard: z.number().optional(),
    }).optional(),
  }),
});

async function _GET(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  const where: Record<string, unknown> = {};
  if (domainId) where.domainId = domainId;
  // A merchant admin sees only formats attached to its own organization's
  // subjects. PLATFORM adds no filter, so the superadmin's query is unchanged.
  if (scope.kind === "ORG") where.domain = domainScopeWhere(scope);

  const formats = await prisma.examSimulation.findMany({
    where,
    include: {
      domain: { select: { id: true, name: true, slug: true } },
      _count: { select: { examSessions: true } },
    },
    orderBy: [{ domain: { name: "asc" } }, { name: "asc" }],
  });

  const domains = await prisma.domain.findMany({
    where: { isActive: true, ...domainScopeWhere(scope) },
    select: {
      id: true,
      name: true,
      slug: true,
      examConfig: {
        select: {
          questionCount: true,
          timeLimit: true,
          passingScore: true,
          questionTypes: true,
          shuffleQuestions: true,
          shuffleOptions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ formats, domains });
}

async function _POST(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = examFormatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Was: "does this subject exist?". Now also: "is it this admin's?". For
  // PLATFORM the answer is the same one it always was — same 404, same body —
  // because ownership can only fail for a merchant.
  const owned = await resolveOwnedDomain(scope, parsed.data.domainId);
  if (!owned.ok) return owned.response;

  const format = await prisma.examSimulation.create({
    data: {
      domainId: parsed.data.domainId,
      name: parsed.data.name,
      description: parsed.data.description,
      timeLimit: parsed.data.timeLimit,
      questionCount: parsed.data.questionCount,
      passingScore: parsed.data.passingScore,
      format: parsed.data.format,
    },
    include: { domain: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(format, { status: 201 });
}

async function _PUT(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const parsed = examFormatSchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (scope.kind === "ORG") {
    // 404, not 403: a format outside the scope must read as non-existent.
    const existing = await prisma.examSimulation.findUnique({
      where: { id },
      select: { domain: { select: { organizationId: true } } },
    });
    if (!existing || !ownsDomain(scope, existing.domain)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // The update below does not write domainId, so a format cannot be moved
    // between subjects today. Validated anyway, so that adding that field later
    // cannot silently open a way out of the organization.
    if (parsed.data.domainId) {
      const owned = await resolveOwnedDomain(scope, parsed.data.domainId);
      if (!owned.ok) return owned.response;
    }
  }

  const format = await prisma.examSimulation.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      timeLimit: parsed.data.timeLimit,
      questionCount: parsed.data.questionCount,
      passingScore: parsed.data.passingScore,
      format: parsed.data.format,
    },
    include: { domain: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(format);
}

async function _DELETE(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (scope.kind === "ORG") {
    const existing = await prisma.examSimulation.findUnique({
      where: { id },
      select: { domain: { select: { organizationId: true } } },
    });
    if (!existing || !ownsDomain(scope, existing.domain)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const sessions = await prisma.examSession.count({ where: { formatId: id } });
  if (sessions > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${sessions} exam sessions use this format. Deactivate instead.` },
      { status: 409 }
    );
  }

  await prisma.examSimulation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const PUT = withErrorHandler(_PUT);
export const DELETE = withErrorHandler(_DELETE);
