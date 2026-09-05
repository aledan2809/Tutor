import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrInstructor } from "@/lib/admin-auth";
import {
  domainScopeWhere,
  isPlatform,
  requireContentAdmin,
  resolveOwnedDomain,
} from "@/lib/merchant-auth";
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
  // The superadmin stays unscoped (allowedDomainIds = null, exactly as before).
  // A merchant admin sees his organization's subjects even with no enrollment on
  // them. Anyone else keeps the existing per-domain ADMIN/INSTRUCTOR path.
  const admin = await requireContentAdmin();
  let allowedDomainIds: string[] | null;
  if (admin.error) {
    const instructor = await requireAdminOrInstructor();
    if (instructor.error) return instructor.error;
    allowedDomainIds = instructor.allowedDomainIds;
  } else if (isPlatform(admin.scope)) {
    allowedDomainIds = null;
  } else {
    const orgDomains = await prisma.domain.findMany({
      where: domainScopeWhere(admin.scope),
      select: { id: true },
    });
    allowedDomainIds = orgDomains.map((d) => d.id);
  }

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
  const { error, scope, userId } = await requireContentAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tags, ...data } = parsed.data;

  // The target subject must belong to this admin. The superadmin owns every
  // subject; a merchant admin only his organization's — anything else is a 404,
  // so he cannot discover which subjects other organizations have.
  const owned = await resolveOwnedDomain(scope, data.domainId);
  if (!owned.ok) return owned.response;

  // Manual content gets approved directly
  const status = data.status || (data.source === "MANUAL" ? "APPROVED" : "DRAFT");

  const question = await prisma.question.create({
    data: {
      ...data,
      options: data.options ? data.options : undefined,
      status,
      createdById: userId,
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
