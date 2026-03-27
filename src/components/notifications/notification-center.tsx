"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function NotificationCenter() {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, offset]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const unread = filter === "unread" ? "&unread=true" : "";
      const res = await fetch(
        `/api/notifications?limit=${limit}&offset=${offset}${unread}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setTotal(data.total);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function deleteNotification(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((t) => t - 1);
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={markAllRead}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            {t("markAllRead")}
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => { setFilter("all"); setOffset(0); }}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          {t("all")}
        </button>
        <button
          onClick={() => { setFilter("unread"); setOffset(0); }}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filter === "unread"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          {t("unread")}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-gray-800 py-12 text-center">
          <p className="text-gray-500">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 transition-colors ${
                n.isRead
                  ? "border-gray-800 bg-gray-900/50"
                  : "border-blue-500/20 bg-blue-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        n.isRead ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500 uppercase">
                      {n.type.replace("escalation_", "").replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-white"
                      title={t("markRead")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-red-400"
                    title={t("delete")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50"
          >
            {t("previous")}
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            {offset + 1}–{Math.min(offset + limit, total)} / {total}
          </span>
          <button
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50"
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}
