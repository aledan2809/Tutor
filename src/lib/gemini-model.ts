/**
 * The Gemini text model every fallback in the app calls.
 *
 * It used to be written out in six places as `gemini-2.0-flash`. Google retired that model
 * (404 "no longer available"), so each fallback failed quietly — and on a day Groq's shared daily
 * token limit ran out, everything behind `callTextAI` (the reviewer of student complaints, grilă
 * generation) had no provider left. Measured 2026-09-24: `gemini-2.5-flash` is also closed to this
 * key, `gemini-flash-latest` answers.
 *
 * One name, overridable from `.env` (`GEMINI_TEXT_MODEL`), so the next retirement is a config
 * change, not a code change.
 */
export const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-flash-latest";

export function geminiGenerateUrl(key: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${key}`;
}
