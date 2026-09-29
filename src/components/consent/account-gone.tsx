"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/**
 * A session whose account no longer exists (erased after a parent's „no”, or by a person): said once,
 * then signed out. The session itself ends too at its next refresh (auth.ts), this just doesn't wait.
 */
export function AccountGone({ locale }: { locale: "ro" | "en" }) {
  useEffect(() => {
    const t = setTimeout(() => void signOut({ callbackUrl: `/${locale}` }), 4000);
    return () => clearTimeout(t);
  }, [locale]);
  const ro = locale === "ro";
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h1 className="text-xl font-bold text-white">{ro ? "Contul nu mai există" : "This account no longer exists"}</h1>
        <p className="mt-2 text-sm text-gray-300">
          {ro ? "Contul a fost închis și datele lui au fost șterse. Te deconectăm acum." : "The account was closed and its data erased. Signing you out now."}
        </p>
      </div>
    </main>
  );
}
