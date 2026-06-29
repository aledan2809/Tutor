"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type DsrType = "export" | "delete" | "rectify";

/**
 * GDPR Data Subject Request form. Submits to /api/v1/dsr, which proxies to the
 * Legal Hub DPO queue (legal.knowbest.ro). A logged-in user's email is taken from
 * the session server-side; a visitor types it here. Legal confirms via Art. 12 email.
 */
export function DsrRequestForm() {
  const t = useTranslations("dsr");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<DsrType>("export");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/v1/dsr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type, description: description.trim() || undefined }),
      });
      const data = await res.json();
      setState(res.ok && data.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "ok") {
    return (
      <div className="rounded-xl border border-green-900/50 bg-green-900/10 p-4 text-sm text-green-400">
        {t("ok")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-sm text-gray-400">{t("intro")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DsrType)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          <option value="export">{t("typeExport")}</option>
          <option value="delete">{t("typeDelete")}</option>
          <option value="rectify">{t("typeRectify")}</option>
        </select>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("descPlaceholder")}
        rows={3}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
      />
      {state === "error" && <p className="text-sm text-red-400">{t("error")}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="min-h-[44px] rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {state === "sending" ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
