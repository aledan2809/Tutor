// Unelte comune pentru fazele 6/7/9 (True E2E 2026-09-26), rulate pe PRODUCȚIE (etutor.ro)
// numai cu conturile de test din seif. Parolele nu se tipăresc niciodată.
import { readFileSync } from "node:fs";

export const BASE = process.env.E2E_BASE || "https://etutor.ro";

export const env = Object.fromEntries(
  readFileSync("/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env", "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

export function client(label) {
  const jar = new Map();
  const store = (r) => { for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar.set(kv.slice(0, i), kv.slice(i + 1)); } };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  async function req(method, path, body, extra = {}) {
    const t0 = Date.now();
    const headers = { cookie: cookie(), ...(extra.headers || {}) };
    let payload;
    if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    const r = await fetch(`${BASE}${path}`, { method, headers, body: payload, redirect: extra.redirect || "manual" });
    store(r);
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, ms: Date.now() - t0, json, text, location: r.headers.get("location") };
  }
  return {
    label,
    jar,
    get: (p, o) => req("GET", p, undefined, o),
    post: (p, b, o) => req("POST", p, b, o),
    patch: (p, b, o) => req("PATCH", p, b, o),
    del: (p, b, o) => req("DELETE", p, b, o),
    async login(email, password) {
      const c = await fetch(`${BASE}/api/auth/csrf`, { headers: { cookie: cookie() } }); store(c);
      const { csrfToken } = await c.json();
      const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
        method: "POST", redirect: "manual",
        headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie() },
        body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${BASE}/ro/dashboard` }),
      });
      store(r);
      const s = await (await fetch(`${BASE}/api/auth/session`, { headers: { cookie: cookie() } })).json().catch(() => null);
      return { callbackStatus: r.status, location: r.headers.get("location"), user: s?.user ?? null };
    },
  };
}

// Corp scurt pentru raport: fără emailuri/nume, doar chei + erori.
export function brief(res, max = 140) {
  if (!res) return "—";
  if (res.json && typeof res.json === "object") {
    if (res.json.error) return `${res.status} ${JSON.stringify({ error: res.json.error, ...(res.json.message ? { message: String(res.json.message).slice(0, 80) } : {}) }).slice(0, max)}`;
    const keys = Array.isArray(res.json) ? `array[${res.json.length}]` : Object.keys(res.json).slice(0, 8).join(",");
    return `${res.status} {${keys}}`;
  }
  return `${res.status} ${res.text.replace(/\s+/g, " ").slice(0, 80)}`;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
