"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface QuestionOption {
  label: string;
  value: string;
}

interface QuestionData {
  id: string;
  content: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  options?: (QuestionOption | string)[] | null;
  subject: string;
  topic: string;
  difficulty: number;
  imageUrl?: string | null;
  passage?: string | null;
}

interface QuestionRendererProps {
  question: QuestionData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function QuestionRenderer({
  question,
  onAnswer,
  disabled = false,
}: QuestionRendererProps) {
  const t = useTranslations("grile");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [showPassage, setShowPassage] = useState(false);

  // Memory exercise: passage marked "[MEMORIE:N] <stimulus>" → show the stimulus
  // for N seconds, then hide it and reveal the options. (Component is keyed by
  // question id at the call site, so this state resets per question.)
  const memMatch = question.passage?.match(/^\[MEMORIE(?::(\d+))?\]\s*([\s\S]*)$/);
  const isMemory = !!memMatch;
  const memSeconds = memMatch ? Number(memMatch[1] || 8) : 0;
  const stimulus = memMatch ? memMatch[2] : "";

  // Voice/interactive aptitude exercises — the passage marker carries a HIDDEN
  // payload (read aloud / drawn), never shown as text (it holds the answer).
  const audioMatch = question.passage?.match(/^\[AUDIODICT:(\w+)\]\s*([\s\S]*)$/);
  const isAudioDict = !!audioMatch;
  const audioLang = audioMatch && audioMatch[1].toLowerCase() === "en" ? "en-US" : "ro-RO";
  const audioItems = audioMatch ? audioMatch[2].trim().split(/\s+/).filter(Boolean) : [];
  const cubeMatch = question.passage?.match(/^\[CUBEVOICE\]\s*start=([^;]+);\s*moves=([a-zA-Z,]+)/);
  const isCubeVoice = !!cubeMatch;
  const cubeStart = cubeMatch ? cubeMatch[1].trim() : "";
  const cubeMoves = cubeMatch ? cubeMatch[2].split(",").map((s) => s.trim()).filter(Boolean) : [];
  const clockMatch = question.passage?.match(/^\[CLOCK\]\s*(\d{1,2}):(\d{2})/);
  const isClock = !!clockMatch;
  const clockHour = clockMatch ? Number(clockMatch[1]) : 12;
  const clockMin = clockMatch ? Number(clockMatch[2]) : 0;
  const isSpecial = isMemory || isAudioDict || isCubeVoice || isClock;

  const [memLeft, setMemLeft] = useState(memSeconds);
  const memActive = isMemory && memLeft > 0;
  useEffect(() => {
    if (!isMemory || memLeft <= 0) return;
    const id = setTimeout(() => setMemLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [isMemory, memLeft]);

  // Audio dictation (#2) + clock (#4) capture custom input; cube (#3) reads moves aloud.
  const [audioVals, setAudioVals] = useState<string[]>(() => audioItems.map(() => ""));
  const [clockH, setClockH] = useState("");
  const [clockM, setClockM] = useState("");
  const cubeSpeech = `Start on ${cubeStart}. ${cubeMoves.join(". ")}.`;
  // Try to read the cube moves aloud once on mount (a tap on 🔊 replays if the
  // browser blocks auto-speech without a gesture).
  useEffect(() => {
    if (isCubeVoice) speak(cubeSpeech, "en-US", 0.85);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const handleSubmit = () => {
    if (question.type === "MULTIPLE_CHOICE" && selectedOption) {
      onAnswer(selectedOption);
    } else if (question.type === "OPEN" && openAnswer.trim()) {
      onAnswer(openAnswer.trim());
    }
  };

  // Options can be string[] or {label, value}[] — normalize to {label, value}[]
  const rawOptions = question.options;
  const options: QuestionOption[] | null = rawOptions
    ? rawOptions.map((opt) =>
        typeof opt === "string"
          ? { label: opt, value: opt }
          : opt
      )
    : null;

  // Some legacy/AI-generated options stored the answer letter inline ("a) 10 ..."),
  // which double-letters with the A./B./C. the renderer adds. Strip a leading
  // single-letter prefix at DISPLAY time only (the submitted `value` is unchanged,
  // so answer matching against the key is unaffected).
  const displayLabel = (s: string) => s.replace(/^\s*[a-dA-D][).]\s+/, "");

  const metaHeader = (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="rounded bg-gray-800 px-2 py-0.5">{question.subject}</span>
      <span className="rounded bg-gray-800 px-2 py-0.5">{question.topic}</span>
      <span className="rounded bg-gray-800 px-2 py-0.5">
        {"★".repeat(question.difficulty)}
        {"☆".repeat(5 - question.difficulty)}
      </span>
    </div>
  );

  // Memorize phase — show the stimulus big with a countdown; options come after.
  if (memActive) {
    return (
      <div className="space-y-6">
        {metaHeader}
        <div className="rounded-xl border border-blue-700 bg-blue-950/30 p-6 text-center">
          <p className="mb-3 text-sm font-medium text-blue-300">Memorează! ({memLeft}s)</p>
          <p className="whitespace-pre-line text-2xl font-bold tracking-wide text-white">{stimulus}</p>
        </div>
      </div>
    );
  }

  // #2 Audio dictation — robot reads the numbers (no visual); type them back in order.
  if (isAudioDict) {
    const submitAudio = () => {
      const a = audioVals.map((v) => v.trim()).join(" ").trim();
      if (a) onAnswer(a);
    };
    const filled = audioVals.filter((v) => v.trim()).length;
    return (
      <div className="space-y-6">
        {metaHeader}
        <p className="whitespace-pre-line text-lg text-white">{question.content}</p>
        <button
          type="button"
          onClick={() => speak(audioItems.join(", "), audioLang, 0.85)}
          className="rounded-lg border border-blue-700 bg-blue-950/30 px-4 py-2.5 text-sm font-medium text-blue-200 hover:bg-blue-900/40"
        >
          🔊 Ascultă numerele
        </button>
        <div className="flex flex-wrap gap-2">
          {audioItems.map((_, i) => (
            <input
              key={i}
              value={audioVals[i] ?? ""}
              onChange={(e) => {
                const n = [...audioVals];
                n[i] = e.target.value.replace(/[^0-9]/g, "");
                setAudioVals(n);
              }}
              inputMode="numeric"
              maxLength={3}
              disabled={disabled}
              aria-label={`Numărul ${i + 1}`}
              className="w-14 rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-center text-lg text-white focus:border-blue-500 focus:outline-none"
            />
          ))}
        </div>
        <button
          onClick={submitAudio}
          disabled={disabled || filled < audioItems.length}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Answer
        </button>
      </div>
    );
  }

  // #4 Clock — read the analog clock and enter HH:MM (12h).
  if (isClock) {
    const submitClock = () => {
      if (clockH && clockM) onAnswer(`${Number(clockH)}:${clockM}`);
    };
    return (
      <div className="space-y-6">
        {metaHeader}
        <p className="whitespace-pre-line text-lg text-white">{question.content}</p>
        <ClockFace hour={clockHour} minute={clockMin} />
        <div className="flex items-center justify-center gap-2 text-lg">
          <select
            value={clockH}
            onChange={(e) => setClockH(e.target.value)}
            disabled={disabled}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">ora</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="font-bold text-white">:</span>
          <select
            value={clockM}
            onChange={(e) => setClockM(e.target.value)}
            disabled={disabled}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">min</option>
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
              <option key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
        <button
          onClick={submitClock}
          disabled={disabled || !clockH || !clockM}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Answer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question metadata */}
      {metaHeader}

      {/* Reading text (passage-dependent grile) — collapsible drawer. Hidden for
          memory questions (the passage was the stimulus, shown then hidden). */}
      {question.passage && !isSpecial && (
        <div className="rounded-lg border border-gray-700 bg-gray-900/60">
          <button
            type="button"
            onClick={() => setShowPassage((v) => !v)}
            aria-expanded={showPassage}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            <span aria-hidden="true">📖</span>
            {showPassage ? t("hideText") : t("showText")}
            <span aria-hidden="true" className="ml-auto text-gray-500">{showPassage ? "▲" : "▼"}</span>
          </button>
          {showPassage && (
            <div className="max-h-72 overflow-y-auto whitespace-pre-line border-t border-gray-700 px-4 py-3 text-sm leading-relaxed text-gray-300">
              {question.passage}
            </div>
          )}
        </div>
      )}

      {/* Question content (+ read-aloud — voice variant for cube/spatial tasks) */}
      <div className="flex items-start gap-2">
        <p className="flex-1 whitespace-pre-line text-lg text-white">{question.content}</p>
        <SpeakButton text={question.content} />
      </div>

      {/* #3 Cube — replay the dictated start + 6 moves (English); answer = final face below. */}
      {isCubeVoice && (
        <button
          type="button"
          onClick={() => speak(cubeSpeech, "en-US", 0.85)}
          className="rounded-lg border border-blue-700 bg-blue-950/30 px-4 py-2.5 text-sm font-medium text-blue-200 hover:bg-blue-900/40"
        >
          🔊 Ascultă mișcările din nou
        </button>
      )}

      {/* Figure (geometry / chart items) — rendered on a white card so the black line
          drawings stay legible on the dark theme */}
      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt="Figura exercițiului"
          className="mx-auto max-h-[420px] w-auto max-w-full rounded-lg border border-gray-700 bg-white p-2"
        />
      )}

      {/* Multiple choice options */}
      {question.type === "MULTIPLE_CHOICE" && options && (
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => !disabled && setSelectedOption(opt.value)}
              disabled={disabled}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
                selectedOption === opt.value
                  ? "border-blue-500 bg-blue-600/10 text-blue-400"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <span className="mr-3 font-semibold text-gray-500">
                {String.fromCharCode(65 + idx)}.
              </span>
              {displayLabel(opt.label)}
            </button>
          ))}
        </div>
      )}

      {/* Open answer */}
      {question.type === "OPEN" && (
        <textarea
          value={openAnswer}
          onChange={(e) => setOpenAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer..."
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          rows={4}
        />
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={
          disabled ||
          (question.type === "MULTIPLE_CHOICE" && !selectedOption) ||
          (question.type === "OPEN" && !openAnswer.trim())
        }
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit Answer
      </button>
    </div>
  );
}

/** Browser TTS helper. No-op if unsupported. Used by SpeakButton (RO) + the
 *  audio-dictation (EN) and cube (EN) aptitude exercises. */
function speak(text: string, lang = "ro-RO", rate = 0.95) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

/** Read the question aloud (browser TTS, RO). */
function SpeakButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      title="Ascultă întrebarea"
      aria-label="Ascultă întrebarea"
      className="flex-shrink-0 rounded-lg border border-gray-700 px-2 py-1 text-sm text-gray-400 hover:border-gray-500 hover:text-white"
    >
      🔊
    </button>
  );
}

