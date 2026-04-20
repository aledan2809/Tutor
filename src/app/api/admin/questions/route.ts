import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminOrInstructor } from "@/lib/admin-auth";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const questionSchema = z.object({
  domainId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.number().int().min(1).max(5).default(3),
  type: z.enum(["MULTIPLE_CHOICE", "OPEN"]).default("MULTIPLE_CHOICE"),
  content: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  sourceReference: z.string().nullable().optional(),
  source: z.enum(["MANUAL", "AI_GENERATED"]).default("MANUAL"),
  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).optional(),
  tags: z.array(z.string()).optional(),
});

async function _GET(req: NextRequest) {
  const { error, allowedDomainIds } = await requireAdminOrInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const subject = searchParams.get("subject");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1), 100);

  const where: Record<string, unknown> = {};
  if (allowedDomainIds) where.domainId = { in: allowedDomainIds };
  if (domainId) {
    where.domainId =
      allowedDomainIds && !allowedDomainIds.includes(domainId)
        ? { in: [] }
        : domainId;
  }
  if (status) where.status = status;
  if (source) where.source = source;
  if (subject) where.subject = subject;
  if (difficulty) where.difficulty = parseInt(difficulty);
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      { topic: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: { domain: { select: { name: true, slug: true } }, tags: true, createdBy: { select: { name: true } } },
      orderBy: [{ bookOrder: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.question.count({ where }),
  ]);

  return NextResponse.json({ questions, total, page, limit, totalPages: Math.ceil(total / limit) });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tags, ...data } = parsed.data;

  // Verify user has ADMIN/INSTRUCTOR role in the target domain (superadmins bypass)
  if (!session!.user.isSuperAdmin) {
    const hasRole = session!.user.enrollments?.some(
      (e: { domainId: string; roles: string[] }) =>
        e.domainId === data.domainId &&
        (e.roles.includes("ADMIN") || e.roles.includes("INSTRUCTOR"))
    );
    if (!hasRole) {
      return NextResponse.json(
        { error: "You do not have permission to create questions in this domain" },
        { status: 403 }
      );
    }
  }

  // Manual content gets approved directly
  const status = data.status || (data.source === "MANUAL" ? "APPROVED" : "DRAFT");

  const question = await prisma.question.create({
    data: {
      ...data,
      options: data.options ? data.options : undefined,
      status,
      createdById: session!.user.id,
      tags: tags?.length
        ? {
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
    include: { domain: { select: { name: true } }, tags: true },
  });

  return NextResponse.json(question, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
