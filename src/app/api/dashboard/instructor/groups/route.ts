import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  domainId: z.string().min(1),
  studentIds: z.array(z.string()).optional(),
});

async function _GET(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  const instructorDomainIds = session!.user.enrollments
    .filter((e) =>
      e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  const groups = await prisma.group.findMany({
    where: {
      domainId: domainId ? domainId : { in: instructorDomainIds },
      isActive: true,
    },
    include: {
      domain: { select: { id: true, name: true, slug: true } },
      _count: { select: { members: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      domain: g.domain,
      memberCount: g._count.members,
      createdBy: g.createdBy,
      createdAt: g.createdAt,
    })),
  });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, domainId, studentIds } = parsed.data;

  const group = await prisma.group.create({
    data: {
      name,
      description,
      domainId,
      createdById: session!.user.id,
      members: studentIds?.length
        ? {
            create: studentIds.map((userId) => ({ userId })),
          }
        : undefined,
    },
    include: {
      _count: { select: { members: true } },
      domain: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(group, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
