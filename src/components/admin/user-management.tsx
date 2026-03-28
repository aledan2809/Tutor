"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isSuperAdmin: boolean;
  isBanned: boolean;
  bannedReason: string | null;
  subscriptionStatus: string | null;
  createdAt: string;
  enrollments: { roles: string[]; domain: { name: string; slug: string } }[];
  subscriptionPlan: { name: string } | null;
}

interface DomainOption {
  id: string;
  name: string;
  slug: string;
}

const ROLES = ["STUDENT", "WATCHER", "INSTRUCTOR", "ADMIN"] as const;

export function UserManagement() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
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

  const fetchUsers = async (p = page, s = search) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${p}&search=${encodeURIComponent(s)}`);
    const data = await res.json();
    setUsers(data.users);
    setTotalPages(data.totalPages);
    setLoading(false);
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

  const handleImpersonate = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/impersonate`, { method: "POST" });
    const data = await res.json();
    if (data.targetUser) {
      alert(`Impersonation logged for ${data.targetUser.email}`);
    }
  };

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
      setCreateError(data.error || "Failed to create user");
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
      setEnrollError(data.error || "Failed to enroll user");
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
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showCreate ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateUser} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
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
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">SuperAdmin</option>
              </select>
            </div>
          </div>
          {createError && <p className="text-sm text-red-400">{createError}</p>}
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Create User
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchUsers")}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {t("search")}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400">{t("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3">{t("userName")}</th>
                <th className="px-4 py-3">{t("userEmail")}</th>
                <th className="px-4 py-3">Domains & Roles</th>
                <th className="px-4 py-3">{t("userSubscription")}</th>
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
                              title="Remove enrollment"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">No enrollments</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {user.subscriptionPlan?.name || "Free"}
                    {user.subscriptionStatus && (
                      <span className={`ml-1 text-xs ${
                        user.subscriptionStatus === "active" ? "text-green-400" :
                        user.subscriptionStatus === "trialing" ? "text-blue-400" :
                        "text-yellow-400"
                      }`}>
                        ({user.subscriptionStatus})
                      </span>
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
                      <button
                        onClick={() => handleImpersonate(user.id)}
                        className="rounded bg-yellow-600/20 px-2 py-1 text-xs text-yellow-400 hover:bg-yellow-600/30"
                      >
                        Impersonate
                      </button>
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
              Ban {banModal.name || "User"}
            </h3>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban..."
              className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setBanModal(null); setBanReason(""); }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBan(banModal.id, true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Confirm Ban
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
              Enroll {enrollModal.userName || "User"} in Domain
            </h3>

            <form onSubmit={handleEnroll} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Domain</label>
                {domains.length === 0 ? (
                  <p className="text-sm text-yellow-400">
                    No domains created yet. Go to Admin → Domains to create one first.
                  </p>
                ) : (
                  <select
                    value={enrollDomainId}
                    onChange={(e) => setEnrollDomainId(e.target.value)}
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
                <label className="block text-sm text-gray-400 mb-2">Roles</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!enrollDomainId || enrollRoles.length === 0 || enrollLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {enrollLoading ? "Enrolling..." : "Enroll User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
