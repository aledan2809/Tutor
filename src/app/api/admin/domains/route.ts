import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireContentAdmin, domainScopeWhere } from "@/lib/merchant-auth";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const domainSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  // Absent = PRIVATE (the column default): a domain nobody chose to publish must not leak.
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

async function _GET() {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const domains = await prisma.domain.findMany({
    // A merchant admin lists only its own organization's subjects. For the
    // superadmin domainScopeWhere returns {}, so this stays the query it was.
    where: domainScopeWhere(scope),
    include: {
      _count: { select: { questions: true, enrollments: true } },
      examConfig: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(domains);
}

async function _POST(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
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
    data: {
      ...parsed.data,
      // A merchant admin's subject is born owned by that merchant and cannot be
      // created anywhere else: organizationId is absent from the schema above, so
      // it cannot be chosen from the body. PLATFORM adds nothing here, so the
      // superadmin keeps creating platform subjects (organizationId null).
      ...(scope.kind === "ORG" ? { organizationId: scope.organizationId } : {}),
      examConfig: {
        create: {
          questionTypes: ["MULTIPLE_CHOICE"],
          questionCount: 20,
          passingScore: 75,
          shuffleQuestions: true,
          shuffleOptions: true,
        },
      },
    },
    include: {
      _count: { select: { questions: true, enrollments: true } },
      examConfig: true,
    },
  });

  return NextResponse.json(domain, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
