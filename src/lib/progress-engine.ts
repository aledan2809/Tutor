/**
 * Progress engine — mastery level calculation.
 * Uses weighted average: 70% current accuracy, 30% historical mastery.
 * Capped at 100%.
 */

export function calculateMastery(
  existingMastery: number,
  correctAttempts: number,
  totalAttempts: number,
  isCorrect: boolean
): number {
  const newCorrect = correctAttempts + (isCorrect ? 1 : 0);
  const newTotal = totalAttempts + 1;
  const currentAccuracy = (newCorrect / newTotal) * 100;

  // Weighted average: 70% current running accuracy, 30% prior mastery
  const mastery = 0.7 * currentAccuracy + 0.3 * existingMastery;
  return Math.min(100, Math.round(mastery * 100) / 100);
}

export function initialMastery(isCorrect: boolean): number {
  return isCorrect ? 100 : 0;
}
