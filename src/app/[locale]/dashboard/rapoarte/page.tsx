"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProgressTabs } from "@/components/progress-tabs";
import { HowItWorks } from "@/components/ui/how-it-works";
import { HOW_IT_WORKS } from "@/content/help";
import { useLocale } from "next-intl";

/**
 * The progress report, on demand.
 *
 * It existed only as a scheduled message, which meant nobody could ask for it
 * and nobody could compare it with anything. Two consequences shaped this page:
 * the period IN PROGRESS is shown even though its message has not been sent, and
 * the previous five are recomputed rather than read back from what was delivered.
 *
 * The student opens the same page as the parent and sees his own — so he knows
 * how he stands before he is asked about it, instead of hearing it first from a
 * parent quoting a message he never saw.
 */

interface Metric {
  section: string;
  label: string;
  value: number | null;
  display: string;
  higherIsBetter: boolean;
}
interface Delta extends Metric {
  previous: number | null;
  delta: number | null;
  direction: "better" | "worse" | "same" | "unknown";
}
interface Payload {
  period: "daily" | "weekly";
  childId: string;
  children: { id: string; name: string | null }[];
  childName: string;
  conclusion: string;
  current: { label: string; metrics: Metric[] } | null;
  deltas: Delta[];
  history: { label: string; hasActivity: boolean; metrics: Metric[] }[];
}

const ARROW: Record<Delta["direction"], string> = {
  better: "▲",
  worse: "▼",
  same: "=",
  unknown: "",
};
const TONE: Record<Delta["direction"], string> = {
  better: "text-emerald-400",
  worse: "text-amber-400",
  same: "text-gray-500",
  unknown: "text-gray-600",
};

export default function ReportsPage() {
  const locale = useLocale();
  const { data: session } = useSession();
  // A parent has no Statistici/Realizari in their own menu, so those tabs would be
  // dead ends for them.
  const isLearner = !!session?.user?.enrollments?.some((e) =>
    (e.roles as unknown as string[]).includes("STUDENT")
  );

  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [childId, setChildId] = useState<string>("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // The report email links straight to a specific child.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("childId");
    if (q) setChildId(q);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({ period });
      if (childId) qs.set("childId", childId);
      const r = await fetch(`/api/reports/trend?${qs.toString()}`);
      if (!r.ok) throw new Error(String(r.status));
      setData(await r.json());
    } catch {
      setErr("Nu am putut încărca raportul.");
    } finally {
      setLoading(false);
    }
  }, [period, childId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <ProgressTabs showStudentTabs={isLearner} />
      <h2 className="mb-1 mt-4 text-xl font-bold text-white">
        Raport de progres{!isLearner && data?.childName ? ` — ${data.childName}` : ""}
      </h2>
      <p className="mb-4 text-sm text-gray-400">
        Perioada în curs — chiar dacă raportul ei nu a fost încă trimis — și cum arată
        față de ultimele cinci.
      </p>

      {data && data.children.length > 1 && (
        <div className="mb-3">
          <label className="mr-2 text-sm text-gray-400" htmlFor="child">
            Copil
          </label>
          <select
            id="child"
            value={data.childId}
            onChange={(e) => setChildId(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white"
          >
            {data.children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? "Copil"}
              </option>
            ))}
          </select>
        </div>
      )}

      <HowItWorks storageKey="rapoarte" steps={HOW_IT_WORKS.rapoarte[locale as "ro" | "en"].steps} moreHref={`/dashboard/ajutor#${HOW_IT_WORKS.rapoarte[locale as "ro" | "en"].more}`} />

      <div className="mb-5 flex gap-2 text-sm">
        {([
          ["daily", "Zilnic"],
          ["weekly", "Săptămânal"],
        ] as const).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setPeriod(k)}
            className={`rounded px-3 py-1 ${
              period === k ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Se încarcă…</p>}
      {err && <p className="text-amber-400">{err}</p>}

      {data && !loading && (
        <>
          <section className="mb-5 rounded-xl border-2 border-blue-700 bg-blue-950/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-300">
              {data.current?.label ?? "Perioada în curs"}
            </p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.deltas.map((d) => (
                <div key={d.section} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                  <dd className="text-lg font-bold text-white">{d.display}</dd>
                  <dt className="text-[11px] text-gray-500">{d.label}</dt>
                  <p className={`mt-1 text-xs ${TONE[d.direction]}`}>
                    {d.direction === "unknown"
                      ? "fără termen de comparație"
                      : d.direction === "same"
                        ? "= la fel ca înainte"
                        : `${ARROW[d.direction]} ${d.delta && d.delta > 0 ? "+" : ""}${d.delta} față de perioada trecută`}
                  </p>
                </div>
              ))}
            </dl>
          </section>

          <section className="mb-5 rounded-xl border border-gray-700 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-white">Concluzie</h3>
            <p className="text-sm text-gray-300">{data.conclusion}</p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-white">Ultimele perioade</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
                    <th className="py-2 pr-3">Perioadă</th>
                    {(data.current?.metrics ?? []).map((m) => (
                      <th key={m.section} className="py-2 pr-3">
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((h) => (
                    <tr key={h.label} className="border-b border-gray-800/60">
                      <td className="py-2 pr-3 text-gray-300">{h.label}</td>
                      {h.hasActivity ? (
                        h.metrics.map((m) => (
                          <td key={m.section} className="py-2 pr-3 text-gray-400">
                            {m.display}
                          </td>
                        ))
                      ) : (
                        <td
                          colSpan={(data.current?.metrics ?? []).length}
                          className="py-2 pr-3 text-gray-600"
                        >
                          fără activitate
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
