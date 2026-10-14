"use client";

import { useEffect, useState } from "react";

/**
 * A fixed bottom bar that steps aside when the page's footer comes into view, so the legal links in it
 * (Confidențialitate / Termeni / Cookie-uri) stay reachable on a phone (/preturi, review 14.10.2026).
 */
export function HideAtFooter({ className, children }: { className: string; children: React.ReactNode }) {
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const footers = Array.from(document.querySelectorAll("footer"));
    if (footers.length === 0 || typeof IntersectionObserver === "undefined") return;
    const seen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      setFooterInView(seen.size > 0);
    });
    footers.forEach((f) => observer.observe(f));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`${className} transition-opacity ${footerInView ? "pointer-events-none opacity-0" : "opacity-100"}`}
      // Hidden = out of the tab order too (React 19 passes `inert` through).
      inert={footerInView}
    >
      {children}
    </div>
  );
}
