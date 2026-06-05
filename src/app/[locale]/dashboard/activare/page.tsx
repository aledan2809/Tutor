"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const PRICE_PER_SUBJECT = 19.9; // lei / materie / lună (display)

interface Domain {
  slug: string;
  name: string;
}

export default function ActivarePage() {
  const t = useTranslations("activare");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [voucher, setVoucher] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "pay"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        const list: Domain[] = [
          ...(d.available ?? []),
          ...(d.enrolled ?? []),
        ].map((x: { slug: string; name: string }) => ({ slug: x.slug, name: x.name }));
        // dedup by slug
        const seen = new Set<string>();
        setDomains(list.filter((x) => (seen.has(x.slug) ? false : seen.add(x.slug))));
      })
      .catch(() => {});
  }, []);

  const toggle = (slug: string) =>
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const total = selected.length * PRICE_PER_SUBJECT;

  const activate = async () => {
    setMsg(null);
    if (selected.length === 0) return setMsg({ kind: "err", text: t("pickSubject") });
    if (!voucher.trim()) return setMsg({ kind: "err", text: t("enterVoucher") });
    setBusy(true);
    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode: voucher.trim(), domainSlugs: selected }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ kind: "ok", text: `${t("success")} (${data.activated.join(", ")})` });
      } else if (res.ok && data.requiresPayment) {
        setMsg({ kind: "pay", text: t("needsPayment", { percent: data.discountPercent }) });
      } else {
        setMsg({ kind: "err", text: data.error || "Eroare" });
      }
    } catch {
      setMsg({ kind: "err", text: "Eroare de rețea" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-bold text-white">{t("title")}</h1>
      <p className="mb-6 text-sm text-gray-400">{t("intro")}</p>

      {/* Subjects */}
      <div className="mb-6">
        <label className="mb-2 block text-sm text-gray-400">{t("subjects")}</label>
        <div className="space-y-2">
          {domains.map((d) => (
            <label
              key={d.slug}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200"
            >
              <input
                type="checkbox"
                checked={selected.includes(d.slug)}
                onChange={() => toggle(d.slug)}
                className="h-4 w-4"
              />
              {d.name}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">{t("priceNote")}</p>
      </div>

      {/* Price summary */}
      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>{t("total")}</span>
          <span>{total.toFixed(2)} lei{selected.length > 0 ? " / lună" : ""}</span>
        </div>
        {voucher.trim() && (
          <div className="mt-1 flex justify-between text-green-400">
            <span>{t("afterVoucher")}</span>
            <span>0,00 lei*</span>
          </div>
        )}
      </div>

      {/* Voucher */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-gray-400">{t("voucher")}</label>
        <input
          value={voucher}
          onChange={(e) => setVoucher(e.target.value.toUpperCase())}
          placeholder={t("voucherPlaceholder")}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        onClick={activate}
        disabled={busy}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {t("activate")}
      </button>

      <p className="mt-3 text-xs text-gray-500">{t("cardSoon")}</p>

      {msg && (
        <div
          className={`mt-4 rounded-lg p-3 text-sm ${
            msg.kind === "ok"
              ? "bg-green-900/30 text-green-300"
              : msg.kind === "pay"
                ? "bg-yellow-900/30 text-yellow-300"
                : "bg-red-900/30 text-red-300"
          }`}
        >
          {msg.text}
          {msg.kind === "ok" && (
            <Link href="/dashboard/practice" className="mt-2 block font-medium underline">
              {t("toGrile")} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
