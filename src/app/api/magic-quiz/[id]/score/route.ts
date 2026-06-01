import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { scoreMagicQuiz } from "@/lib/magic-quiz";

// Public: score a duel attempt server-side. The friend's answers come in;
// correct answers + per-question results go back (only after submit).
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

async function _POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = clientIp(req);
  const rl = checkRateLimit(`magic-quiz-score:${ip}`, { maxRequests: 60, windowMs: 60 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Prea multe cereri." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { id } = await ctx.params;

  let body: { answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const answers = Array.isArray(body.answers)
    ? body.answers.map((a) => (typeof a === "number" ? a : -1)).slice(0, 50)
    : null;
  if (!answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }

  const result = await scoreMagicQuiz(id, answers);
  if (!result) {
    return NextResponse.json({ error: "Quiz not found or expired" }, { status: 404 });
  }
  return NextResponse.json(result);
}

export const POST = withErrorHandler(_POST);
