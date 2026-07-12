"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Brand } from "@/components/Brand";

interface Domain {
  slug: string;
  name: string;
}

// Campaign presets for direct marketing links (?exam=<key>).
// A campaign locks the subject list to its slugs and shows a dedicated banner.
// `preselect` (default: all slugs) = subjects checked on load — BAC keeps only
// Română checked because the math variant (M1/M2/M3) and optionals depend on profile.
const CAMPAIGNS: Record<
  string,
  { slugs: string[]; preselect?: string[]; titleRo: string; subtitleRo: string }
> = {
  en: {
    slugs: ["romana-cl-viii", "matematica-v-viii"],
    titleRo: "Pregătire Evaluarea Națională",
    subtitleRo: "Română și Matematică — clasa a VIII-a",
  },
  bac: {
    slugs: [
      "romana-ix-xii",
      "matematica-m1-ix-xii",
      "matematica-m2-ix-xii",
      "matematica-m3-ix-xii",
      "istorie",
      "geografie",
      "biologie",
      "chimie",
    ],
    preselect: ["romana-ix-xii"],
    titleRo: "Pregătire Bacalaureat",
    subtitleRo: "Bifează materiile pentru profilul tău",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const ro = useLocale() === "ro";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [domainSlugs, setDomainSlugs] = useState<string[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [campaign, setCampaign] = useState<(typeof CAMPAIGNS)[string] | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState<number | null>(null);
  // Plan chosen on /preturi (?plan=<key>) — carried through so the new user lands
  // on the packages page with that plan pre-selected instead of a generic dead end.
  const [plan, setPlan] = useState<string | null>(null);

  // Read campaign params (?exam=, ?subjects=, ?voucher=) once on mount.
  // window.location is used instead of useSearchParams() to avoid the
  // Suspense-boundary requirement on this client page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (planParam) setPlan(planParam);
    const exam = params.get("exam")?.toLowerCase();
    const preset = exam ? CAMPAIGNS[exam] : undefined;
    if (preset) {
      setCampaign(preset);
      setDomainSlugs(preset.preselect ?? preset.slugs);
    } else {
      const subjects = params.get("subjects");
      if (subjects) {
        setDomainSlugs(subjects.split(",").map((s) => s.trim()).filter(Boolean));
      }
    }
    const voucher = params.get("voucher");
    if (voucher) setVoucherCode(voucher.trim().toUpperCase());
  }, []);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.available) {
          setDomains(d.available.map((a: { slug: string; name: string }) => ({
            slug: a.slug,
            name: a.name,
          })));
        }
        if (d.enrolled) {
          const enrolled = d.enrolled.map((e: { slug: string; name: string }) => ({
            slug: e.slug,
            name: e.name,
          }));
          setDomains((prev) => [...prev, ...enrolled]);
        }
      })
      .catch(() => {
        // Not logged in — fetch public domains
        fetch("/api/domains/public")
          .then((r) => r.json())
          .then((d) => {
            if (d.domains) {
              setDomains(d.domains);
            }
          })
          .catch(() => {});
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(ro ? "Parola trebuie să aibă minimum 8 caractere" : "Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError(ro ? "Parolele nu coincid" : "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          domainSlugs,
          ...(voucherCode ? { voucherCode } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVoucherApplied(Boolean(data.voucherApplied));
        setVoucherDiscount(typeof data.voucherDiscount === "number" ? data.voucherDiscount : null);
        setSuccess(true);
      } else {
        setError(data.error || (ro ? "Ceva nu a mers. Încearcă din nou." : "Something went wrong"));
      }
    } catch {
      setError(ro ? "Eroare de rețea. Încearcă din nou." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">
            {ro ? "Cont creat!" : "Account created!"}
          </h2>
          {voucherApplied ? (
            <p className="mb-6 text-sm text-green-300">
              {ro
                ? "Voucherul a fost aplicat — accesul la materiile tale este activ. Intră în cont și începe să exersezi."
                : "Your voucher was applied — access to your subjects is active. Sign in and start practicing."}
            </p>
          ) : (
            <p className="mb-6 text-sm text-gray-400">
              {ro
                ? "Te poți autentifica acum cu emailul și parola ta."
                : "You can now sign in with your email and password."}
              {voucherCode && voucherDiscount !== null && !voucherApplied && (
                <span className="mt-2 block text-yellow-300">
                  {ro
                    ? `Voucherul ${voucherCode} (−${voucherDiscount}%) se aplică la plată, după autentificare.`
                    : `Voucher ${voucherCode} (−${voucherDiscount}%) applies at payment, after you sign in.`}
                </span>
              )}
            </p>
          )}
          <button
            onClick={() =>
              router.push(
                voucherCode && !voucherApplied
                  ? `/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/activare?voucher=${voucherCode}`)}`
                  : plan
                    ? `/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/packages?plan=${plan}`)}`
                    : "/auth/signin"
              )
            }
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            {ro ? "Autentifică-te" : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8">
        {campaign && (
          <div className="mb-4 rounded-lg border border-blue-800 bg-blue-900/30 p-3 text-center">
            <p className="text-sm font-semibold text-blue-200">{campaign.titleRo}</p>
            <p className="text-xs text-blue-300">{campaign.subtitleRo}</p>
            {voucherCode && (
              <p className="mt-1.5 inline-block rounded-full bg-green-900/40 px-3 py-0.5 text-xs font-medium text-green-300">
                ✓ Voucher {voucherCode} inclus
              </p>
            )}
          </div>
        )}
        <h2 className="mb-2 text-center text-xl font-bold text-white">
          {ro ? "Creează cont" : "Create account"}
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          {ro ? "Intră în " : "Join "}
          <Brand className="text-sm" />
          {ro ? " și începe să înveți" : " and start learning"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">{ro ? "Nume" : "Name"}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder={ro ? "Numele tău" : "Your name"}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder={ro ? "tu@exemplu.ro" : "you@example.com"}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">{ro ? "Parolă" : "Password"}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder={ro ? "Minimum 8 caractere" : "Minimum 8 characters"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? (ro ? "Ascunde parola" : "Hide password") : (ro ? "Arată parola" : "Show password")}
                title={showPassword ? (ro ? "Ascunde parola" : "Hide password") : (ro ? "Arată parola" : "Show password")}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">{ro ? "Confirmă parola" : "Confirm password"}</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder={ro ? "Repetă parola" : "Repeat password"}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? (ro ? "Ascunde parola" : "Hide password") : (ro ? "Arată parola" : "Show password")}
                title={showConfirm ? (ro ? "Ascunde parola" : "Hide password") : (ro ? "Arată parola" : "Show password")}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200"
              >
                {showConfirm ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {domains.length > 0 && (
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                {campaign
                  ? "Materiile tale"
                  : ro ? "Materii (poți alege mai multe, opțional)" : "Subjects (pick one or more, optional)"}
              </label>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-2">
                {(campaign ? domains.filter((d) => campaign.slugs.includes(d.slug)) : domains).map((d) => {
                  const checked = domainSlugs.includes(d.slug);
                  return (
                    <label
                      key={d.slug}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setDomainSlugs((prev) =>
                            e.target.checked ? [...prev, d.slug] : prev.filter((s) => s !== d.slug)
                          )
                        }
                        className="rounded border-gray-600 bg-gray-800"
                      />
                      {d.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? ro ? "Se creează contul..." : "Creating account..."
              : ro ? "Creează cont" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {ro ? "Ai deja cont? " : "Already have an account? "}
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
            {ro ? "Autentifică-te" : "Sign in"}
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-gray-500">
          {ro ? "Nehotărât? " : "Not sure yet? "}
          <Link href="/try" className="text-blue-400 hover:text-blue-300">
            {ro ? "Încearcă fără cont ✨" : "Try without an account ✨"}
          </Link>
        </p>
      </div>
    </div>
  );
}
