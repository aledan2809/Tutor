import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
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
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const items = parsed.data;

  // For non-superadmins, verify all domainIds are in their enrolled domains with ADMIN role
  if (!session!.user.isSuperAdmin) {
    const allowedDomainIds = new Set(
      (session!.user.enrollments || [])
        .filter((e: { roles: string[] }) => e.roles.includes("ADMIN"))
        .map((e: { domainId: string }) => e.domainId)
    );
    const unauthorized = items.find((item) => !allowedDomainIds.has(item.domainId));
    if (unauthorized) {
      return NextResponse.json(
        { error: `No ADMIN permission for domainId: ${unauthorized.domainId}` },
        { status: 403 }
      );
    }
  }

  const results = await prisma.$transaction(
    items.map(({ tags, ...data }) =>
      prisma.question.create({
        data: {
          ...data,
          options: data.options ?? undefined,
          status: "APPROVED",
          source: "MANUAL",
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
