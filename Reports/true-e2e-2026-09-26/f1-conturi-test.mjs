// Faza 1: fiecare cont de test din seif intră pe producție și are rolurile așteptate.
//   node Reports/true-e2e-2026-09-26/f1-conturi-test.mjs
import { readFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync("/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env", "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const BASE = "https://etutor.ro";
const ROLES = ["SUPERADMIN", "ADMIN", "INSTRUCTOR", "STUDENT", "WATCHER", "INSTRUCTOR2", "POSTA_DEMO", "JOURNEY"];
async function login(email, password) {
  const jar = new Map();
  const store = (r) => { for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar.set(kv.slice(0, i), kv.slice(i + 1)); } };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const c = await fetch(`${BASE}/api/auth/csrf`); store(c); const { csrfToken } = await c.json();
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie() }, body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${BASE}/ro/dashboard` }) });
  store(r);
  const s = await (await fetch(`${BASE}/api/auth/session`, { headers: { cookie: cookie() } })).json();
  return s?.user ?? null;
}
for (const role of ROLES) {
  const email = env[`${role}_EMAIL`], pw = env[`${role}_PASSWORD`];
  if (!email) { console.log(`${role.padEnd(12)} — lipsește din seif`); continue; }
  const u = await login(email, pw).catch((e) => ({ err: String(e) }));
  const roles = u?.enrollments ? [...new Set(u.enrollments.flatMap((e) => e.roles))].join(",") : "";
  console.log(`${role.padEnd(12)} ${u?.id ? "OK  " : "FAIL"} ${email}  ${u?.isSuperAdmin ? "superadmin " : ""}${roles}`);
}
