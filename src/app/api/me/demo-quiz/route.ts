export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

// Returns the user's most recent claimed demo quiz (lazy-save), or null.
async function _GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const quiz = await prisma.magicQuiz.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, sharerScore: true, total: true, language: true },
  });
  return NextResponse.json({ quiz });
}

export const GET = withErrorHandler(_GET);
