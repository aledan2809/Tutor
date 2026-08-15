"use client";

import { useEffect, useRef, useState } from "react";

interface QuestionTimerProps {
  /** Budget for THIS question. Changing `questionKey` restarts the countdown. */
  seconds: number;
  /** Identity of the current question — the reset trigger. */
  questionKey: string;
  /** Counting only while true (paused during feedback, while submitting, etc.). */
  active: boolean;
  /** Fired once per question when the budget runs out. */
  onExpire: () => void;
}

/**
 * Per-question countdown for the timed sprint. Distinct from `SessionTimer`,
 * which clocks a whole session: here every question has its own shrinking
 * budget, so the bar restarts on each one and the pressure builds across the run.
 */
export function QuestionTimer({ seconds, questionKey, active, onExpire }: QuestionTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  // One expiry per question, whatever the render timing — a second fire would
  // submit the same question twice.
  const firedFor = useRef<string | null>(null);
  // Which question `remaining` currently describes. Without this, the commit in
  // which `questionKey` has already advanced but `remaining` is still the
  // previous question's 0 looks exactly like "the new question just expired",
  // and the next question gets auto-submitted before it is ever displayed.
  const countingFor = useRef(questionKey);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // New question → new budget.
  useEffect(() => {
    countingFor.current = questionKey;
    setRemaining(seconds);
  }, [questionKey, seconds]);

  // Count DOWN TO A DEADLINE rather than decrementing a counter.
  //
  // `setInterval` is throttled by the browser whenever the tab is not in the
  // foreground, so a decrementing clock runs slow and quietly hands out more
  // time than the budget says — measured here at 37.8s used against a 34s
  // allowance. Deriving what is left from a fixed end-timestamp makes the
  // allowance exact regardless of how often the tick actually fires, and it
  // self-corrects the moment the tab comes back.
  const deadline = useRef<number>(Date.now() + seconds * 1000);
  useEffect(() => {
    deadline.current = Date.now() + seconds * 1000;
  }, [questionKey, seconds]);

  useEffect(() => {
    if (!active) return;
    if (countingFor.current !== questionKey) return;
    if (remaining <= 0) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, remaining, questionKey]);

  // A paused clock (feedback screen) must not keep burning the allowance.
  const pausedAt = useRef<number | null>(null);
  useEffect(() => {
    if (!active) {
      pausedAt.current = Date.now();
    } else if (pausedAt.current !== null) {
      deadline.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
    }
  }, [active]);

  useEffect(() => {
    if (!active || remaining > 0) return;
    // `remaining` must belong to THIS question, not be a leftover zero.
    if (countingFor.current !== questionKey) return;
    if (firedFor.current === questionKey) return;
    firedFor.current = questionKey;
    onExpireRef.current();
  }, [active, remaining, questionKey]);

  const pct = seconds > 0 ? Math.max(0, (remaining / seconds) * 100) : 0;
  const urgent = remaining <= 5;
  const warn = remaining <= Math.max(5, Math.round(seconds * 0.34));

  const barColor = urgent ? "bg-red-500" : warn ? "bg-amber-500" : "bg-emerald-500";
  const textColor = urgent ? "text-red-400" : warn ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="flex items-center gap-3" aria-live="off">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`min-w-[3.5rem] text-right font-mono text-xl font-bold tabular-nums ${textColor} ${
          urgent && active ? "animate-pulse" : ""
        }`}
        // The countdown is decoration for sighted users; the number is what matters.
        aria-label={`${remaining} secunde rămase`}
      >
        {remaining}s
      </span>
    </div>
  );
}
