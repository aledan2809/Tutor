"use client";

import { useState } from "react";

interface Labels {
  name: string;
  email: string;
  track: string;
  trackPlaceholder: string;
  subject: string;
  subjectPlaceholder: string;
  experience: string;
  experiencePlaceholder: string;
  cv: string;
  cvHint: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  error: string;
}

export function CreatorWaitlistForm({
  locale,
  tracks,
  labels,
}: {
  locale: string;
  tracks: Record<string, string[]>;
  labels: Labels;
}) {
  const [form, setForm] = useState({ name: "", email: "", track: "", subject: "", experience: "" });
  const [cv, setCv] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const trackNames = Object.keys(tracks);
  const subjects = form.track ? tracks[form.track] ?? [] : [];

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value, ...(k === "track" ? { subject: "" } : {}) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("track", form.track);
      fd.append("subject", form.subject);
      fd.append("experience", form.experience);
      fd.append("locale", locale);
      if (cv) fd.append("cv", cv);
      const res = await fetch("/api/creatori-waitlist", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || labels.error);
        return;
      }
      setDone(true);
    } catch {
      setError(labels.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-semibold text-white">{labels.successTitle}</h3>
        <p className="mt-2 text-gray-300">{labels.successBody}</p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{labels.name}</label>
        <input className={inputCls} value={form.name} onChange={setField("name")} required minLength={2} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{labels.email}</label>
        <input className={inputCls} type="email" value={form.email} onChange={setField("email")} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{labels.track}</label>
        <select className={inputCls} value={form.track} onChange={setField("track")} required>
          <option value="" disabled>{labels.trackPlaceholder}</option>
          {trackNames.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{labels.subject}</label>
        <select className={inputCls} value={form.subject} onChange={setField("subject")} required disabled={!form.track}>
          <option value="" disabled>{labels.subjectPlaceholder}</option>
          {subjects.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{labels.experience}</label>
        <textarea className={inputCls} rows={3} value={form.experience} onChange={setField("experience")} placeholder={labels.experiencePlaceholder} maxLength={2000} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{labels.cv}</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setCv(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
        />
        <p className="mt-1 text-xs text-gray-500">{labels.cvHint}</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
