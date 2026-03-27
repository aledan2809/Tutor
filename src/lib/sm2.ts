// SM-2 Spaced Repetition Algorithm
// Based on: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

export interface SM2Input {
  quality: number; // 0-5 quality of response (0=complete blackout, 5=perfect)
  easeFactor: number; // current ease factor (min 1.3)
  interval: number; // current interval in days
  repetitions: number; // number of consecutive correct responses
}

export interface SM2Output {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export function sm2(input: SM2Input): SM2Output {
  const { quality, repetitions: reps, interval: prevInterval } = input;
  let { easeFactor } = input;

  let interval: number;
  let repetitions: number;

  if (quality >= 3) {
    // Correct response
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetitions = reps + 1;
  } else {
    // Incorrect response — reset
    interval = 1;
    repetitions = 0;
  }

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview };
}

/**
 * Convert isCorrect + responseTime into SM-2 quality grade (0-5)
 * Fast correct = 5, slow correct = 3, incorrect = 1, very slow incorrect = 0
 */
export function gradeResponse(
  isCorrect: boolean,
  responseTimeMs: number,
  expectedTimeMs: number = 30000
): number {
  if (isCorrect) {
    const ratio = responseTimeMs / expectedTimeMs;
    if (ratio < 0.5) return 5; // very fast
    if (ratio < 1.0) return 4; // normal speed
    return 3; // slow but correct
  } else {
    const ratio = responseTimeMs / expectedTimeMs;
    if (ratio < 1.0) return 2; // quick wrong answer (guessing)
    if (ratio < 2.0) return 1; // thought about it but wrong
    return 0; // took long and still wrong
  }
}
