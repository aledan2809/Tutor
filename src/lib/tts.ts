// Pure text-to-speech helpers for session questions (no React/JSX — unit-testable).
// The read-aloud voice (dictation / cube exercises) has a student-controlled
// playback speed, persisted per-device in localStorage — a playback preference
// like volume, not account data. Surfaced because students reported the voice
// reading too fast.

export const TTS_RATE_KEY = "tutor-tts-rate";
export const TTS_RATE_DEFAULT = 0.85;
export const TTS_RATE_OPTIONS: { label: string; value: number }[] = [
  { label: "🐢 Lent", value: 0.6 },
  { label: "Normal", value: 0.85 },
  { label: "🐇 Rapid", value: 1.05 },
];

export function readTtsRate(): number {
  if (typeof window === "undefined") return TTS_RATE_DEFAULT;
  const v = Number(window.localStorage.getItem(TTS_RATE_KEY));
  return Number.isFinite(v) && v >= 0.4 && v <= 1.3 ? v : TTS_RATE_DEFAULT;
}

/** Browser TTS. No-op if unsupported. */
export function speak(text: string, lang = "ro-RO", rate = 0.95) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

/** Whether the browser can speak (used to show/hide TTS controls). */
export function ttsSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

/** How many of these questions are read-aloud (dictation / cube voice). */
export function countAudioQuestions(questions: { passage?: string | null }[]): number {
  return questions.filter((q) => !!q.passage && /\[(AUDIODICT|CUBEVOICE)/.test(q.passage!)).length;
}
