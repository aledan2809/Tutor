"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface AuditRow {
  id: string;
  action: string;
  targetUserId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  performedBy: { name: string | null; email: string | null };
}

export function AuditLog() {
  const t = useTranslations("admin");
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = page) => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit?page=${p}`);
    const data = await res.json();
    setLogs(data.logs);
    setTotalPages(data.totalPages);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const actionColor = (action: string) => {
    if (action.includes("BAN")) return "text-red-400";
    if (action.includes("UNBAN")) return "text-green-400";
    if (action.includes("IMPERSONATE")) return "text-yellow-400";
    if (action.includes("VOUCHER")) return "text-purple-400";
    return "text-blue-400";
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-gray-400">{t("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Performed By</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900/50">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 font-medium ${actionColor(log.action)}`}>
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {log.performedBy.name || log.performedBy.email}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {log.targetType}{log.targetUserId ? `: ${log.targetUserId.slice(0, 8)}...` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No audit logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => { setPage(page - 1); fetchLogs(page - 1); }}
            disabled={page <= 1}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-400">{page} / {totalPages}</span>
          <button
            onClick={() => { setPage(page + 1); fetchLogs(page + 1); }}
            disabled={page >= totalPages}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
