import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeQuizForSave, persistMagicQuiz } from "@/lib/magic-quiz";

// Public: persist a demo quiz so a friend can take the SAME quiz (duel) and so
// the creator can claim it on signup (lazy-save). DB write only, no AI cost,
// but rate-limited because it's public.
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

const DEMO_QUIZ_COOKIE = "tutor_demo_quiz";
const DEMO_QUIZ_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days

async function _POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = checkRateLimit(`magic-quiz-save:${ip}`, { maxRequests: 20, windowMs: 60 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Prea multe cereri. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: { questions?: unknown; language?: unknown; score?: unknown; creatorName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const questions = sanitizeQuizForSave(body.questions);
  if (!questions) {
    return NextResponse.json({ error: "Invalid quiz payload" }, { status: 400 });
  }

  const { id } = await persistMagicQuiz({
    questions,
    language: body.language === "en" ? "en" : "ro",
    sharerScore: typeof body.score === "number" ? body.score : 0,
    creatorName: typeof body.creatorName === "string" ? body.creatorName : null,
  });

  const res = NextResponse.json({ id });
  // Stash for lazy-save: claimed by the register route if the creator signs up.
  res.cookies.set(DEMO_QUIZ_COOKIE, id, {
    path: "/",
    maxAge: DEMO_QUIZ_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
  });
  return res;
}

export const POST = withErrorHandler(_POST);
