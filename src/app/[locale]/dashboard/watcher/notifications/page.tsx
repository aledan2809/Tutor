"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface WatcherNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default function WatcherNotificationsPage() {
  const t = useTranslations("watcher");
  const [notifications, setNotifications] = useState<WatcherNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Classify notification types for styling
  const getTypeStyle = (type: string) => {
    if (type.includes("escalation") || type.includes("alert")) {
      return "border-red-600/30 bg-red-600/5";
    }
    if (type.includes("streak") || type.includes("inactivity")) {
      return "border-yellow-600/30 bg-yellow-600/5";
    }
    if (type.includes("goal") || type.includes("achievement")) {
      return "border-green-600/30 bg-green-600/5";
    }
    return "border-gray-800";
  };

  const getTypeIcon = (type: string) => {
    if (type.includes("escalation") || type.includes("alert")) return "!";
    if (type.includes("streak")) return "~";
    if (type.includes("goal")) return "*";
    if (type.includes("session")) return ">";
    return "i";
  };

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400">
              {unreadCount} {t("unreadNotifications")}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600/10 text-blue-500"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          {t("allNotifications")}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "unread"
              ? "bg-blue-600/10 text-blue-500"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          {t("unreadOnly")}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-500">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl border ${getTypeStyle(notif.type)} bg-gray-900 px-5 py-4 ${
                !notif.isRead ? "ring-1 ring-blue-600/20" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    notif.type.includes("escalation")
                      ? "bg-red-600/20 text-red-400"
                      : notif.type.includes("streak")
                        ? "bg-yellow-600/20 text-yellow-400"
                        : "bg-blue-600/20 text-blue-400"
                  }`}
                >
                  {getTypeIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${notif.isRead ? "text-gray-400" : "text-white"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600 capitalize">
                      {notif.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="flex-shrink-0 text-xs text-gray-500 hover:text-white"
                  >
                    {t("markRead")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
