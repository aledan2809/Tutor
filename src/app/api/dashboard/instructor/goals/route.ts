import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createGoalSchema = z.object({
  studentId: z.string().min(1),
  domainId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  targetDate: z.string().optional(),
});

const updateGoalSchema = z.object({
  goalId: z.string().min(1),
  isCompleted: z.boolean().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const domainId = searchParams.get("domainId");

  const goals = await prisma.instructorGoal.findMany({
    where: {
      instructorId: session!.user.id,
      ...(studentId ? { studentId } : {}),
      ...(domainId ? { domainId } : {}),
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      domain: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const body = await req.json();
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { studentId, domainId, title, description, targetDate } = parsed.data;

  const goal = await prisma.instructorGoal.create({
    data: {
      instructorId: session!.user.id,
      studentId,
      domainId,
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: studentId,
      type: "goal_set",
      title: "New Goal Set",
      message: `Your instructor set a new goal: ${title}`,
      metadata: { goalId: goal.id, domainId },
    },
  });

  return NextResponse.json(goal, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const body = await req.json();
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { goalId, ...updates } = parsed.data;

  const goal = await prisma.instructorGoal.update({
    where: { id: goalId, instructorId: session!.user.id },
    data: {
      ...(updates.isCompleted !== undefined ? { isCompleted: updates.isCompleted } : {}),
      ...(updates.title ? { title: updates.title } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.targetDate ? { targetDate: new Date(updates.targetDate) } : {}),
    },
  });

  return NextResponse.json(goal);
}
