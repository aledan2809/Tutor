import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Creatori — waitlist | Admin" };

export default async function AdminCreatoriPage() {
  const session = await auth();
  // SuperAdmin-only — the waitlist holds personal data + CVs.
  if (!session?.user?.isSuperAdmin) redirect("/dashboard/admin");

  const entries = await prisma.creatorWaitlist.findMany({
    orderBy: { createdAt: "desc" },
  });

  const taxHelpCount = entries.filter((e) => e.needsTaxHelp).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Înscrieri creatori</h2>
        <span className="rounded-full bg-blue-600/20 px-3 py-1 text-sm text-blue-300">{entries.length} total</span>
        {taxHelpCount > 0 && (
          <span className="rounded-full bg-amber-600/20 px-3 py-1 text-sm text-amber-300">{taxHelpCount} cer sprijin fiscal</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-400">Nicio înscriere încă.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Nume</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Pregătire → Materie</th>
                <th className="px-3 py-2">Experiență</th>
                <th className="px-3 py-2">Fiscal</th>
                <th className="px-3 py-2">CV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {entries.map((e) => (
                <tr key={e.id} className="bg-gray-950 align-top hover:bg-gray-900">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-400">{new Date(e.createdAt).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-3 py-2 font-medium text-white">{e.name}</td>
                  <td className="px-3 py-2 text-gray-300">
                    <a href={`mailto:${e.email}`} className="text-blue-400 hover:underline">{e.email}</a>
                  </td>
                  <td className="px-3 py-2 text-gray-300">
                    <span className="text-gray-400">{e.track || "—"}</span><br />
                    <span className="font-medium">{e.subject}</span>
                  </td>
                  <td className="max-w-xs px-3 py-2 text-gray-400">{e.experience || "—"}</td>
                  <td className="px-3 py-2">
                    {e.needsTaxHelp
                      ? <span className="rounded bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300">cere sprijin</span>
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {e.cvPath
                      ? <a href={`/api/admin/creator-cv/${e.id}`} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">descarcă</a>
                      : <span className="text-gray-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
