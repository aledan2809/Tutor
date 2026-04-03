import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  addStudentIds: z.array(z.string()).optional(),
  removeStudentIds: z.array(z.string()).optional(),
});

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireInstructor();
  if (error) return error;

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      domain: { select: { id: true, name: true, slug: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireInstructor();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, addStudentIds, removeStudentIds } = parsed.data;

  // Update group name/description
  const group = await prisma.group.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });

  // Add new members
  if (addStudentIds?.length) {
    await prisma.groupMember.createMany({
      data: addStudentIds.map((userId) => ({ groupId: id, userId })),
      skipDuplicates: true,
    });
  }

  // Remove members
  if (removeStudentIds?.length) {
    await prisma.groupMember.deleteMany({
      where: { groupId: id, userId: { in: removeStudentIds } },
    });
  }

  return NextResponse.json(group);
}

async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireInstructor();
  if (error) return error;

  const { id } = await params;

  await prisma.group.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const PATCH = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
