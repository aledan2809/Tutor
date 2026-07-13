"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Reveals its children once (and stays revealed) when scrolled into view.
// Respects prefers-reduced-motion by showing immediately.
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      {children}
    </div>
  );
}

type Beat = { q: string; a: string };

type Copy = {
  kicker: string;
  intro: string;
  answerPrefix: string;
  beats: Beat[];
  ctaLead: string;
  ctaSub: string;
  ctaButton: string;
  ctaPayNote: string;
};

const RO: Copy = {
  kicker: "Hai să fim sinceri",
  intro: "Hai să vorbim despre ce te frământă cu adevărat — nu despre funcții, ci despre copilul tău:",
  answerPrefix: "Uite ce face TUTOR: ",
  beats: [
    {
      q: "Copilul stă o oră „la învățat”. Dar tu știi dacă a învățat ceva sau doar a stat cu manualul deschis?",
      a: "Vezi negru pe alb: câte exerciții a făcut azi, la ce capitol și unde a greșit. Nu mai presupui, nu mai ghicești.",
    },
    {
      q: "Plătești meditații lună de lună. Dar de unde știi că lecțiile chiar prind — că progresează, nu doar că „a fost prezent”?",
      a: "La pachetul cu meditator inclus, meditatorul vede greșelile copilului și poate să lucreze exact pe ele. Tu vezi progresul confirmat — meditatorul „repară”, tu nu trăiești doar cu o speranță.",
    },
    {
      q: "De obicei afli că n-a înțeles un capitol abia la teză — când e prea târziu. Cum ar fi să afli din prima zi?",
      a: "Dacă nu-și face testele sau se împotmolește, primești un semnal pe WhatsApp — la timp. Iar duminica ai un raport scurt cu ce a lucrat și unde stă.",
    },
  ],
  ctaLead: "Iar toate astea la prețul unei cafele.",
  ctaSub: "Începe gratuit 7 zile, ca să te convingi. Vezi cu ochii tăi dacă progresează — fără card. Fiecare zi în care nu știi stadiul copilului tău este o zi pierdută.",
  ctaButton: "Începe proba gratuită",
  ctaPayNote: "Sau alegi un plan PROMOȚIONAL chiar acum și pornesc chiar imediat reminderele + rapoartele.",
};

const EN: Copy = {
  kicker: "Let's be honest",
  intro: "Let's talk about what actually keeps you up at night — not features, your child:",
  answerPrefix: "Here's what TUTOR does: ",
  beats: [
    {
      q: "Your child sits an hour „studying”. But do you know they learned anything — or just kept the book open?",
      a: "With Tutor you see it in black and white: how many questions they did today, on which topic, and where they got it wrong. No more guessing.",
    },
    {
      q: "You pay for tutoring every month. But how do you know the lessons stick — that they're progressing, not just „showing up”?",
      a: "On the plan with a tutor, the tutor also sees your child's mistakes and works exactly on those. You see confirmed progress — the tutor becomes the proof, not a hope.",
    },
    {
      q: "You usually find out they didn't get a topic only at the test — too late. What if you knew on day one?",
      a: "If they skip their tests or get stuck, you get a WhatsApp nudge — in time. And every Sunday you get a short report of what they worked on and where they stand.",
    },
  ],
  ctaLead: "And all of it for less than a single extra tutoring session.",
  ctaSub: "Start free for 7 days. In the first week you'll see for yourself whether they're progressing — no card. Every day you don't know where they stand is a day lost.",
  ctaButton: "Start the free trial",
  ctaPayNote: "Or pick a PROMO plan now and the nudges + reports start today.",
};

export function ParentFunnel({ lp }: { lp: "ro" | "en" }) {
  const c = lp === "en" ? EN : RO;

  return (
    <section className="mt-16">
      {/* Without JS the scroll-reveal can't fire, so force the content visible. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      {/* Parent in the centre of attention */}
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-5xl" aria-hidden>
            👨‍👩‍👧
          </span>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-blue-400">{c.kicker}</p>
          <p className="mt-2 text-xl font-semibold text-gray-100">{c.intro}</p>
        </div>
      </Reveal>

      <div className="mx-auto mt-10 max-w-2xl space-y-8">
        {c.beats.map((b, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="relative rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
              {/* The parent's worry, in their own voice */}
              <p className="text-lg font-semibold leading-snug text-white">{b.q}</p>
              {/* The answer — what Tutor does */}
              <div className="mt-4 flex gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <span className="text-lg" aria-hidden="true">
                  ✅
                </span>
                <p className="text-sm text-blue-100">
                  <span className="font-semibold text-blue-300">{c.answerPrefix}</span>
                  {b.a}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Funnel CTA */}
      <Reveal delay={120}>
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-500/10 to-transparent p-8 text-center">
          <p className="text-base font-semibold text-white">{c.ctaLead}</p>
          <p className="mt-3 text-sm text-gray-300">{c.ctaSub}</p>
          <Link
            href={`/${lp}/auth/register`}
            className="mt-6 inline-block rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500"
          >
            {c.ctaButton}
          </Link>
          <Link
            href={`/${lp}/preturi`}
            className="mt-3 inline-block text-xs font-semibold text-emerald-400 underline-offset-4 hover:underline"
          >
            {c.ctaPayNote}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
