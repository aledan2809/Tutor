import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { generateQuestions } from "@/lib/ai-tutor";
import { z } from "zod";
import { SUBJECT_TOPICS } from "@/../prisma/aviation-questions";

const bulkGenerateSchema = z.object({
  subjects: z.array(z.string()).min(1),
  countPerTopic: z.number().int().min(1).max(20).default(10),
  difficulty: z.number().int().min(1).max(5).optional(),
  language: z.enum(["en", "ro"]).default("en"),
});

/**
 * Bulk AI generation for aviation domain — generates questions across
 * multiple subjects/topics in a single request.
 */
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = bulkGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const domain = await prisma.domain.findUnique({ where: { slug: "aviation" } });
  if (!domain) {
    return NextResponse.json({ error: "Aviation domain not found" }, { status: 404 });
  }

  const { subjects, countPerTopic, difficulty, language } = parsed.data;
  const results: { subject: string; topic: string; generated: number; errors?: string }[] = [];
  let totalGenerated = 0;

  for (const subject of subjects) {
    const topics = SUBJECT_TOPICS[subject as keyof typeof SUBJECT_TOPICS];
    if (!topics) {
      results.push({ subject, topic: "*", generated: 0, errors: "Unknown subject" });
      continue;
    }

    for (const topic of topics) {
      // Generate across difficulty levels if not specified
      const difficultyLevels = difficulty ? [difficulty] : [2, 3, 4];
      let topicGenerated = 0;

      for (const diff of difficultyLevels) {
        const perDiff = difficulty ? countPerTopic : Math.ceil(countPerTopic / difficultyLevels.length);

        try {
          const response = await generateQuestions({
            domain: domain.name,
            subject,
            topic,
            count: perDiff,
            difficulty: diff,
            type: "MULTIPLE_CHOICE",
            language,
          });

          let generated: Array<{
            content: string;
            options?: string[];
            correctAnswer: string;
            explanation?: string;
          }>;

          try {
            generated = JSON.parse(response.content.trim());
          } catch {
            results.push({ subject, topic, generated: 0, errors: `AI returned invalid JSON for difficulty ${diff}` });
            continue;
          }

          if (!Array.isArray(generated) || generated.length === 0) continue;

          const created = await prisma.question.createMany({
            data: generated.map((q) => ({
              domainId: domain.id,
              subject,
              topic,
              difficulty: diff,
              type: "MULTIPLE_CHOICE" as const,
              content: q.content,
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || null,
              source: "AI_GENERATED" as const,
              status: "DRAFT" as const,
              createdById: session!.user.id,
            })),
          });

          topicGenerated += created.count;
          totalGenerated += created.count;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          results.push({ subject, topic, generated: topicGenerated, errors: `Generation failed for difficulty ${diff}: ${msg}` });
        }
      }

      if (topicGenerated > 0) {
        results.push({ subject, topic, generated: topicGenerated });
      }
    }
  }

  return NextResponse.json({
    totalGenerated,
    results,
    note: "All AI-generated questions are in DRAFT status and require admin review before publishing.",
  });
}
