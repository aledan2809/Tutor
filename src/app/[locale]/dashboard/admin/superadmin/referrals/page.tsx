import { prisma } from "@/lib/prisma";

/**
 * Superadmin referral-liability view (read-only). Surfaces the commission the
 * platform owes promoters — invisible until now despite the Referral/
 * ReferralEarning models being fully built. Statuses: PENDING (in 30-day hold),
 * PAYABLE (owed now), PAID (settled), VOID (reversed).
 *
 * "Mark PAID" is a money-state mutation and is intentionally NOT wired here — it
 * needs its own reviewed change. This page is purely visibility.
 */

const money = (cents: number) =>
  (cents / 100).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_META: Record<string, { label: string; color: string }> = {
  PAYABLE: { label: "De plată acum", color: "text-amber-400" },
  PENDING: { label: "În așteptare (hold 30 zile)", color: "text-blue-400" },
  PAID: { label: "Plătite", color: "text-green-400" },
  VOID: { label: "Anulate", color: "text-gray-500" },
};

export default async function SuperAdminReferralsPage() {
  const [byStatus, outstanding, activePromoters] = await Promise.all([
    prisma.referralEarning.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.referralEarning.groupBy({
      by: ["promoterId"],
      where: { status: { in: ["PENDING", "PAYABLE"] } },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 15,
    }),
    prisma.referral.count({ where: { status: "ACTIVE" } }),
  ]);

  const sumFor = (status: string) =>
    byStatus.find((b) => b.status === status)?._sum.amount ?? 0;
  const countFor = (status: string) =>
    byStatus.find((b) => b.status === status)?._count._all ?? 0;

  const promoterIds = outstanding.map((o) => o.promoterId);
  const promoters = promoterIds.length
    ? await prisma.user.findMany({
        where: { id: { in: promoterIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const nameOf = (id: string) => {
    const u = promoters.find((p) => p.id === id);
    return u?.name || u?.email || id;
  };

  const order = ["PAYABLE", "PENDING", "PAID", "VOID"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Comisioane referral</h1>
        <p className="mt-1 text-sm text-gray-400">
          Cât datorează platforma promotorilor. {activePromoters.toLocaleString("ro-RO")} referral-uri
          active. Marcarea „plătit” se face separat (nu din acest ecran).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {order.map((status) => {
          const meta = STATUS_META[status];
          return (
            <div key={status} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm text-gray-400">{meta.label}</p>
              <p className={`text-2xl font-bold ${meta.color}`}>{money(sumFor(status))} lei</p>
              <p className="mt-1 text-xs text-gray-500">{countFor(status)} înregistrări</p>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">
          Top promotori — de plată (hold + acum)
        </h2>
        {outstanding.length === 0 ? (
          <p className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-6 text-center text-gray-400">
            Niciun comision de plată încă.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-left text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Promotor</th>
                  <th className="px-4 py-2 text-right font-medium">Comisioane</th>
                  <th className="px-4 py-2 text-right font-medium">Total de plată</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {outstanding.map((o) => (
                  <tr key={o.promoterId} className="bg-gray-950/40">
                    <td className="px-4 py-2 text-white">{nameOf(o.promoterId)}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{o._count._all}</td>
                    <td className="px-4 py-2 text-right font-medium text-amber-400">
                      {money(o._sum.amount ?? 0)} lei
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
