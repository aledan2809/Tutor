import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { getMagicQuizPublic } from "@/lib/magic-quiz";

// Public duel view: questions WITHOUT correct answers (scoring is server-side).
export const dynamic = "force-dynamic";

async function _GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const quiz = await getMagicQuizPublic(id);
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found or expired" }, { status: 404 });
  }
  return NextResponse.json(quiz);
}

export const GET = withErrorHandler(_GET);
