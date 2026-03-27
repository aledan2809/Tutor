"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface GroupFormProps {
  domains: { id: string; name: string; slug: string }[];
  students?: { id: string; name: string | null; email: string | null }[];
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    domainId: string;
    members?: { user: { id: string; name: string | null; email: string | null } }[];
  };
}

export function GroupForm({ domains, students, initialData }: GroupFormProps) {
  const t = useTranslations("instructor");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [domainId, setDomainId] = useState(initialData?.domainId ?? domains[0]?.id ?? "");
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    initialData?.members?.map((m) => m.user.id) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = initialData
        ? `/api/dashboard/instructor/groups/${initialData.id}`
        : "/api/dashboard/instructor/groups";
      const method = initialData ? "PATCH" : "POST";

      const body = initialData
        ? {
            name,
            description,
            addStudentIds: selectedStudents.filter(
              (id) => !initialData.members?.some((m) => m.user.id === id)
            ),
            removeStudentIds:
              initialData.members
                ?.filter((m) => !selectedStudents.includes(m.user.id))
                .map((m) => m.user.id) ?? [],
          }
        : { name, description, domainId, studentIds: selectedStudents };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to save group");
      }

      router.push("/dashboard/instructor/groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-600 bg-red-600/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {t("groupName")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          placeholder={t("groupNamePlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {t("description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {!initialData && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            {t("domain")}
          </label>
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {students && students.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            {t("selectStudents")} ({selectedStudents.length})
          </label>
          <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-2">
            {students.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(s.id)}
                  onChange={() => toggleStudent(s.id)}
                  className="rounded border-gray-600"
                />
                <span className="text-sm text-white">{s.name ?? s.email}</span>
                <span className="text-xs text-gray-500">{s.email}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? tCommon("loading") : tCommon("save")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
