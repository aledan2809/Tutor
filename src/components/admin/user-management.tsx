"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AccessTrialPanel } from "@/components/admin/access-trial-panel";

/** The access the server computed for the row (see access.ts; dates arrive as strings). */
type AccessView =
  | { kind: "full"; reason: "paid" | "family_paid" | "free_forever" | "staff" | "org" }
  | { kind: "trial"; daysLeft: number; endsAt: string; via: "own" | "family" }
  | { kind: "free" }
  | { kind: "paused"; since: string; payer: "self" | "parent" }
  | null;

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isSuperAdmin: boolean;
  isBanned: boolean;
  bannedReason: string | null;
  subscriptionStatus: string | null;
  freeForever: boolean;
  access: AccessView;
  createdAt: string;
  enrollments: { roles: string[]; domain: { id: string; name: string; slug: string } }[];
  subscriptionPlan: { name: string } | null;
  subscriptionEndsAt: string | null;
  /** A card pays the subscription (otherwise an „active" one comes from a 100% code). */
  paysByCard: boolean;
  /** The code this account used: the free year, or the discount kept at the card payment. */
  voucherUsed: { code: string; percent: number; at: string } | null;
  /** A code kept on the account since signup and not used yet. */
  voucherKept: { code: string; percent: number | null; expiresAt: string | null; gone: boolean } | null;
  /** The last successful sign-in; null on accounts that have not signed in since recording began. */
  lastLoginAt: string | null;
  /** Presence over the chosen period, plus the freshest evidence of being here and on what. */
  presence: {
    visits: number;
    ms: number;
    lastSeenAt: string | null;
    lastTraceAt: string | null;
    lastDomain: string | null;
  };
}

interface DomainOption {
  id: string;
  name: string;
  slug: string;
}

const ROLES = ["STUDENT", "WATCHER", "INSTRUCTOR", "ADMIN"] as const;

