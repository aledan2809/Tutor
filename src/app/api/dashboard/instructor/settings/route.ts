import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const settingsSchema = z.object({
  notifyOnStudentInactivity: z.boolean().optional(),
  notifyOnLowScores: z.boolean().optional(),
  notifyOnStreakBreak: z.boolean().optional(),
  inactivityThresholdDays: z.number().int().min(1).max(30).optional(),
  lowScoreThreshold: z.number().min(0).max(100).optional(),
  emailNotifications: z.boolean().optional(),
  dashboardRefreshInterval: z.number().int().min(30).max(3600).optional(),
});

async function _GET() {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const settings = await prisma.setting.findMany({
    where: {
      userId: session!.user.id,
      key: { startsWith: "instructor_" },
    },
  });

  const settingsMap: Record<string, unknown> = {};
  for (const s of settings) {
    settingsMap[s.key.replace("instructor_", "")] = s.value;
  }

  return NextResponse.json({
    settings: {
      notifyOnStudentInactivity: settingsMap.notifyOnStudentInactivity ?? true,
      notifyOnLowScores: settingsMap.notifyOnLowScores ?? true,
      notifyOnStreakBreak: settingsMap.notifyOnStreakBreak ?? true,
      inactivityThresholdDays: settingsMap.inactivityThresholdDays ?? 3,
      lowScoreThreshold: settingsMap.lowScoreThreshold ?? 50,
      emailNotifications: settingsMap.emailNotifications ?? true,
      dashboardRefreshInterval: settingsMap.dashboardRefreshInterval ?? 300,
    },
  });
}

async function _PUT(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session!.user.id;

  // Upsert each setting
  const updates = Object.entries(parsed.data).filter(
    ([, v]) => v !== undefined
  );

  await Promise.all(
    updates.map(([key, value]) =>
      prisma.setting.upsert({
        where: { userId_key: { userId, key: `instructor_${key}` } },
        create: { userId, key: `instructor_${key}`, value: value as never },
        update: { value: value as never },
      })
    )
  );

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
