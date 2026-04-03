import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const sendMessageSchema = z.object({
  recipientIds: z.array(z.string()).min(1),
  domainId: z.string().optional(),
  channel: z.enum(["in_app", "whatsapp", "sms", "email"]).default("in_app"),
  subject: z.string().optional(),
  content: z.string().min(1),
});

async function _GET(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const messages = await prisma.instructorMessage.findMany({
    where: {
      OR: [
        { senderId: session!.user.id },
        { recipientId: session!.user.id },
      ],
      ...(studentId
        ? {
            OR: [
              { senderId: studentId, recipientId: session!.user.id },
              { recipientId: studentId, senderId: session!.user.id },
            ],
          }
        : {}),
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      recipient: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ messages });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recipientIds, domainId, channel, subject, content } = parsed.data;

  // Create messages for all recipients
  const messages = await Promise.all(
    recipientIds.map((recipientId) =>
      prisma.instructorMessage.create({
        data: {
          senderId: session!.user.id,
          recipientId,
          domainId,
          channel,
          subject,
          content,
        },
      })
    )
  );

  // Create in-app notifications
  await prisma.notification.createMany({
    data: recipientIds.map((recipientId) => ({
      userId: recipientId,
      type: "instructor_message",
      title: subject || "Message from Instructor",
      message: content.slice(0, 200),
      metadata: { senderId: session!.user.id, channel },
    })),
  });

  return NextResponse.json({ messages, count: messages.length }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
