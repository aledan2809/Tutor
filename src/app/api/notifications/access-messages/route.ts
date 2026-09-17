import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { ACCESS_MESSAGES_SETTING, accessMessagesOff } from "@/lib/access-messages";

/**
 * GET/PUT /api/notifications/access-messages — the parent's switch for the messages about the free
 * week and the subscription (access-messages.ts). Open while the account is paused: it's a setting.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: ACCESS_MESSAGES_SETTING } },
    select: { value: true },
  });
  return NextResponse.json({ off: accessMessagesOff(row?.value) });
}

const bodySchema = z.object({ off: z.boolean() });

async function _PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  await prisma.setting.upsert({
    where: { userId_key: { userId: session.user.id, key: ACCESS_MESSAGES_SETTING } },
    create: { userId: session.user.id, key: ACCESS_MESSAGES_SETTING, value: { off: parsed.data.off } },
    update: { value: { off: parsed.data.off } },
  });
  return NextResponse.json({ off: parsed.data.off });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
