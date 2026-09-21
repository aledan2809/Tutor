"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The time left of the free week, ticking: „3z 14:22:05". Stops at the real end of the trial — never
 * restarts on the next visit — and then renders nothing and calls `onEnd` once (the page fetches the
 * prices again, without the offer).
 *
 * Never shows more time than is really left. A device clock that runs behind is corrected with the
 * server's (`serverNow`, when the page was rendered or the data fetched). One that seems to run ahead
 * isn't: the same reading comes from a page restored from history, whose server time is as old as the
 * page, and trusting it would show an offer that has already ended. A clock really ahead ends the count
 * a little early — the safe side — and `onEnd` still runs once, so the page doesn't reload in a loop.
 */
export function TrialCountdown({
  endsAt,
  serverNow,
  locale,
  className,
  onEnd,
}: {
  endsAt: string;
  serverNow: string;
  locale: string;
  className?: string;
  onEnd?: () => void;
}) {
  const offset = useRef(0);
  const endedFor = useRef<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const serverTime = new Date(serverNow).getTime();
    const endTime = new Date(endsAt).getTime();
    if (isNaN(serverTime) || isNaN(endTime)) return;
    offset.current = Math.max(0, serverTime - Date.now());
    const tick = () => {
      const ms = endTime - (Date.now() + offset.current);
      setLeft(ms);
      if (ms <= 0 && endedFor.current !== endsAt) {
        endedFor.current = endsAt;
        onEnd?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, serverNow]);

  if (left === null || left <= 0) return null;
  const total = Math.floor(left / 1000);
  const days = Math.floor(total / 86400);
  const two = (n: number) => String(n).padStart(2, "0");
  const clock = `${two(Math.floor((total % 86400) / 3600))}:${two(Math.floor((total % 3600) / 60))}:${two(total % 60)}`;
  const text = days > 0 ? `${days}${locale === "en" ? "d" : "z"} ${clock}` : clock;
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
      {text}
    </span>
  );
}
