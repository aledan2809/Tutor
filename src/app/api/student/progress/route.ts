import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { awardSessionCompleteXp } from "@/lib/gamification";
import { updateWeakAreas } from "@/lib/session-engine";
import { z } from "zod";

const progressSchema = z.object({
  domainId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  score: z.number().min(0).max(100).optional(),
  totalQuestions: z.number().int().min(0).optional(),
  xpOverride: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { domainId, sessionId, score, totalQuestions, xpOverride } = parsed.data;
  const userId = session.user.id;

  try {
  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId, domainId } },
  });

  if (!enrollment || !enrollment.isActive) {
    return NextResponse.json(
      { error: "Not enrolled in this domain" },
      { status: 403 }
    );
  }

  // Award XP via gamification engine
  let xpResult = null;
  if (score !== undefined && totalQuestions !== undefined) {
    xpResult = await awardSessionCompleteXp(
      userId,
      domainId,
      score,
      totalQuestions
    );
  } else if (xpOverride !== undefined) {
    const gam = await prisma.userGamification.upsert({
      where: { userId_domainId: { userId, domainId } },
      update: { xp: { increment: xpOverride } },
      create: { userId, domainId, xp: xpOverride },
    });
    xpResult = { xpAwarded: xpOverride, newXp: gam.xp, level: gam.level, levelUp: false, newAchievements: [] };
  }

  // Mark session as completed if provided
  if (sessionId) {
    await prisma.session.update({
      where: { id: sessionId, userId },
      data: {
        endedAt: new Date(),
        score: score ?? null,
      },
    });
  }

  // Recalculate weak areas (domain-scoped)
  await updateWeakAreas(userId, domainId);

  // Fetch updated weak areas
  const weakAreas = await prisma.weakArea.findMany({
    where: { userId, domainId },
    orderBy: { errorRate: "desc" },
    take: 10,
  });

  return NextResponse.json({
    success: true,
    xp: xpResult
      ? {
          awarded: xpResult.xpAwarded,
          total: xpResult.newXp,
          level: xpResult.level,
          levelUp: xpResult.levelUp,
          newAchievements: xpResult.newAchievements,
        }
      : null,
    weakAreas: weakAreas.map((w) => ({
      subject: w.subject,
      topic: w.topic,
      errorRate: w.errorRate,
    })),
  });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
