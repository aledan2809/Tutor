"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ParentAlertActions } from "@/components/watcher/parent-alert-actions";
import { HowItWorks } from "@/components/ui/how-it-works";
import { HOW_IT_WORKS } from "@/content/help";
import { useLocale } from "next-intl";

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
  const locale = useLocale();
  const t = useTranslations("watcher");
  const [notifications, setNotifications] = useState<WatcherNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = () => {
    setLoading(true);
    setLoadFailed(false);
    // Watcher context → only parent-about-child alerts (not the user's own
    // student notifications, which live in the main Notification Center).
    // An error (e.g. 429) is said as one, not shown as „no notifications” (audit B1).
    fetch("/api/notifications?audience=child")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

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

  const filtered = (filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications
  )
    .slice()
    // Newest first: today's actionable alert stays at the top, old ones below.
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // The „send a memento” form only on the newest „no reaction” alert of each child: older ones are history,
  // and one form per alert made a page with many alerts unusable (audit B1).
  const actionable = (n: WatcherNotification) =>
    n.type === "parent_alert" &&
    ["no_reaction", "no_reaction_reminder"].includes((n.metadata?.alertType as string) ?? "") &&
    typeof n.metadata?.childId === "string";
  const formOn = new Set<string>();
  const childrenWithForm = new Set<string>();
  const newestFirst = notifications
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // From every alert, not the filtered view: the form doesn't jump to another alert when the filter changes.
  for (const n of newestFirst) {
    if (!actionable(n)) continue;
    const child = n.metadata!.childId as string;
    if (childrenWithForm.has(child)) continue;
    childrenWithForm.add(child);
    formOn.add(n.id);
  }

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
  if (loadFailed) {
    return (
      <div className="rounded-lg border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
        {t("loadError")}{" "}
        <button type="button" onClick={load} className="ml-1 inline-flex min-h-[44px] items-center underline hover:no-underline">
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <HowItWorks storageKey="cascade" steps={HOW_IT_WORKS.cascade[locale as "ro" | "en"].steps} moreHref={`/dashboard/ajutor#${HOW_IT_WORKS.cascade[locale as "ro" | "en"].more}`} />

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
                  <p className="text-sm text-gray-400 mt-0.5 whitespace-pre-line">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600 capitalize">
                      {notif.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {formOn.has(notif.id) && <ParentAlertActions childId={notif.metadata!.childId as string} />}
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
