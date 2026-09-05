"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatJoinCode } from "@/lib/join-code";

interface Props {
  domain?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    isActive: boolean;
    instructorEnabled: boolean;
    visibility: "PUBLIC" | "PRIVATE";
    joinCode?: string | null;
  };
}

export function DomainForm({ domain }: Props) {
  const router = useRouter();
  const isEdit = !!domain;

  const [form, setForm] = useState({
    name: domain?.name || "",
    slug: domain?.slug || "",
    description: domain?.description || "",
    icon: domain?.icon || "",
    isActive: domain?.isActive ?? true,
    instructorEnabled: domain?.instructorEnabled ?? false,
    // New domains start PRIVATE: nothing is public until someone decides it is.
    visibility: domain?.visibility ?? ("PRIVATE" as "PUBLIC" | "PRIVATE"),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Access code — issued/withdrawn on its own endpoint so it never rides along
  // with an unrelated "Update Domain" save.
  const [joinCode, setJoinCode] = useState<string | null>(domain?.joinCode ?? null);
  const [codeBusy, setCodeBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function changeJoinCode(action: "rotate" | "clear") {
    if (!domain) return;
    const question =
      action === "clear"
        ? "Withdraw the access code? Nobody can self-enroll with it any more. People already enrolled keep access."
        : joinCode
          ? "Issue a new code? The current one stops working for new sign-ups. People already enrolled keep access."
          : null;
    if (question && !confirm(question)) return;
    setCodeBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/domains/${domain.id}/join-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        setError("Could not change the access code");
        return;
      }
      const data = await res.json();
      setJoinCode(data.joinCode ?? null);
      setCopied(false);
    } catch {
      setError("Network error");
    } finally {
      setCodeBusy(false);
    }
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name" && !isEdit && typeof value === "string") {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Going public is the one change here that exposes content to the open
    // internet (homepage demo, registration picker, no-account quiz). Ask once.
    if (
      isEdit &&
      domain.visibility === "PRIVATE" &&
      form.visibility === "PUBLIC" &&
      !confirm(
        `Make "${form.name}" public?\n\nIt will be listed to everyone, appear in the sign-up picker and the no-account demo, and anyone will be able to enroll. Enrollments already made stay as they are.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/domains/${domain.id}` : "/api/admin/domains";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.push("/dashboard/admin/domains");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Aviation"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="aviation"
            pattern="^[a-z0-9-]+$"
            required
            disabled={isEdit}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          placeholder="Domain description"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Icon (emoji or URL)</label>
        <input
          type="text"
          value={form.icon}
          onChange={(e) => updateField("icon", e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          placeholder="✈️"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 block text-sm text-gray-400">Who can reach this domain</legend>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-800 p-3 has-[:checked]:border-amber-700/60">
          <input
            type="radio"
            name="visibility"
            value="PRIVATE"
            checked={form.visibility === "PRIVATE"}
            onChange={() => updateField("visibility", "PRIVATE")}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm text-white">Private</span>
            <span className="block text-xs text-gray-500">
              Invisible to everyone else — not in any list, picker, search or public demo. Only
              people you enroll here (or who redeem an access code) can see it exists.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-800 p-3 has-[:checked]:border-blue-700/60">
          <input
            type="radio"
            name="visibility"
            value="PUBLIC"
            checked={form.visibility === "PUBLIC"}
            onChange={() => updateField("visibility", "PUBLIC")}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm text-white">Public</span>
            <span className="block text-xs text-gray-500">
              Listed to everyone, offered at sign-up and in the no-account demo; anyone can enroll.
            </span>
          </span>
        </label>
      </fieldset>

      {isEdit && (
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-sm text-gray-400">Access code</p>
          <p className="mb-2 text-xs text-gray-500">
            Anyone signed in who enters this code enrolls themselves — the only self-service way
            into a private domain. Rotate it to cut off further sign-ups; enrollments already made
            are never touched.
          </p>
          {joinCode ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-gray-800 px-3 py-2 font-mono text-lg tracking-widest text-white">
                {formatJoinCode(joinCode)}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(formatJoinCode(joinCode)).then(() => setCopied(true));
                }}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={codeBusy}
                onClick={() => changeJoinCode("rotate")}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"
              >
                Rotate
              </button>
              <button
                type="button"
                disabled={codeBusy}
                onClick={() => changeJoinCode("clear")}
                className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50"
              >
                Withdraw
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">No code in circulation.</span>
              <button
                type="button"
                disabled={codeBusy}
                onClick={() => changeJoinCode("rotate")}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                {codeBusy ? "Issuing..." : "Issue a code"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
            className="rounded border-gray-700 bg-gray-800"
          />
          <label htmlFor="isActive" className="text-sm text-gray-400">
            Active
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="instructorEnabled"
            checked={form.instructorEnabled}
            onChange={(e) => updateField("instructorEnabled", e.target.checked)}
            className="rounded border-gray-700 bg-gray-800"
          />
          <label htmlFor="instructorEnabled" className="text-sm text-gray-400">
            Enable Instructor Mode
          </label>
          <span className="text-xs text-gray-600">
            (allows instructor dashboards and student management for this domain)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Domain" : "Create Domain"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
