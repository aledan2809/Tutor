"use client";

import { useEffect, useState, useRef } from "react";

interface SessionTimerProps {
  durationSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export function SessionTimer({
  durationSeconds,
  onTimeUp,
  isPaused = false,
}: SessionTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep ref in sync without causing effect re-runs
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (isPaused || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percentage = (remaining / durationSeconds) * 100;

  const color =
    percentage > 50
      ? "text-green-400"
      : percentage > 25
        ? "text-yellow-400"
        : "text-red-400";

  const barColor =
    percentage > 50
      ? "bg-green-500"
      : percentage > 25
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-mono text-lg font-bold ${color}`}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
