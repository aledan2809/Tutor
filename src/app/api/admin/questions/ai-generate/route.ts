import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { generateQuestions } from "@/lib/ai-tutor";
import { z } from "zod";

const generateSchema = z.object({
  domainId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  count: z.number().int().min(1).max(20).default(5),
  difficulty: z.number().int().min(1).max(5).default(3),
  type: z.enum(["MULTIPLE_CHOICE", "OPEN"]).default("MULTIPLE_CHOICE"),
  language: z.enum(["en", "ro"]).default("en"),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { domainId, subject, topic, count, difficulty, type, language } = parsed.data;

  // Get domain name
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  try {
    const response = await generateQuestions({
      domain: domain.name,
      subject,
      topic,
      count,
      difficulty,
      type,
      language,
    });

    let generated: Array<{
      content: string;
      options?: string[];
      correctAnswer: string;
      explanation?: string;
    }>;

    try {
      const content = response.content.trim();
      generated = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: response.content },
        { status: 500 }
      );
    }

    if (!Array.isArray(generated) || generated.length === 0) {
      return NextResponse.json({ error: "AI returned empty results" }, { status: 500 });
    }

    // AI-generated content → DRAFT status
    const created = await prisma.question.createMany({
      data: generated.map((q) => ({
        domainId,
        subject,
        topic,
        difficulty,
        type,
        content: q.content,
        options: q.options ? (q.options as string[]) : undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || null,
        source: "AI_GENERATED" as const,
        status: "DRAFT" as const,
        createdById: session!.user.id,
      })),
    });

    return NextResponse.json({
      generated: created.count,
      provider: response.provider,
      model: response.model,
    });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
