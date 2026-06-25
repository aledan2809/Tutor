/**
 * First-value engagement signal (client-side, localStorage). Used to defer
 * "chore" prompts (install app / turn on notifications) until the user has
 * actually answered a few questions and felt the product work — exactly how
 * social apps ask for notifications only after you're hooked.
 */
const KEY = "tutor_grile_answered";

/** Show the install/notifications banner only after this many answered questions. */
export const FIRST_VALUE_THRESHOLD = 5;

/** Increment the answered-questions counter; returns the new total. */
export function bumpAnswered(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(localStorage.getItem(KEY) ?? 0) + 1;
    localStorage.setItem(KEY, String(n));
    return n;
  } catch {
    return 0;
  }
}

export function answeredCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(KEY) ?? 0);
  } catch {
    return 0;
  }
}

/** True once the user has answered enough questions to have felt the value. */
export function hasFeltValue(): boolean {
  return answeredCount() >= FIRST_VALUE_THRESHOLD;
}
