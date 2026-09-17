"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * The parent's switch for the messages about the free week and the subscription. Every one of those
 * messages points here (access-messages.ts). Styled like the channel switches above it.
 */
export function AccessMessagesToggle() {
  const t = useTranslations("notifications.accessMessages");
  const [off, setOff] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/access-messages")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOff(d?.off === true))
      .catch(() => setOff(false));
  }, []);

  if (off === null) return null;

  const change = async (nextOff: boolean) => {
    // Shown at once; put back if the save fails.
    setOff(nextOff);
    setSaving(true);
    const res = await fetch("/api/notifications/access-messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ off: nextOff }),
    }).catch(() => null);
    if (!res?.ok) setOff(!nextOff);
    setSaving(false);
  };

  const on = !off;
  return (
    <div id="mesaje-abonament">
      <h2 className="text-lg font-semibold text-white">{t("title")}</h2>
      <p className="text-sm text-gray-500">{t("body")}</p>
      <div className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-gray-800 px-4 py-3">
        <span id="access-messages-label" className="text-sm text-gray-300">
          {t("label")}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="access-messages-label"
          disabled={saving}
          onClick={() => void change(on)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
            on ? "bg-blue-600" : "bg-gray-700"
          } disabled:opacity-60`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              on ? "translate-x-5.5" : "translate-x-0.5"
            } mt-0.5`}
          />
        </button>
      </div>
    </div>
  );
}
