"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface GroupEntry {
  id: string;
  name: string;
  description: string | null;
  domain: { id: string; name: string; slug: string };
  memberCount: number;
  createdBy: { id: string; name: string | null };
  createdAt: string;
}

export default function InstructorGroupsPage() {
  const t = useTranslations("instructor");
  const [groups, setGroups] = useState<GroupEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/instructor/groups")
      .then((r) => r.json())
      .then((data) => setGroups(data.groups ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDeleteGroup"))) return;
    await fetch(`/api/dashboard/instructor/groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t("groups")}</h1>
        <Link
          href="/dashboard/instructor/groups/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t("createGroup")}
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-500">{t("noGroups")}</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <div>
                <Link
                  href={`/dashboard/instructor/groups/${group.id}`}
                  className="text-sm font-semibold text-white hover:text-blue-400"
                >
                  {group.name}
                </Link>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>{group.domain.name}</span>
                  <span>
                    {group.memberCount} {t("members")}
                  </span>
                </div>
                {group.description && (
                  <p className="mt-1 text-xs text-gray-400">{group.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/instructor/groups/${group.id}`}
                  className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800"
                >
                  {t("edit")}
                </Link>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="rounded border border-red-800 px-3 py-1 text-xs text-red-400 hover:bg-red-900/20"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
