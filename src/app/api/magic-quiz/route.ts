import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateQuizFromText,
  MAGIC_MIN_CHARS,
  MAGIC_MAX_CHARS,
} from "@/lib/magic-quiz";

// Public, no-auth Magic Quiz demo endpoint (Faza 0 / Tier 0).
// Strictly rate-limited per IP because it is public and costs AI tokens.

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Global daily cap across ALL IPs — bounds total AI cost if the demo goes viral.
// Soft limit (in-memory rolling 24h, resets on restart); override via env.
const DAILY_CAP = Math.max(1, parseInt(process.env.MAGIC_QUIZ_DAILY_CAP || "1000", 10) || 1000);

async function _POST(req: NextRequest) {
  const ip = clientIp(req);

  // Two-tier throttle: burst (5/min) + sustained (25/hour) per IP.
  const burst = checkRateLimit(`magic-quiz:burst:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  const hourly = checkRateLimit(`magic-quiz:hour:${ip}`, { maxRequests: 25, windowMs: 60 * 60_000 });
  if (!burst.allowed || !hourly.allowed) {
    return NextResponse.json(
      { error: "Prea multe cereri. Încearcă din nou în câteva minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Global daily cost cap (rolling 24h, all IPs). Protects the AI budget under viral load.
  const global = checkRateLimit("magic-quiz:global:day", {
    maxRequests: DAILY_CAP,
    windowMs: 24 * 60 * 60_000,
  });
  if (!global.allowed) {
    console.warn(`[magic-quiz] global daily cap (${DAILY_CAP}) reached — shedding load`);
    return NextResponse.json(
      { error: "Demo-ul e foarte căutat azi. Revino mai târziu sau creează un cont gratuit." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let body: { text?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const language = body.language === "en" ? "en" : "ro";

  if (text.length < MAGIC_MIN_CHARS) {
    return NextResponse.json(
      { error: `Lipește cel puțin ${MAGIC_MIN_CHARS} de caractere de text.` },
      { status: 400 }
    );
  }
  // Guard against oversized payloads (the generator also truncates to MAGIC_MAX_CHARS).
  if (text.length > MAGIC_MAX_CHARS * 4) {
    return NextResponse.json(
      { error: "Textul este prea lung. Lipește o secțiune mai scurtă." },
      { status: 413 }
    );
  }

  try {
    const { questions, provider } = await generateQuizFromText({ text, language });
    return NextResponse.json({ questions, provider, count: questions.length });
  } catch {
    return NextResponse.json(
      { error: "Nu am putut genera întrebări din acest text. Încearcă alt text." },
      { status: 502 }
    );
  }
}

export const POST = withErrorHandler(_POST);
