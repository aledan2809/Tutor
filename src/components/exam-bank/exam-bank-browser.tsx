"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

// Categorie (nivel) → Subcategorie (materie) prin dropdown, ca la Grile — afișează doar
// lucrările materiei selectate, fără listă lungă cu scroll.
export type PaperLite = {
  id: string;
  year: number;
  variant: string;
  items: number;
  maxScore: number;
  timeLimit: number | null;
};
export type SubjectGroup = {
  key: string; // `${level}::${subject}` — valoare unică în dropdown
  level: string;
  levelLabel: string;
  subjectDisplay: string;
  papers: PaperLite[];
};

const LEVEL_BLURB: Record<string, string> = {
  EN_VIII: "Subiecte reale (Evaluarea Națională), corectate după baremul oficial.",
  BAC: "Subiecte reale de Bacalaureat (proba scrisă), corectate după baremul oficial.",
};

export function ExamBankBrowser({ groups }: { groups: SubjectGroup[] }) {
  const [selectedKey, setSelectedKey] = useState<string>(groups[0]?.key ?? "");
  const selected = groups.find((g) => g.key === selectedKey) ?? groups[0];

  // optgroups: ordinea nivelurilor e deja dată de `groups` (server o trimite sortată)
  const levels: { level: string; levelLabel: string }[] = [];
  for (const g of groups) {
    if (!levels.some((l) => l.level === g.level)) levels.push({ level: g.level, levelLabel: g.levelLabel });
  }

  if (!selected) return null;

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm text-gray-400">Categorie · Materie</label>
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          {levels.map((lvl) => (
            <optgroup key={lvl.level} label={lvl.levelLabel}>
              {groups
                .filter((g) => g.level === lvl.level)
                .map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.subjectDisplay} ({g.papers.length})
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {LEVEL_BLURB[selected.level] ? (
          <p className="mt-2 text-xs text-gray-500">{LEVEL_BLURB[selected.level]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-blue-300">
          {selected.levelLabel} · {selected.subjectDisplay}
        </h3>
        {selected.papers.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/exam-bank/${p.id}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-blue-500 hover:bg-gray-700"
          >
            <div>
              <h4 className="text-base font-semibold text-white">
                {p.year} <span className="font-normal capitalize text-gray-400">· {p.variant}</span>
              </h4>
              <p className="text-xs text-gray-500">
                {p.items} întrebări · {p.maxScore}p{p.timeLimit ? ` · ${p.timeLimit} min` : ""}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Începe simularea
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
