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

export default function RegisterPage() {
  const router = useRouter();
  const ro = useLocale() === "ro";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [domainSlugs, setDomainSlugs] = useState<string[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, domainSlugs }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
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
          <h2 className="mb-2 text-xl font-bold text-white">Account created!</h2>
          <p className="mb-6 text-sm text-gray-400">
            You can now sign in with your email and password.
          </p>
          <button
            onClick={() => router.push("/auth/signin")}
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8">
        <h2 className="mb-2 text-center text-xl font-bold text-white">
          Create account
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          {ro ? "Intră în " : "Join "}
          <Brand className="text-sm" />
          {ro ? " și începe să înveți" : " and start learning"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="Your name"
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
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="Repeat password"
            />
          </div>

          {domains.length > 0 && (
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                {ro ? "Materii (poți alege mai multe, opțional)" : "Subjects (pick one or more, optional)"}
              </label>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-2">
                {domains.map((d) => {
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
            Sign in
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