/** Analog clock face drawn at the given 12h time (for the clock-reading exercise). */
function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  const cx = 110, cy = 110, r = 100;
  const minAngle = minute * 6; // deg, 0 = up
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const hand = (angle: number, len: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + len * Math.cos(rad), y: cy + len * Math.sin(rad) };
  };
  const h = hand(hourAngle, 52);
  const m = hand(minAngle, 78);
  const ticks = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg viewBox="0 0 220 220" className="mx-auto h-56 w-56" role="img" aria-label="Ceas analog">
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#1f2937" strokeWidth="4" />
      {ticks.map((i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        const x1 = cx + (r - 10) * Math.cos(a), y1 = cy + (r - 10) * Math.sin(a);
        const x2 = cx + r * Math.cos(a), y2 = cy + r * Math.sin(a);
        const lx = cx + (r - 24) * Math.cos(a), ly = cy + (r - 24) * Math.sin(a);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth={i % 3 === 0 ? 3 : 1.5} />
            <text x={lx} y={ly + 6} textAnchor="middle" fontSize="16" fontWeight="600" fill="#111827">
              {i === 0 ? 12 : i}
            </text>
          </g>
        );
      })}
      <line x1={cx} y1={cy} x2={h.x} y2={h.y} stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={m.x} y2={m.y} stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#111827" />
    </svg>
  );
}
