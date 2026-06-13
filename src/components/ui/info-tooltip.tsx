"use client";

import { useId, useState } from "react";

/**
 * Small accessible info tooltip: an ⓘ trigger that reveals explanatory text on
 * hover, keyboard focus, AND tap (mobile, where hover doesn't exist). Rendered
 * as a real <button> so it must NOT be nested inside another interactive element
 * — place it as a sibling/overlay next to clickable cards.
 */
export function InfoTooltip({ text, label = "Info" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-600 text-[11px] leading-none text-gray-400 transition-colors hover:border-gray-400 hover:text-white focus:border-gray-400 focus:text-white focus:outline-none"
      >
        ⓘ
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-30 mb-1.5 w-56 -translate-x-1/2 rounded-lg border border-gray-700 bg-gray-950 p-2.5 text-center text-xs font-normal leading-snug text-gray-200 shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