export function UserManagement() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [onlyFreeForever, setOnlyFreeForever] = useState(false);
  const [savingFreeForever, setSavingFreeForever] = useState<string | null>(null);
  // Presence period — the columns Vizite/Timp read it; „Ultima conectare" is always absolute.
  const [days, setDays] = useState<1 | 7 | 30>(7);
  // True while part of the period predates real recording, so the two columns are partly rebuilt.
  const [estimated, setEstimated] = useState(false);
  // When measuring began: „niciodată" is only true for accounts created after it.
  const [trackingStartedAt, setTrackingStartedAt] = useState<string | null>(null);
  // Clicking 1 → 7 → 30 quickly starts three reads; only the last one may paint the table.
  const requestSeq = useRef(0);
  // Bumped after a mark/unmark, so the trial panel re-counts.
  const [panelKey, setPanelKey] = useState(0);
  const [banModal, setBanModal] = useState<{ id: string; name: string | null } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [createError, setCreateError] = useState("");

  // Enroll modal state
  const [enrollModal, setEnrollModal] = useState<{ userId: string; userName: string | null } | null>(null);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [enrollDomainId, setEnrollDomainId] = useState("");
  const [enrollRoles, setEnrollRoles] = useState<string[]>(["STUDENT"]);
  const [enrollError, setEnrollError] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);

  const fetchUsers = async (p = page, s = search, ff = onlyFreeForever, d = days) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${p}&search=${encodeURIComponent(s)}${ff ? "&freeForever=1" : ""}&days=${d}`);
    const data = await res.json();
    if (seq !== requestSeq.current) return; // a newer period was clicked meanwhile
    setUsers(data.users);
    setTotalPages(data.totalPages);
    setEstimated(Boolean(data.presence?.estimated));
    setTrackingStartedAt(data.presence?.trackingStartedAt ?? null);
    setLoading(false);
  };

  const handleFreeForever = async (userId: string, value: boolean) => {
    // The box ticks at once; a refused save puts it back when the list reloads.
    setUsers((us) => us.map((u) => (u.id === userId ? { ...u, freeForever: value } : u)));
    setSavingFreeForever(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeForever: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || t("trialSaveError"));
      }
    } finally {
      setSavingFreeForever(null);
      setPanelKey((k) => k + 1);
      // Reload the badges quietly (no „loading" flash over the table).
      const res = await fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}${onlyFreeForever ? "&freeForever=1" : ""}`);
      if (res.ok) setUsers((await res.json()).users);
    }
  };

  // With the year: a free year from a code ends in the next one, and „22 sept." alone read as this year.
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "ro-RO", {
      timeZone: "Europe/Bucharest",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /** „acum 2 zile" — the unit follows the distance, so a fresh sign-in doesn't read „acum 0 zile". */
  const fmtAgo = (iso: string) => {
    const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "ro", { numeric: "auto" });
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.round(diff / 60_000);
    if (min < 60) return rtf.format(-Math.max(1, min), "minute");
    const hours = Math.round(min / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    return rtf.format(-Math.round(hours / 24), "day");
  };

  /** „4 h 12 min" / „38 min" / „< 1 min" — never a bare number of milliseconds. */
  const fmtDuration = (ms: number) => {
    if (ms <= 0) return "—";
    const min = Math.round(ms / 60_000);
    if (min < 1) return locale === "en" ? "< 1 min" : "< 1 min";
    if (min < 60) return `${min} min`;
    return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "ro-RO", {
      timeZone: "Europe/Bucharest",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  /** Whole days left until a date, never negative (what the admin reads as „still has"). */
  const daysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

  const accessBadge = (user: UserRow) => {
    const access = user.access;
    if (!access) return null;
    // An account whose „active" subscription no card pays got a free year from a code: the badge says
    // so, and until when — „Plătit" alone read as „gave money" on accounts that never paid anything.
    const codeYear = access.kind === "full" && access.reason === "paid" && !user.paysByCard && user.subscriptionEndsAt;
    const [label, tone] =
      access.kind === "full"
        ? access.reason === "free_forever"
          ? [t("accessFreeForever"), "bg-emerald-600/20 text-emerald-300"]
          : access.reason === "family_paid"
            ? [t("accessFamilyPaid"), "bg-green-600/20 text-green-300"]
            : access.reason === "org"
              ? [t("accessOrg"), "bg-green-600/20 text-green-300"]
              : access.reason === "staff"
                ? [t("accessStaff"), "bg-gray-600/30 text-gray-300"]
                : codeYear && user.subscriptionEndsAt
                  ? [t("accessCodeYear", { date: fmtDate(user.subscriptionEndsAt) }), "bg-emerald-600/20 text-emerald-300"]
                  : [t("accessPaidCard"), "bg-green-600/20 text-green-300"]
        : access.kind === "trial"
          ? [t("accessTrial", { days: access.daysLeft }), "bg-blue-600/20 text-blue-300"]
          : access.kind === "paused"
            ? [t("accessPaused", { date: fmtDate(access.since) }), "bg-amber-600/20 text-amber-300"]
            : [t("accessFree"), "bg-gray-600/30 text-gray-300"];
    return (
      <>
        <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${tone}`}>{label}</span>
        {codeYear && user.subscriptionEndsAt && (
          <div className="text-[11px] text-gray-500">{t("accessLeft", { days: daysUntil(user.subscriptionEndsAt) })}</div>
        )}
      </>
    );
  };

  /** Which code is behind this account, and until when — under the package name, in the list. */
  const codeLines = (user: UserRow) => {
    const codeYear = user.access?.kind === "full" && user.access.reason === "paid" && !user.paysByCard;
    return (
      <>
        {user.voucherUsed ? (
          <div className="text-[11px] text-gray-500">
            {user.paysByCard
              ? t("codeAtPayment", { code: user.voucherUsed.code, percent: user.voucherUsed.percent })
              : t("codeUsed", { code: user.voucherUsed.code, date: fmtDate(user.voucherUsed.at) })}
          </div>
        ) : (
          // A free year from before the code was recorded: say it plainly instead of leaving a gap.
          codeYear && <div className="text-[11px] text-gray-600">{t("codeUnknown")}</div>
        )}
        {user.voucherKept && (
          <div className="text-[11px] text-gray-500">
            {t("codeKept", { code: user.voucherKept.code })}{" "}
            <span className={user.voucherKept.gone ? "text-amber-500" : ""}>
              {user.voucherKept.gone
                ? t("codeKeptGone")
                : user.voucherKept.expiresAt
                  ? t("codeKeptUntil", { date: fmtDate(user.voucherKept.expiresAt) })
                  : t("codeKeptNoEnd")}
            </span>
          </div>
        )}
      </>
    );
  };

  const fetchDomains = async () => {
    const res = await fetch("/api/admin/domains");
    if (res.ok) {
      const data = await res.json();
      setDomains(data.map((d: DomainOption & Record<string, unknown>) => ({ id: d.id, name: d.name, slug: d.slug })));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const handleBan = async (userId: string, ban: boolean) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: ban, bannedReason: ban ? banReason : null }),
    });
    setBanModal(null);
    setBanReason("");
    fetchUsers();
  };

  // Impersonation UI removed 2026-07-12: the button discarded the real signed
  // token the endpoint returns and only showed an alert — misleading. Full
  // login-as-user is a separate feature (set-cookie + un-impersonate + audit),
  // deferred. The /api/admin/users/[id]/impersonate route stays (superadmin-gated).

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    if (res.ok) {
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
    } else {
      const data = await res.json();
      setCreateError(data.error || t("failedCreateUser"));
    }
  };

  const openEnrollModal = (userId: string, userName: string | null) => {
    setEnrollModal({ userId, userName });
    setEnrollDomainId("");
    setEnrollRoles(["STUDENT"]);
    setEnrollError("");
    fetchDomains();
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModal || !enrollDomainId) return;
    setEnrollLoading(true);
    setEnrollError("");

    const res = await fetch(`/api/admin/users/${enrollModal.userId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId: enrollDomainId, roles: enrollRoles }),
    });

    if (res.ok) {
      setEnrollModal(null);
      fetchUsers();
    } else {
      const data = await res.json();
      setEnrollError(data.error || t("failedEnrollUser"));
    }
    setEnrollLoading(false);
  };

  const handleUnenroll = async (userId: string, domainName: string, domainSlug: string) => {
    if (!confirm(`Remove enrollment for ${domainName}?`)) return;
    // Find domain ID from slug
    const domain = domains.length > 0
      ? domains.find(d => d.slug === domainSlug)
      : null;
    if (!domain) {
      // Fetch domains first
      const res = await fetch("/api/admin/domains");
      if (res.ok) {
        const allDomains = await res.json();
        const found = allDomains.find((d: DomainOption) => d.slug === domainSlug);
        if (found) {
          await fetch(`/api/admin/users/${userId}/enroll?domainId=${found.id}`, { method: "DELETE" });
          fetchUsers();
        }
      }
    } else {
      await fetch(`/api/admin/users/${userId}/enroll?domainId=${domain.id}`, { method: "DELETE" });
      fetchUsers();
    }
  };

  const toggleEnrollRole = (role: string) => {
    setEnrollRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Initial load
  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <AccessTrialPanel refreshKey={panelKey} />

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showCreate ? t("cancel") : t("createUserToggle")}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateUser} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("userName")}</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("userEmail")}</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("password")}</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("role")}</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="user">{t("roleUser")}</option>
                <option value="superadmin">{t("roleSuperadmin")}</option>
              </select>
            </div>
          </div>
          {createError && <p className="text-sm text-red-400">{createError}</p>}
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t("createUserSubmit")}
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchUsersHint")}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {t("search")}
        </button>
      </form>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={onlyFreeForever}
          onChange={(e) => {
            setOnlyFreeForever(e.target.checked);
            setPage(1);
            void fetchUsers(1, search, e.target.checked);
          }}
          className="h-4 w-4 accent-emerald-500"
        />
        {t("onlyFreeForever")}
      </label>

      {/* The period the two presence columns read. The sign-in column ignores it — „when did this
          person last come" is not a question about a window. */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-400">{t("presencePeriod")}</span>
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-700">
          {([1, 7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDays(d);
                setPage(1);
                void fetchUsers(1, search, onlyFreeForever, d);
              }}
              className={`px-3 py-1.5 ${days === d ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              {d === 1 ? t("presenceToday") : d === 7 ? t("presenceDays7") : t("presenceDays30")}
            </button>
          ))}
        </div>
        {estimated && <span className="text-xs text-amber-400">{t("presenceEstimatedNote")}</span>}
      </div>

      {loading ? (
        <p className="text-gray-400">{t("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3">{t("userName")}</th>
                <th className="px-4 py-3">{t("userEmail")}</th>
                <th className="px-4 py-3">{t("domainsRoles")}</th>
                <th className="px-4 py-3">{t("userSubscription")}</th>
                <th className="px-4 py-3">{t("presenceLastLogin")}</th>
                <th className="px-4 py-3">{t("presenceVisits")}</th>
                <th className="px-4 py-3">{t("presenceTime")}</th>
                <th className="px-4 py-3">{t("userStatus")}</th>
                <th className="px-4 py-3">{t("userActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-900/50">
                  <td className="px-4 py-3 text-white">
                    {user.name || "—"}
                    {user.isSuperAdmin && (
                      <span className="ml-2 rounded bg-purple-600/20 px-1.5 py-0.5 text-xs text-purple-400">
                        SuperAdmin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.enrollments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.enrollments.map((e, i) => (
                          <span
                            key={i}
                            className="group inline-flex items-center gap-1 rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-300"
                          >
                            <strong>{e.domain.name}</strong>: {e.roles.join(", ")}
                            <button
                              onClick={() => handleUnenroll(user.id, e.domain.name, e.domain.slug)}
                              className="ml-1 hidden group-hover:inline text-red-400 hover:text-red-300"
                              title={t("removeEnrollment")}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">{t("noEnrollments")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {user.subscriptionPlan?.name || t("noPlan")}
                    {user.subscriptionStatus && (
                      <span className={`ml-1 text-xs ${
                        user.subscriptionStatus === "active" ? "text-green-400" :
                        user.subscriptionStatus === "trialing" ? "text-blue-400" :
                        "text-yellow-400"
                      }`}>
                        ({user.subscriptionStatus})
                      </span>
                    )}
                    {codeLines(user)}
                    <div>{accessBadge(user)}</div>
                  </td>

                  {/* When the account last came, and on what. The headline is the freshest hard
                      evidence — a stay on the site, a sign-in, a trace of work — because a signed-in
                      session lasts 30 days without signing in again, so the sign-in stamp alone can
                      read „acum 30 de zile" for someone who was studying an hour ago. The subject
                      carries its own age, so yesterday's visit is never paired with old work as if
                      they were one fact. */}
                  <td className="px-4 py-3">
                    {(() => {
                      const at = (iso: string | null) => (iso ? new Date(iso).getTime() : null);
                      const login = at(user.lastLoginAt);
                      const seen = at(user.presence.lastSeenAt);
                      const trace = at(user.presence.lastTraceAt);
                      const best = Math.max(login ?? 0, seen ?? 0, trace ?? 0);

                      if (!best) {
                        // „niciodată" is only true for an account created after we started measuring;
                        // for an older one all we honestly know is that it has not come back since.
                        const bornAfter =
                          trackingStartedAt && new Date(user.createdAt) >= new Date(trackingStartedAt);
                        return (
                          <>
                            <div className="text-gray-400">
                              {bornAfter || !trackingStartedAt
                                ? t("presenceNever")
                                : t("presenceNoRecord", { date: fmtDate(trackingStartedAt) })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t("presenceCreated", { date: fmtDate(user.createdAt) })}
                            </div>
                            <div className="text-xs text-gray-500">{t("presenceNoDomain")}</div>
                          </>
                        );
                      }

                      const kind =
                        best === seen
                          ? t("presenceKindOnSite")
                          : best === login
                            ? t("presenceKindSignIn")
                            : t("presenceKindActivity");
                      const bestIso = new Date(best).toISOString();
                      const traceIsOlder = trace !== null && best - trace > 60 * 60_000;
                      return (
                        <>
                          <div className="text-white">{fmtAgo(bestIso)}</div>
                          <div className="text-xs text-gray-500">
                            {kind} · {fmtDateTime(bestIso)}
                          </div>
                          {login !== null && best !== login && (
                            <div className="text-xs text-gray-500">
                              {t("presenceSignedInAt", { date: fmtDateTime(user.lastLoginAt as string) })}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {user.presence.lastDomain
                              ? t("presenceOnDomain", { domain: user.presence.lastDomain }) +
                                (traceIsOlder ? ` · ${fmtAgo(user.presence.lastTraceAt as string)}` : "")
                              : t("presenceNoDomain")}
                          </div>
                        </>
                      );
                    })()}
                  </td>

                  <td className="px-4 py-3">
                    {/* A zero over a rebuilt stretch is not „nobody came" — a parent account leaves no
                        answers or lessons behind, so there is nothing to rebuild it from. It says so. */}
                    <div className="text-white">
                      {user.presence.visits === 0
                        ? estimated
                          ? "—"
                          : "0"
                        : `${estimated ? "≈ " : ""}${user.presence.visits}`}
                    </div>
                    {user.presence.visits === 0 && (
                      <div className="text-xs text-gray-500">
                        {estimated ? t("presenceNoTrace") : t("presenceNoVisits")}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-white">
                      {estimated && user.presence.ms > 0 ? "≈ " : ""}
                      {fmtDuration(user.presence.ms)}
                    </div>
                    {user.presence.visits > 1 && (
                      <div className="text-xs text-gray-500">
                        {t("presencePerVisit", {
                          time: fmtDuration(Math.round(user.presence.ms / user.presence.visits)),
                        })}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="rounded bg-red-600/20 px-2 py-0.5 text-xs text-red-400">
                        Banned
                      </span>
                    ) : (
                      <span className="rounded bg-green-600/20 px-2 py-0.5 text-xs text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!user.isSuperAdmin && (
                      <label className="mb-2 flex items-center gap-2 text-xs text-gray-300" title={t("freeForeverHint")}>
                        <input
                          type="checkbox"
                          checked={user.freeForever}
                          disabled={savingFreeForever === user.id}
                          onChange={(e) => void handleFreeForever(user.id, e.target.checked)}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        {t("freeForever")}
                      </label>
                    )}
                    {!user.paysByCard && !user.freeForever && user.access?.kind === "full" && user.access.reason === "paid" && user.subscriptionEndsAt && (
                      <p className="mb-2 text-[11px] text-emerald-400/80">
                        {t("freeForeverHasCode", { date: fmtDate(user.subscriptionEndsAt) })}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => openEnrollModal(user.id, user.name)}
                        className="rounded bg-blue-600/20 px-2 py-1 text-xs text-blue-400 hover:bg-blue-600/30"
                      >
                        Enroll
                      </button>
                      {user.isBanned ? (
                        <button
                          onClick={() => handleBan(user.id, false)}
                          className="rounded bg-green-600/20 px-2 py-1 text-xs text-green-400 hover:bg-green-600/30"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanModal({ id: user.id, name: user.name })}
                          className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-400 hover:bg-red-600/30"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => { setPage(page - 1); fetchUsers(page - 1); }}
            disabled={page <= 1}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => { setPage(page + 1); fetchUsers(page + 1); }}
            disabled={page >= totalPages}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              {t("banUser", { name: banModal.name || t("userFallback") })}
            </h3>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t("banReasonPlaceholder")}
              className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setBanModal(null); setBanReason(""); }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleBan(banModal.id, true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                {t("confirmBan")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              {t("enrollUserInDomain", { name: enrollModal.userName || t("userFallback") })}
            </h3>

            <form onSubmit={handleEnroll} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t("domain")}</label>
                {domains.length === 0 ? (
                  <p className="text-sm text-yellow-400">
                    No domains created yet. Go to Admin → Domains to create one first.
                  </p>
                ) : (
                  <select
                    value={enrollDomainId}
                    onChange={(e) => {
                      const domId = e.target.value;
                      setEnrollDomainId(domId);
                      // Pre-populate roles if user already enrolled on this domain
                      const user = users.find((u) => u.id === enrollModal?.userId);
                      const existing = user?.enrollments.find((en) => en.domain.id === domId);
                      setEnrollRoles(existing ? [...existing.roles] : ["STUDENT"]);
                    }}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a domain...</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.slug})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t("userRoles")}</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleEnrollRole(role)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        enrollRoles.includes(role)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {enrollError && <p className="text-sm text-red-400">{enrollError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEnrollModal(null)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!enrollDomainId || enrollRoles.length === 0 || enrollLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {enrollLoading ? t("loading") : t("enrollUser")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
