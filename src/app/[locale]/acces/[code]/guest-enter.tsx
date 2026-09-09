"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Brand } from "@/components/Brand";

/**
 * /acces/<cod> — capătul linkului din invitația pe WhatsApp.
 *
 * Un singur pas pentru om: apasă butonul din mesaj și e în curs. Nimic de tastat,
 * niciun cont de făcut acum. La un client instituțional, fiecare ecran pus înaintea
 * materialului pierde oameni — de-aia codul călătorește în link, nu în text.
 *
 * Două căi, deliberat:
 * - are deja cont și e autentificat → răscumpărăm codul pe contul lui, ca să nu-i
 *   apară un al doilea profil gol care nu-i știe progresul;
 * - nu e autentificat → intră ca invitat (`guest-access`), adică un rând de
 *   utilizator real fără email. Contul i se cere mai târziu, în faza aleasă de
 *   client, iar atunci se completează ACELAȘI rând — nu pierde nimic.
 *
 * Orice eșec (cod greșit, expirat, epuizat) arată la fel, ca nimeni să nu afle prin
 * încercări care coduri sunt vii.
 */
export function GuestEnter() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { status } = useSession();
  const t = useTranslations();
  const [failed, setFailed] = useState(false);
  // React rulează efectele de două ori în dezvoltare; fără garda asta, al doilea
  // apel ar consuma încă o folosire din cod.
  const started = useRef(false);

  useEffect(() => {
    if (status === "loading" || started.current) return;
    started.current = true;
    const code = params?.code;
    if (!code) {
      setFailed(true);
      return;
    }

    (async () => {
      try {
        if (status === "authenticated") {
          const res = await fetch("/api/domains/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          if (!res.ok) {
            setFailed(true);
            return;
          }
        } else {
          const res = await signIn("guest-access", { code, redirect: false });
          if (!res || res.error) {
            setFailed(true);
            return;
          }
        }
        router.replace("/dashboard/lessons");
      } catch {
        setFailed(true);
      }
    })();
  }, [status, params?.code, router]);

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
