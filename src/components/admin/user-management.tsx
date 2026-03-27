"use client";

import { useState } from "react";
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

export function UserManagement() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [banModal, setBanModal] = useState<{ id: string; name: string | null } | null>(null);
  const [banReason, setBanReason] = useState("");

  const fetchUsers = async (p = page, s = search) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${p}&search=${encodeURIComponent(s)}`);
    const data = await res.json();
    setUsers(data.users);
    setTotalPages(data.totalPages);
    setLoading(false);
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

  // Initial load
  useState(() => { fetchUsers(); });

  return (
    <div className="space-y-4">
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
                <th className="px-4 py-3">{t("userRoles")}</th>
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
                    {user.enrollments.map((e, i) => (
                      <span key={i} className="mr-1 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-300">
                        {e.domain.name}: {e.roles.join(", ")}
                      </span>
                    ))}
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
                    <div className="flex gap-1">
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
    </div>
  );
}
