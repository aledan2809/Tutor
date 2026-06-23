import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { readFile } from "fs/promises";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import type { DomainAccessUser } from "@/lib/domain-access";
import { canUseLicenta } from "@/lib/licenta";
import { extractAndSegment, generateGrilaFromPassage, type DocFileType } from "@/lib/grila-generate";

// Process a small window of passages per call so a long thesis never exceeds the
// HTTP timeout; the client loops until `done`. Whole-document coverage = every
// passage gets generated across the successive calls.
const BATCH_PASSAGES = 4;
const QUESTIONS_PER_PASSAGE = 4;
const DIFFICULTY = 3;

/** POST /api/licenta/[id]/generate — generate grilă for the next window of passages. */
async function _POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseLicenta(session.user as unknown as DomainAccessUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.licentaDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (doc.status === "ready" || doc.processedPassages >= doc.totalPassages) {
    return NextResponse.json({
      processed: doc.processedPassages,
      total: doc.totalPassages,
      questionCount: doc.questionCount,
      generatedThisBatch: 0,
      done: true,
    });
  }

  // Re-extract (deterministic) and slice the next window.
  let passages;
  try {
    const buffer = await readFile(doc.filePath);
    passages = await extractAndSegment(buffer, doc.fileType as DocFileType);
  } catch (err) {
    await prisma.licentaDocument.update({
      where: { id },
      data: { status: "error", error: `Citire document: ${(err as Error).message}`.slice(0, 500) },
    });
    return NextResponse.json({ error: "Nu am putut reciti documentul." }, { status: 500 });
  }

  const start = doc.processedPassages;
  const window = passages.slice(start, start + BATCH_PASSAGES);

  type Row = {
    content: string;
    options: string[] | undefined;
    correctAnswer: string;
    explanation: string | null;
    sourceReference: string | null;
    topic: string;
    difficulty: number;
  };
  const rows: Row[] = [];
  for (let i = 0; i < window.length; i++) {
    const passage = window[i];
    const topic = passage.title?.trim() || `Secțiunea ${start + i + 1}`;
    try {
      const qs = await generateGrilaFromPassage(passage, QUESTIONS_PER_PASSAGE, DIFFICULTY);
      for (const q of qs) {
        rows.push({
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          sourceReference: q.sourceQuote ? `Sursă: "${q.sourceQuote.substring(0, 500)}"` : null,
          topic,
          difficulty: q.difficulty || DIFFICULTY,
        });
      }
    } catch (err) {
      console.error(`[licenta] generare eșuată pe pasaj ${start + i}:`, (err as Error).message);
    }
  }

  // Termination is based on the ACTUAL re-extracted passages, not just the
  // recorded total: if extraction ever yields fewer passages (e.g. a library
  // bump), an empty/short window still terminates — no infinite loop.
  const advanced = start + window.length;
  const done = window.length === 0 || advanced >= passages.length || advanced >= doc.totalPassages;
  const finalProcessed = done ? doc.totalPassages : advanced;

  // Persist questions (PUBLISHED — private self-study, immediately practiceable)
  // AND advance the document atomically, so a partial failure can't double-create
  // a window. Serializable guards bookOrder allocation against concurrent batches.
  let created = 0;
  let questionCount = doc.questionCount;
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        let count = 0;
        if (rows.length > 0) {
          const maxOrder = await tx.question.aggregate({
            where: { domainId: doc.domainId },
            _max: { bookOrder: true },
          });
          const baseOrder = (maxOrder._max.bookOrder ?? -1) + 1;
          const res = await tx.question.createMany({
            data: rows.map((r, idx) => ({
              domainId: doc.domainId,
              subject: doc.title,
              topic: r.topic,
              difficulty: r.difficulty,
              type: "MULTIPLE_CHOICE" as const,
              content: r.content,
              options: r.options ? (r.options as string[]) : undefined,
              correctAnswer: r.correctAnswer,
              explanation: r.explanation,
              sourceReference: r.sourceReference,
              source: "AI_GENERATED" as const,
              status: "PUBLISHED" as const,
              bookOrder: baseOrder + idx,
              createdById: doc.createdById,
            })),
          });
          count = res.count;
        }
        const upd = await tx.licentaDocument.update({
          where: { id },
          data: {
            processedPassages: finalProcessed,
            questionCount: { increment: count },
            status: done ? "ready" : "processing",
          },
          select: { questionCount: true },
        });
        return { count, questionCount: upd.questionCount };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 }
    );
    created = result.count;
    questionCount = result.questionCount;
  } catch (err) {
    if ((err as { code?: string }).code === "P2034") {
      return NextResponse.json({ error: "Generare concurentă — reîncearcă." }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({
    processed: finalProcessed,
    total: doc.totalPassages,
    questionCount,
    generatedThisBatch: created,
    done,
  });
}

export const POST = withErrorHandler(_POST);
