"use client";

import { useState } from "react";

interface EscalationTemplate {
  id: string;
  language: string;
  channel: string;
  triggerType: string;
  templateId: string;
  content: string;
  variables: unknown;
  isActive: boolean;
}

const CHANNELS = ["push", "whatsapp", "sms", "email"];
const TRIGGER_TYPES = ["missed_session", "low_score", "inactivity", "streak_lost"];

export function EscalationTemplateManager({
  initialTemplates,
}: {
  initialTemplates: EscalationTemplate[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    language: "ro",
    channel: "whatsapp",
    triggerType: "missed_session",
    templateId: "",
    content: "",
    variables: "",
  });

  async function handleSave(id: string) {
    const res = await fetch("/api/admin/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: editContent }),
    });
    if (res.ok) {
      setTemplates(templates.map((t) => (t.id === id ? { ...t, content: editContent } : t)));
      setEditingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        variables: form.variables.split(",").map((v) => v.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setTemplates([...templates, created]);
      setIsCreating(false);
      setForm({ language: "ro", channel: "whatsapp", triggerType: "missed_session", templateId: "", content: "", variables: "" });
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch("/api/admin/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (res.ok) {
      setTemplates(templates.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
    }
  }

  const channelColors: Record<string, string> = {
    push: "bg-blue-900 text-blue-300",
    whatsapp: "bg-green-900 text-green-300",
    sms: "bg-yellow-900 text-yellow-300",
    email: "bg-purple-900 text-purple-300",
  };

  const groupedByChannel = CHANNELS.map((ch) => ({
    channel: ch,
    templates: templates.filter((t) => t.channel === ch),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {isCreating ? "Cancel" : "Add Template"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Trigger Type</label>
              <select
                value={form.triggerType}
                onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Template ID</label>
              <input
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                placeholder="e.g. whatsapp_custom_reminder"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Language</label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                <option value="ro">Romanian</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">
              Content (use {"{{variableName}}"} for dynamic values)
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Variables (comma-separated)</label>
            <input
              value={form.variables}
              onChange={(e) => setForm({ ...form, variables: e.target.value })}
              placeholder="userName, streakDays, score"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Create Template
          </button>
        </form>
      )}

      {groupedByChannel.map(({ channel, templates: channelTemplates }) => (
        <div key={channel}>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-white">
            <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${channelColors[channel]}`}>
              {channel}
            </span>
            <span className="text-sm text-gray-500">({channelTemplates.length} templates)</span>
          </h3>
          <div className="space-y-2">
            {channelTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className={`rounded-lg border p-4 ${tpl.isActive ? "border-gray-700 bg-gray-900" : "border-gray-800 bg-gray-950 opacity-50"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-500">{tpl.templateId}</code>
                      <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                        {tpl.triggerType.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-500">{tpl.language.toUpperCase()}</span>
                    </div>
                    {editingId === tpl.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
                        />
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() => handleSave(tpl.id)}
                            className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-300">{tpl.content}</p>
                    )}
                    {Array.isArray(tpl.variables) && (tpl.variables as string[]).length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {(tpl.variables as string[]).map((v) => (
                          <span key={v} className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-blue-400">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(tpl.id);
                        setEditContent(tpl.content);
                      }}
                      className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggle(tpl.id, tpl.isActive)}
                      className={`rounded px-2 py-1 text-xs ${
                        tpl.isActive ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"
                      }`}
                    >
                      {tpl.isActive ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {channelTemplates.length === 0 && (
              <p className="text-sm text-gray-600">No templates for this channel.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
