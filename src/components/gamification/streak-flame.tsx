"use client";

/**
 * StreakFlame — a discrete flame that grows with the correct-answer streak.
 *
 * Reuse of the Procu "fire" idea but deliberately *more discrete*: it starts as a
 * small ember at streak 2 and intensifies (size, glow, flicker speed, colour) as the
 * streak climbs, instead of bursting. Pure CSS (styled-jsx) — no deps, no global CSS.
 *
 * Tiers (by streak):
 *   2–3  ember     · 4–6 flame · 7–9 blaze · 10+ inferno (blue-hot tip)
 */

interface StreakFlameProps {
  /** Consecutive correct answers this session. */
  streak: number;
}

type Tier = { min: number; scale: number; speed: number; hot: boolean };

const TIERS: Tier[] = [
  { min: 10, scale: 1.55, speed: 0.55, hot: true },
  { min: 7, scale: 1.3, speed: 0.7, hot: false },
  { min: 4, scale: 1.12, speed: 0.85, hot: false },
  { min: 2, scale: 0.92, speed: 1.05, hot: false },
];

export function StreakFlame({ streak }: StreakFlameProps) {
  if (streak < 2) return null;
  const tier = TIERS.find((t) => streak >= t.min) ?? TIERS[TIERS.length - 1];

  return (
    <span
      className="streak-flame"
      style={{ ["--flame-scale" as string]: tier.scale, ["--flame-speed" as string]: `${tier.speed}s` }}
      aria-hidden="true"
    >
      <span className="streak-flame__body" />
      {tier.hot && <span className="streak-flame__core" />}

      <style jsx>{`
        .streak-flame {
          position: relative;
          display: inline-block;
          width: 16px;
          height: 20px;
          transform: scale(var(--flame-scale));
          transform-origin: bottom center;
          filter: drop-shadow(0 0 calc(4px * var(--flame-scale)) rgba(249, 115, 22, 0.65));
          will-change: transform;
        }
        .streak-flame__body,
        .streak-flame__core {
          position: absolute;
          left: 50%;
          bottom: 0;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          transform: translateX(-50%) rotate(-45deg);
        }
        .streak-flame__body {
          width: 14px;
          height: 18px;
          background: radial-gradient(
            ellipse at 50% 75%,
            #fde047 0%,
            #fb923c 45%,
            #ef4444 80%,
            rgba(239, 68, 68, 0) 100%
          );
          animation: streak-flicker var(--flame-speed) ease-in-out infinite alternate;
        }
        .streak-flame__core {
          width: 6px;
          height: 9px;
          bottom: 2px;
          background: radial-gradient(ellipse at 50% 70%, #fff 0%, #93c5fd 60%, rgba(147, 197, 253, 0) 100%);
          animation: streak-flicker calc(var(--flame-speed) * 0.7) ease-in-out infinite alternate;
        }
        @keyframes streak-flicker {
          0% {
            transform: translateX(-50%) rotate(-45deg) scaleY(1) scaleX(1);
            opacity: 0.92;
          }
          50% {
            transform: translateX(-52%) rotate(-45deg) scaleY(1.12) scaleX(0.94);
            opacity: 1;
          }
          100% {
            transform: translateX(-48%) rotate(-45deg) scaleY(0.96) scaleX(1.05);
            opacity: 0.96;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .streak-flame__body,
          .streak-flame__core {
            animation: none;
          }
        }
      `}</style>
    </span>
  );
}
