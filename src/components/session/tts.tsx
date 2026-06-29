"use client";

import { useEffect, useState } from "react";
import { TTS_RATE_DEFAULT, TTS_RATE_OPTIONS, readTtsRate } from "@/lib/tts";

// Re-export the pure helpers so existing call sites can keep importing from
// "./tts" if they prefer; the implementations live in @/lib/tts (testable).
export { speak, readTtsRate, ttsSupported, countAudioQuestions, TTS_RATE_KEY, TTS_RATE_DEFAULT, TTS_RATE_OPTIONS } from "@/lib/tts";

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
      window.localStorage.setItem("tutor-tts-rate", String(r));
      window.speechSynthesis?.cancel();
    }
  };
  return [rate, update];
}

/** Slow / Normal / Fast selector for the read-aloud voice. */
export function TtsSpeedControl({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Viteza vocii">
      <span className="text-xs text-gray-500">Viteză:</span>
      {TTS_RATE_OPTIONS.map((o) => {
        const active = Math.abs(value - o.value) < 0.001;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-md border px-2 py-0.5 text-xs ${
              active
                ? "border-blue-500 bg-blue-500/20 text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
