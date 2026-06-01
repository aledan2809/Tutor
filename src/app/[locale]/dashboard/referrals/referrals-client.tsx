"use client";

import { useState } from "react";

type ReferralRow = {
  id: string;
  name: string | null;
  status: string;
  earnedCents: number;
  joinedAt: string | Date;
  activatedAt: string | Date | null;
};

type Stats = {
  code: string;
  url: string;
  commissionPct: number;
  counts: { total: number; active: number; pending: number };
  earnings: { totalCents: number; payableCents: number; pendingCents: number };
  referrals: ReferralRow[];
};

const COPY = {
  ro: {
    title: "Invită & Câștigă",
    lead: (pct: number) =>
      `Adu-ți elevii sau recomandă platforma. Câștigi ${pct}% comision PERPETUU din fiecare abonament — cât timp rămân abonați, nu doar prima lună.`,
    yourLink: "Linkul tău de invitație",
    copy: "Copiază",
    copied: "Copiat!",
    shareWa: "Trimite pe WhatsApp",
    shareFb: "Distribuie pe Facebook",
    shareMsg: "Învață cu etutor.ro — quiz adaptiv din orice material. Încearcă gratis:",
    invited: "Invitați",
    active: "Activi (plătesc)",
    pendingCount: "În așteptare",
    earnTotal: "Total câștigat",
    earnPayable: "Disponibil de plată",
    earnPending: "În hold (30 zile)",
    listTitle: "Invitații tăi",
    empty: "Încă niciun invitat. Trimite linkul de mai sus — primești 50% din fiecare abonament.",
    colName: "Nume",
    colStatus: "Status",
    colEarned: "Câștigat",
    colJoined: "Înscris",
    welcomeTitle: "🎁 Ai un voucher de bun venit!",
    welcomeBody: (code: string, pct: number) =>
      `Ai fost invitat — folosește codul ${code} la abonare pentru ${pct}% reducere.`,
    statusMap: { PENDING: "În așteptare", ACTIVE: "Activ", CHURNED: "Inactiv" } as Record<string, string>,
  },
  en: {
    title: "Invite & Earn",
    lead: (pct: number) =>
      `Bring your students or recommend the platform. Earn ${pct}% commission PERPETUALLY on every subscription — for as long as they stay subscribed, not just the first month.`,
    yourLink: "Your invite link",
    copy: "Copy",
    copied: "Copied!",
    shareWa: "Send on WhatsApp",
    shareFb: "Share on Facebook",
    shareMsg: "Learn with etutor.ro — adaptive quizzes from any material. Try it free:",
    invited: "Invited",
    active: "Active (paying)",
    pendingCount: "Pending",
    earnTotal: "Total earned",
    earnPayable: "Payable now",
    earnPending: "On hold (30 days)",
    listTitle: "Your invitees",
    empty: "No invitees yet. Share your link above — you earn 50% of every subscription.",
    colName: "Name",
    colStatus: "Status",
    colEarned: "Earned",
    colJoined: "Joined",
    welcomeTitle: "🎁 You have a welcome voucher!",
    welcomeBody: (code: string, pct: number) =>
      `You were invited — use code ${code} at checkout for ${pct}% off.`,
    statusMap: { PENDING: "Pending", ACTIVE: "Active", CHURNED: "Inactive" } as Record<string, string>,
  },
};

function fmtMoney(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ReferralsClient({
  locale,
  stats,
  welcomeVoucher,
}: {
  locale: string;
  stats: Stats;
  welcomeVoucher: { code: string; discountPercent: number } | null;
}) {
  const t = COPY[locale === "ro" ? "ro" : "en"];
  const [copied, setCopied] = useState(false);
  const pct = Math.round(stats.commissionPct * 100);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(stats.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — link is still visible to copy manually */
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${t.shareMsg} ${stats.url}`)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats.url)}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{t.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">{t.lead(pct)}</p>
      </div>

      {welcomeVoucher && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <p className="font-semibold">{t.welcomeTitle}</p>
          <p className="text-sm">{t.welcomeBody(welcomeVoucher.code, welcomeVoucher.discountPercent)}</p>
        </div>
      )}

      {/* Share link */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t.yourLink}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={stats.url}
            className="flex-1 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-blue-300"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={copyLink}
            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500"
          >
            {t.shareWa}
          </a>
          <a
            href={fbHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {t.shareFb}
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t.invited} value={String(stats.counts.total)} />
        <Stat label={t.active} value={String(stats.counts.active)} />
        <Stat label={t.pendingCount} value={String(stats.counts.pending)} />
        <Stat label={t.earnTotal} value={`${fmtMoney(stats.earnings.totalCents)} RON`} />
        <Stat label={t.earnPayable} value={`${fmtMoney(stats.earnings.payableCents)} RON`} accent />
        <Stat label={t.earnPending} value={`${fmtMoney(stats.earnings.pendingCents)} RON`} />
      </div>

      {/* List */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-200">{t.listTitle}</h2>
        {stats.referrals.length === 0 ? (
          <p className="text-sm text-gray-500">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2 pr-4">{t.colName}</th>
                  <th className="py-2 pr-4">{t.colStatus}</th>
                  <th className="py-2 pr-4">{t.colEarned}</th>
                  <th className="py-2">{t.colJoined}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-4 text-gray-200">{r.name || "—"}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          r.status === "ACTIVE"
                            ? "text-green-400"
                            : r.status === "CHURNED"
                            ? "text-gray-500"
                            : "text-amber-400"
                        }
                      >
                        {t.statusMap[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-300">{fmtMoney(r.earnedCents)} RON</td>
                    <td className="py-2 text-gray-500">
                      {new Date(r.joinedAt).toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? "text-green-400" : "text-gray-100"}`}>{value}</p>
    </div>
  );
}
