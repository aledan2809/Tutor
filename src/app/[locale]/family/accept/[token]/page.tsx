import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AcceptInviteClient } from "@/components/family/accept-invite-client";

const ROLE_RO: Record<string, string> = {
  CHILD: "elev",
  PARENT: "părinte",
  TUTOR: "meditator",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {children}
      </div>
    </main>
  );
}

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const session = await auth();

  const invite = await prisma.familyInvite.findUnique({
    where: { token },
    select: {
      targetRole: true,
      status: true,
      expiresAt: true,
      inviter: { select: { name: true } },
    },
  });

  if (!invite) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Invitație inexistentă
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Linkul nu este valid. Cere persoanei să retrimită invitația.
        </p>
      </Shell>
    );
  }

  const usable =
    invite.status === "pending" && invite.expiresAt.getTime() > Date.now();
  const roleRo = ROLE_RO[invite.targetRole] ?? "membru";
  const who = invite.inviter?.name ?? "Cineva";

  if (!usable) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Invitație indisponibilă
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {invite.status === "accepted"
            ? "Invitația a fost deja acceptată."
            : invite.status === "revoked"
            ? "Invitația a fost anulată."
            : "Invitația a expirat."}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        Invitație în familia etutor.ro
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        <strong>{who}</strong> te invită ca <strong>{roleRo}</strong>.
      </p>

      <div className="mt-6">
        {session?.user ? (
          <AcceptInviteClient token={token} targetRole={invite.targetRole} locale={locale} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Intră în cont (sau fă-ți unul) ca să accepți invitația.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/auth/signin?callbackUrl=${encodeURIComponent(
                  `/family/accept/${token}`
                )}`}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-500"
              >
                Intră în cont
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Fă-ți cont
              </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              După ce îți faci contul, redeschide acest link ca să accepți.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
