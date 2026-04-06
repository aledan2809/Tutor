/**
 * Centralized answer checking logic.
 * Used by session/answer route and exam-engine.
 */

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function checkAnswer(
  question: { type: string; correctAnswer: string; options?: unknown },
  answer: string
): boolean {
  if (question.type === "MULTIPLE_CHOICE") {
    return (
      answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    );
  }

  // OPEN type: normalize whitespace but preserve special characters (e.g. C++)
  return normalize(answer) === normalize(question.correctAnswer);
}
