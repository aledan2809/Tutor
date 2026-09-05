"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";

interface Domain {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  _count: { questions: number; enrollments: number };
  examConfig: { questionCount: number; timeLimit: number | null } | null;
}

export function DomainList({ domains }: { domains: Domain[] }) {
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete domain "${name}"? This will also delete all associated questions.`)) return;
    await fetch(`/api/admin/domains/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Domains ({domains.length})</h2>
        <Link
          href="/dashboard/admin/domains/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Domain
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {domains.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-gray-800 bg-gray-900 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{d.name}</h3>
                <p className="text-xs text-gray-500">/{d.slug}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    d.isActive
                      ? "bg-green-900/50 text-green-400"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {d.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    d.visibility === "PUBLIC"
                      ? "bg-blue-900/50 text-blue-300"
                      : "bg-amber-900/40 text-amber-300"
                  }`}
                  title={
                    d.visibility === "PUBLIC"
                      ? "Listed to everyone; anyone can enroll"
                      : "Invisible unless enrolled by an admin or via access code"
                  }
                >
                  {d.visibility === "PUBLIC" ? "Public" : "Private"}
                </span>
              </div>
            </div>

            {d.description && (
              <p className="mt-2 text-sm text-gray-400 line-clamp-2">{d.description}</p>
            )}

            <div className="mt-4 flex gap-4 text-xs text-gray-500">
              <span>{d._count.questions} questions</span>
              <span>{d._count.enrollments} enrollments</span>
              {d.examConfig && (
                <span>
                  Exam: {d.examConfig.questionCount}q
                  {d.examConfig.timeLimit ? ` / ${d.examConfig.timeLimit}min` : ""}
                </span>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href={`/dashboard/admin/domains/${d.id}`}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(d.id, d.name)}
                className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {domains.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-12">
            No domains yet. Create your first domain to get started.
          </p>
        )}
      </div>
    </div>
  );
}
