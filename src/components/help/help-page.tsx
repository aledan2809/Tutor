"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { HelpRole, HelpSection } from "@/content/help";

const ROLES: HelpRole[] = ["student", "parent", "meditator"];

/**
 * All three roles stay selectable, whatever the reader's own role is: a parent
 * who also studies, or one setting up their child's account, needs to read the
 * other side. The tab that opens is the one matching their account.
 */
export function HelpPage({
  content,
  defaultRole,
  telegramHref,
}: {
  content: Record<HelpRole, HelpSection[]>;
  defaultRole: HelpRole;
  telegramHref: string;
}) {
  const t = useTranslations("help");
  const [role, setRole] = useState<HelpRole>(defaultRole);

  // A HowItWorks block links to /dashboard/ajutor#alerte — land on the section.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const owner = ROLES.find((r) => content[r].some((s) => s.id === id));
    if (owner) setRole(owner);
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ block: "start" })
    );
  }, [content]);

  const tabLabel = { student: t("tabStudent"), parent: t("tabParent"), meditator: t("tabTutor") };

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-white">{t("title")}</h2>
      <p className="mb-4 text-sm text-gray-400">{t("subtitle")}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("tutor:open-setup"))}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          🚀 {t("resumeSetup")}
        </button>
        <Link
          href={telegramHref}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          {t("telegramLink")}
        </Link>
      </div>

      <div role="tablist" aria-label={t("title")} className="mb-5 flex gap-1 border-b border-gray-800">
        {ROLES.map((r, i) => (
          <button
            key={r}
            role="tab"
            type="button"
            aria-selected={role === r}
            tabIndex={role === r ? 0 : -1}
            onClick={() => setRole(r)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const next = (i + (e.key === "ArrowRight" ? 1 : ROLES.length - 1)) % ROLES.length;
              setRole(ROLES[next]);
            }}
            className={`-mb-px inline-flex min-h-[44px] items-center border-b-2 px-4 text-sm font-medium transition ${
              role === r
                ? "border-blue-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tabLabel[r]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {content[role].map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h3 className="mb-2 text-base font-semibold text-white">{s.title}</h3>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mb-2 text-sm leading-relaxed text-gray-300">
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
                {s.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {s.links && (
              <div className="mt-2 flex flex-wrap gap-3">
                {s.links.map((l) => (
                  <Link key={l.href} href={l.href} className="text-sm text-blue-400 hover:text-blue-300">
                    {l.label} →
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
