import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: a short quiz of real PUBLISHED questions for a chosen subject.
// correctIndex is computed server-side (options + correctAnswer are stored
// clean) so the client can grade the demo without an account — same shape the
// MagicQuiz demo already uses.
const LIMIT = 8;

const strip = (s: string | null | undefined) =>
  (s ?? "").trim().replace(/^[a-d]\)\s*/i, "").toLowerCase();

export async function GET(req: Request) {
  const subject = new URL(req.url).searchParams.get("subject")?.trim();
  if (!subject) {
    return NextResponse.json({ error: "subject required" }, { status: 400 });
  }
  try {
    const rows = await prisma.question.findMany({
      where: { status: "PUBLISHED", type: "MULTIPLE_CHOICE", subject },
      select: { content: true, options: true, correctAnswer: true, explanation: true, topic: true },
    });

    const usable = rows
      .map((q) => {
        const options = Array.isArray(q.options) ? (q.options as string[]) : [];
        const correctIndex = options.findIndex((o) => strip(o) === strip(q.correctAnswer));
        return { content: q.content, options, correctIndex, explanation: q.explanation, topic: q.topic };
      })
      .filter((q) => q.correctIndex >= 0 && q.options.length >= 2);

    // Shuffle so each demo run feels fresh, then take a short quiz.
    for (let i = usable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [usable[i], usable[j]] = [usable[j], usable[i]];
    }

    return NextResponse.json({ subject, questions: usable.slice(0, LIMIT) });
  } catch {
    return NextResponse.json({ subject, questions: [] });
  }
}
