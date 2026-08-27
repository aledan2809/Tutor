// Pure text-to-speech helpers for session questions (no React/JSX — unit-testable).
// The read-aloud voice (dictation / cube exercises) has a student-controlled
// playback speed, persisted per-device in localStorage — a playback preference
// like volume, not account data. Students reported the voice reading too fast
// even at the slowest preset, so the scale now goes much lower (a slider) AND
// dictated numbers are spoken one-by-one with a real pause between them, so the
// cadence is genuinely slower regardless of how a given voice clamps `rate`.

export const TTS_RATE_KEY = "tutor-tts-rate";
export const TTS_RATE_DEFAULT = 0.6;
export const TTS_RATE_MIN = 0.3;
export const TTS_RATE_MAX = 1.1;
export const TTS_RATE_STEP = 0.05;
// Pause inserted BETWEEN dictated items (ms). Scales inversely with rate so the
// slowest setting also leaves the most time to memorize each number.
export function gapForRate(rate: number): number {
  // rate 0.3 → ~1100ms, 0.6 → ~800ms, 1.0 → ~400ms
  return Math.round(Math.max(300, 1300 - rate * 900));
}

export function readTtsRate(): number {
  if (typeof window === "undefined") return TTS_RATE_DEFAULT;
  const v = Number(window.localStorage.getItem(TTS_RATE_KEY));
  return Number.isFinite(v) && v >= TTS_RATE_MIN && v <= TTS_RATE_MAX ? v : TTS_RATE_DEFAULT;
}

/**
 * Lifecycle hooks for a dictation.
 *
 * They exist so the answer inputs can be LOCKED while the numbers are being
 * read out. Without that, the exercise measures how fast a student can write,
 * not what he can hold in his head — which is the whole point of a memory
 * drill, and was the student's own complaint.
 */
export interface SpeechHooks {
  onStart?: () => void;
  /** Fires once, when the whole sequence has finished, been cut short, or failed. */
  onEnd?: () => void;
}

// Sequence token: bumped on every speak/speakItems/cancel so a stale item-by-item
// sequence (its onend chain) stops itself when something new starts.
let speakSeq = 0;

export function cancelSpeech() {
  speakSeq++;
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

/** Browser TTS, single utterance. No-op if unsupported. */
export function speak(
  text: string,
  lang = "ro-RO",
  rate = 0.95,
  hooks?: SpeechHooks
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    // Never leave a caller that disabled its inputs waiting for an `onEnd` that
    // can no longer come — a memory drill that locks the keyboard forever is
    // worse than one with no voice at all.
    hooks?.onEnd?.();
    return;
  }
  cancelSpeech();
  const mySeq = speakSeq;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const finish = () => { if (mySeq === speakSeq) hooks?.onEnd?.(); };
  u.onend = finish;
  u.onerror = finish;
  hooks?.onStart?.();
  window.speechSynthesis.speak(u);
}

/**
 * Speak a list of items (e.g. dictated numbers) ONE AT A TIME with a real gap
 * between them — far slower/clearer for memorization than one rushed utterance.
 * Each item is its own utterance; the next starts `gapMs` after the previous ends.
 * A new speak()/speakItems()/cancelSpeech() invalidates a running sequence.
 */
export function speakItems(
  items: string[],
  lang = "ro-RO",
  rate = TTS_RATE_DEFAULT,
  gapMs?: number,
  hooks?: SpeechHooks
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    hooks?.onEnd?.();
    return;
  }
  cancelSpeech();
  const mySeq = speakSeq;
  hooks?.onStart?.();
  const gap = gapMs ?? gapForRate(rate);
  let i = 0;
  const next = () => {
    // A superseded sequence must NOT fire onEnd: whoever superseded it has
    // already started its own, and releasing the lock here would unlock the
    // inputs in the middle of the new dictation.
    if (mySeq !== speakSeq) return;
    if (i >= items.length) {
      hooks?.onEnd?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(String(items[i]));
    u.lang = lang;
    u.rate = rate;
    const advance = () => {
      if (mySeq !== speakSeq) return;
      i++;
      setTimeout(next, gap);
    };
    u.onend = advance;
    // A voice that errors mid-list must still advance, or the drill stays
    // locked on a number that will never be spoken.
    u.onerror = advance;
    window.speechSynthesis.speak(u);
  };
  next();
}

/** Whether the browser can speak (used to show/hide TTS controls). */
export function ttsSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

/** How many of these questions are read-aloud (dictation / cube voice). */
export function countAudioQuestions(questions: { passage?: string | null }[]): number {
  return questions.filter((q) => !!q.passage && /\[(AUDIODICT|CUBEVOICE)/.test(q.passage!)).length;
}
