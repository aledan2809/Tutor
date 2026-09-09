"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Brand } from "@/components/Brand";

/**
 * Intrarea pe CODUL COMUN al unei materii — hârtia lipită în oficiu, codul dat pe
 * loc. Spre deosebire de linkul personal, aici nu știm cine e omul.
 *
 * De-aia îi cerem trei lucruri: nume, prenume, telefon. Nu ca formalitate: prima
 * versiune nu întreba nimic, iar în tabloul managerului apărea un rând fără nume,
 * cu lecții citite și teste date — muncă făcută de nimeni, adică exact lucrul
 * care golește raportul de sens.
 *
 * Telefonul e cheia, fiindcă e unic: dacă HR-ul l-a invitat deja pe numărul ăsta,
 * omul se leagă de rândul LUI de pe listă, nu de un al doilea.
 *
 * Cine e deja autentificat sare peste tot: îl știm.
 */
export function GuestEnter() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { status } = useSession();
  const t = useTranslations();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  // React rulează efectele de două ori în dezvoltare; fără garda asta, al doilea
  // apel ar consuma încă o folosire din cod.
  const started = useRef(false);

  // Autentificat deja: îl înscriem și îl trimitem mai departe, fără să-l întrebăm
  // nimic — datele lui le avem.
  useEffect(() => {
    if (status !== "authenticated" || started.current) return;
    started.current = true;
    const code = params?.code;
    if (!code) {
      setFailed(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/domains/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          setFailed(true);
          return;
        }
        router.replace("/dashboard/lessons");
      } catch {
        setFailed(true);
      }
    })();
  }, [status, params?.code, router]);

  const intra = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await signIn("guest-access", {
        code: params?.code,
        lastName,
        firstName,
        phone,
        redirect: false,
      });
      if (!res || res.error) {
        setFailed(true);
        return;
      }
      router.replace("/dashboard/lessons");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-gray-100">
        <div className="w-full max-w-sm text-center">
          <Brand className="text-2xl" />
          {failed ? (
            <>
              <p className="mt-6 text-sm text-gray-300">{t("acces.invalid")}</p>
              <Link
                href="/auth/signin"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {t("acces.signin")}
              </Link>
            </>
          ) : (
            <p className="mt-6 text-sm text-gray-400">{t("acces.loading")}</p>
          )}
        </div>
      </div>
    );
  }

  const gata = lastName.trim() && firstName.trim() && phone.trim();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Brand className="text-2xl" />
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div>
            <h1 className="text-xl font-bold">Spune-ne cine ești</h1>
            <p className="mt-2 text-sm text-gray-400">
              Doar atât — ca șeful tău să vadă că ai făcut cursul. Nu ai de ales
              nicio parolă acum.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="g-nume" className="mb-1 block text-sm text-gray-400">Nume</label>
              <input id="g-nume" value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white" />
            </div>
            <div>
              <label htmlFor="g-prenume" className="mb-1 block text-sm text-gray-400">Prenume</label>
              <input id="g-prenume" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white" />
            </div>
          </div>

          <div>
            <label htmlFor="g-tel" className="mb-1 block text-sm text-gray-400">Telefon</label>
            <input id="g-tel" type="tel" inputMode="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder:text-gray-600" />
          </div>

          {failed && (
            <div role="status" className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
              {t("acces.invalid")}
            </div>
          )}

          <button
            onClick={intra}
            disabled={busy || !gata}
            className="min-h-[44px] w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Se deschide cursul…" : "Intră la curs"}
          </button>
        </div>
      </div>
    </div>
  );
}
