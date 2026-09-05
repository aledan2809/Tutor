import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ownsDomain, requireContentAdmin } from "@/lib/merchant-auth";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const itemSchema = z.object({
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
  tags: z.array(z.string()).optional(),
});

const bulkSchema = z.array(itemSchema).min(1).max(500);

async function _POST(req: NextRequest) {
  const { error, scope, userId } = await requireContentAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const items = parsed.data;

  // Every target subject must belong to this admin before a single row is written.
  // The superadmin owns all of them; a merchant admin only his organization's, and
  // a subject outside it reads as missing rather than refused (404, not 403) so he
  // cannot map out which subjects other organizations have. One query, not one per item.
  const domainIds = [...new Set(items.map((item) => item.domainId))];
  const domains = await prisma.domain.findMany({
    where: { id: { in: domainIds } },
    select: { id: true, organizationId: true },
  });
  const byId = new Map(domains.map((d) => [d.id, d]));
  if (domainIds.some((domainId) => !ownsDomain(scope, byId.get(domainId)))) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const results = await prisma.$transaction(
    items.map(({ tags, ...data }) =>
      prisma.question.create({
        data: {
          ...data,
          options: data.options ?? undefined,
          status: "APPROVED",
          source: "MANUAL",
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
        select: { id: true, content: true, domainId: true },
      })
    )
  );

  return NextResponse.json(
    { imported: results.length, questions: results },
    { status: 201 }
  );
}

export const POST = withErrorHandler(_POST);
