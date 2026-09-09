"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Brand } from "@/components/Brand";

type Person = {
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  badgeNo: string | null;
  phone: string;
  county: string | null;
  city: string | null;
  postOffice: string | null;
  course: string;
};

/**
 * Ecranul de primă intrare al unui om invitat.
 *
 * Datele lui apar DEJA completate și nu se pot edita aici: vin de pe lista
 * angajatorului, iar dacă le-am lăsa editabile, raportul managerului n-ar mai
 * însemna nimic — oricine s-ar putea trece altcineva. Dacă ceva e greșit, se
 * corectează la sursă, nu în ecranul ăsta.
 *
 * Omul completează două lucruri, amândouă despre acces, niciunul despre cine e.
 */
export function ActivateForm({
  token,
  person,
  alreadyActivated,
}: {
  token: string;
  person: Person;
  alreadyActivated: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const detalii = [
    person.jobTitle,
    person.postOffice,
    [person.city, person.county].filter(Boolean).join(", ") || null,
    person.badgeNo ? `marca ${person.badgeNo}` : null,
  ].filter(Boolean) as string[];

  const submit = async () => {
    if (busy) return;
    setErr(null);
    if (pass !== pass2) {
      setErr("Cele două parole nu sunt la fel.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/acces/activare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, username, password: pass }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error || "Nu am putut crea contul.");
        return;
      }
      // Îl și autentificăm: altfel ar trebui să scrie a doua oară exact ce tocmai
      // a scris, ceea ce e o piedică pusă fix după ce a trecut de toate celelalte.
      const signed = await signIn("credentials", {
        email: data.username,
        password: pass,
        redirect: false,
      });
      if (!signed || signed.error) {
        setErr("Contul e creat, dar autentificarea n-a mers. Intră cu numele și parola ta.");
        return;
      }
      router.replace("/dashboard/lessons");
    } catch {
      setErr("Nu am putut crea contul.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Brand className="text-2xl" />
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">Bine ai venit,</p>
          <h1 className="mt-1 text-2xl font-bold">
            {person.firstName} {person.lastName}
          </h1>
          {detalii.length > 0 && (
            <p className="mt-2 text-sm text-gray-400">{detalii.join(" · ")}</p>
          )}
          <p className="mt-4 rounded-lg border border-blue-900/50 bg-blue-950/30 px-3 py-2 text-sm text-blue-200">
            Ai acces la cursul <strong>{person.course}</strong>.
          </p>

          {alreadyActivated ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-gray-300">
                Contul tău e deja creat. Intră cu numele de utilizator și parola ta.
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
              >
                Intră în cont
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-300">
                Alege cum vrei să intri de acum înainte. Datele tale sunt deja
                completate — nu mai ai nimic de scris despre tine.
              </p>

              <div>
                <label htmlFor="user" className="mb-1 block text-sm text-gray-400">
                  Nume de utilizator
                </label>
                <input
                  id="user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="ion.popescu"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder:text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Litere mici, cifre, punct sau minus. Cu el intri data viitoare.
                </p>
              </div>

              <div>
                <label htmlFor="p1" className="mb-1 block text-sm text-gray-400">
                  Parolă
                </label>
                <input
                  id="p1"
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white"
                />
                <p className="mt-1 text-xs text-gray-500">Cel puțin 8 caractere.</p>
              </div>

              <div>
                <label htmlFor="p2" className="mb-1 block text-sm text-gray-400">
                  Scrie parola încă o dată
                </label>
                <input
                  id="p2"
                  type={show ? "text" : "password"}
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {show ? "Ascunde parola" : "Arată parola"}
              </button>

              {err && (
                <div
                  role="status"
                  className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-200"
                >
                  {err}
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy || !username.trim() || !pass || !pass2}
                className="min-h-[44px] w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Se creează contul…" : "Intră la curs"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
