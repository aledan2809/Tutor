"use client";

import { useEffect, useState } from "react";
import { TTS_RATE_DEFAULT, TTS_RATE_MIN, TTS_RATE_MAX, TTS_RATE_STEP, TTS_RATE_KEY, readTtsRate } from "@/lib/tts";

// Re-export the pure helpers so call sites can keep importing from "./tts"; the
// implementations live in @/lib/tts (testable).
export {
  speak,
  speakItems,
  cancelSpeech,
  readTtsRate,
  ttsSupported,
  countAudioQuestions,
  gapForRate,
  TTS_RATE_KEY,
  TTS_RATE_DEFAULT,
  TTS_RATE_MIN,
  TTS_RATE_MAX,
  TTS_RATE_STEP,
} from "@/lib/tts";

/**
 * Student-controlled read-aloud speed. SSR-safe: starts at the default on the
 * server + first render (no hydration mismatch), then syncs the stored value
 * after mount. Setting it persists to localStorage + cancels any current speech.
 */
export function useTtsRate(): [number, (r: number) => void] {
  const [rate, setRate] = useState<number>(TTS_RATE_DEFAULT);
  useEffect(() => {
    setRate(readTtsRate());
  }, []);
  const update = (r: number) => {
    setRate(r);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TTS_RATE_KEY, String(r));
      window.speechSynthesis?.cancel();
    }
  };
  return [rate, update];
}

/**
 * Read-aloud speed slider. A wide, fine scale (0.3–1.1) — the previous 3-button
 * scale didn't go slow enough for students who needed the voice ~2× slower.
 */
export function TtsSpeedControl({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  const pct = Math.round((value / 1) * 100);
  return (
    <div className="flex flex-col gap-1" role="group" aria-label="Viteza vocii">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>🐢 Mai lent</span>
        <span className="text-gray-400">Viteză: {pct}%</span>
        <span>Mai rapid 🐇</span>
      </div>
      <input
        type="range"
        min={TTS_RATE_MIN}
        max={TTS_RATE_MAX}
        step={TTS_RATE_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Viteza vocii"
        className="w-full accent-blue-500"
      />
    </div>
  );
}
