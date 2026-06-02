import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDomainAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { screenWithFixLoop, type QuestionForMesh } from "@/lib/content-quality-mesh";

/**
 * POST /api/admin/questions/[id]/mesh-fix
 *
 * Attempt to auto-fix a flagged question using the mesh fix→re-verify loop.
 * Max 2 rounds. If still flagged after fix attempts, returns the best result.
 * Human stays in the loop — this only assists, never auto-publishes.
 */
async function _POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const question = await prisma.question.findUnique({
    where: { id },
    select: {
      id: true,
      domainId: true,
      content: true,
      options: true,
      correctAnswer: true,
      explanation: true,
      sourceReference: true,
      meshConfidence: true,
      meshFlags: true,
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await requireDomainAdmin(question.domainId);
  if (error) return error;

  // Build mesh input
  const meshInput: QuestionForMesh = {
    content: question.content,
    options: (question.options as string[]) || undefined,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation || undefined,
    sourceText: question.sourceReference?.startsWith("Source: \"")
      ? question.sourceReference.slice(9, -1)
      : undefined,
  };

  const { result, fixedQuestion, fixRounds } = await screenWithFixLoop(meshInput, 2);

  // Update question with results
  const updateData: Record<string, unknown> = {
    meshConfidence: result.confidence,
    meshFlags: result.flags.length > 0 ? JSON.parse(JSON.stringify(result.flags)) : null,
  };

  // Apply fix if one was generated and improved the score
  if (fixedQuestion && result.confidence > (question.meshConfidence || 0)) {
    updateData.content = fixedQuestion.content;
    if (fixedQuestion.options) updateData.options = fixedQuestion.options;
    if (fixedQuestion.correctAnswer) updateData.correctAnswer = fixedQuestion.correctAnswer;
    if (fixedQuestion.explanation) updateData.explanation = fixedQuestion.explanation;
  }

  await prisma.question.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    fixRounds,
    previousConfidence: question.meshConfidence,
    newConfidence: result.confidence,
    flags: result.flags,
    recommendation: result.recommendation,
    wasFixed: fixedQuestion !== null && result.confidence > (question.meshConfidence || 0),
  });
}

export const POST = withErrorHandler(_POST);
