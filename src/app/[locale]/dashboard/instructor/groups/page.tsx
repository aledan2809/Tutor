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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === groups.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(groups.map((g) => g.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selected.size === 0 || !bulkAction) return;
    if (bulkAction === "delete") {
      if (!confirm(t("confirmBulkDelete", { count: selected.size }))) return;
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/dashboard/instructor/groups/${id}`, { method: "DELETE" })
        )
      );
      setGroups((prev) => prev.filter((g) => !selected.has(g.id)));
      setSelected(new Set());
    } else if (bulkAction === "export") {
      // Export selected groups as reports
      const reportData = await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/dashboard/instructor/reports?type=group&id=${id}&format=json`).then(
            (r) => r.json()
          )
        )
      );
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "groups-export.json";
      a.click();
      URL.revokeObjectURL(url);
    }
    setBulkAction("");
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

      {/* Bulk actions bar */}
      {groups.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={selected.size === groups.length && groups.length > 0}
              onChange={toggleAll}
              className="rounded border-gray-600"
            />
            {selected.size > 0
              ? t("selectedCount", { count: selected.size })
              : t("selectAll")}
          </label>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:outline-none"
              >
                <option value="">{t("bulkActions")}</option>
                <option value="delete">{t("bulkDelete")}</option>
                <option value="export">{t("bulkExport")}</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="rounded-lg bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600 disabled:opacity-50"
              >
                {t("apply")}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-500">{t("noGroups")}</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center justify-between rounded-xl border bg-gray-900 p-4 ${
                selected.has(group.id) ? "border-blue-600/50" : "border-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(group.id)}
                  onChange={() => toggleSelect(group.id)}
                  className="rounded border-gray-600"
                />
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
