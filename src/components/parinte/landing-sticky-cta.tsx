"use client";

import { useEffect, useState } from "react";
import s from "./parent-landing.module.css";

/**
 * The phone-only bottom bar: shows once the first screen is scrolled past, hides again at the final
 * call to action (which has the same buttons). Hidden on desktop by CSS.
 */
export function LandingStickyCta({
  href,
  price,
  sub,
  cta,
  heroId,
  finalId,
}: {
  href: string;
  price: string;
  sub: string;
  cta: string;
  heroId: string;
  finalId: string;
}) {
  const [show, setShow] = useState(false);
  // The floating WhatsApp button (layout) sits bottom-right when a support number is configured.
  const makeRoom = Boolean(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/[^\d]/g, ""));

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const finalSection = document.getElementById(finalId);
    const update = () => {
      if (!hero || !finalSection) return;
      const pastHero = hero.getBoundingClientRect().bottom < 40;
      const r = finalSection.getBoundingClientRect();
      const atFinal = r.top < window.innerHeight * 0.85 && r.bottom > 0;
      setShow(pastHero && !atFinal);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [heroId, finalId]);

  return (
    <div
      className={`${s.sticky} ${show ? s.stickyShow : ""} ${makeRoom ? s.stickyRoomRight : ""}`}
      aria-hidden={!show}
    >
      <div className={s.stickyText}>
        <b>{price}</b>
        <span>{sub}</span>
      </div>
      <a className={s.btn} href={href} tabIndex={show ? 0 : -1}>
        {cta}
      </a>
    </div>
  );
}
