"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Parent "Alerte" about a child (parent_alert) live at audience=child. We surface
  // them here too — distinctly tagged — so a parent checking the bell (the standard
  // affordance) actually sees them; managing them stays on the dedicated Alerte page.
  const [childNotifs, setChildNotifs] = useState<Notification[]>([]);
  const [childUnread, setChildUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const [selfRes, childRes] = await Promise.all([
        fetch("/api/notifications?limit=10&audience=self"),
        fetch("/api/notifications?limit=5&audience=child"),
      ]);
      if (selfRes.ok) {
        const data = await selfRes.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
      if (childRes.ok) {
        const data = await childRes.json();
        setChildNotifs(data.notifications ?? []);
        setChildUnread(data.unreadCount ?? 0);
      }
    } catch {
      // Silently fail
    }
  }

  const totalUnread = unreadCount + childUnread;

  function openChildAlerts() {
    setOpen(false);
    router.push("/dashboard/watcher/notifications");
  }

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("justNow");
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        aria-label={t("notifications")}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">
              {t("notifications")}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Child alerts (parent-about-child) — distinct amber band, routes to the
                Alerte page where they're managed. */}
            {childNotifs.length > 0 && (
              <div className="border-b border-amber-900/30 bg-amber-950/20">
                {childNotifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={openChildAlerts}
                    className="flex w-full flex-col gap-1 border-l-2 border-amber-500 px-4 py-3 text-left transition-colors hover:bg-amber-900/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
                        {t("childAlert")}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${n.isRead ? "text-gray-400" : "text-white"}`}
                    >
                      {n.title}
                    </span>
                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                  </button>
                ))}
                <button
                  onClick={openChildAlerts}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  {t("viewAllChildAlerts")} →
                </button>
              </div>
            )}
            {notifications.length === 0 && childNotifs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                {t("noNotifications")}
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`flex w-full flex-col gap-1 border-b border-gray-800 px-4 py-3 text-left transition-colors hover:bg-gray-800/50 ${
                    !n.isRead ? "bg-blue-500/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-medium ${
                        n.isRead ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {n.message}
                  </p>
                  {!n.isRead && (
                    <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
