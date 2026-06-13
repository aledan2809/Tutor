"use client";

import { useEffect, useState } from "react";

interface Bucket {
  key: string;
  signups: number;
  converted: number;
  conversionRate: number; // 0..1
}
interface Report {
  byCampaign: Bucket[];
  byVoucher: Bucket[];
  totals: { signups: number; converted: number; conversionRate: number };
}

const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

function BucketTable({ title, rows }: { title: string; rows: Bucket[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Niciun semnal încă.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3">Sursă</th>
                <th className="px-4 py-3">Înscrieri</th>
                <th className="px-4 py-3">Convertiți</th>
                <th className="px-4 py-3">Rată conversie</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.key} className="border-t border-gray-800 hover:bg-gray-900/50">
                  <td className="px-4 py-3 font-mono text-white">{b.key}</td>
                  <td className="px-4 py-3 text-gray-300">{b.signups}</td>
                  <td className="px-4 py-3 text-green-400">{b.converted}</td>
                  <td className="px-4 py-3 text-purple-300">{pct(b.conversionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CampaignFunnel() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/campaigns");
        if (!res.ok) {
          setError(`Eroare ${res.status}`);
          return;
        }
        setReport(await res.json());
      } catch {
        setError("Eroare de rețea");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-gray-400">Se încarcă…</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (!report) return null;

  const stats = [
    { label: "Înscrieri (din campanii)", value: String(report.totals.signups), color: "text-blue-400" },
    { label: "Convertiți (abonament activ)", value: String(report.totals.converted), color: "text-green-400" },
    { label: "Rată conversie", value: pct(report.totals.conversionRate), color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Atribuire din linkurile de campanie (/evaluare, /bac) și trafic utm_*.
        Convertit = utilizatorul are abonament activ/trial acum. Conturile de
        test sunt excluse.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <BucketTable title="Pe campanie" rows={report.byCampaign} />
      <BucketTable title="Pe voucher" rows={report.byVoucher} />
    </div>
  );
}
