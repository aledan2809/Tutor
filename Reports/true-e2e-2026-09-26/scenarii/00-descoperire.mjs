// Pas 0: conturile de test intră o dată; cookie-urile se păstrează în scratchpad (nu în repo),
// ca rulările următoare să nu mai consume din bugetul de 20 autentificări/minut pe IP.
//   JARS=/cale/jars.json node 00-descoperire.mjs
import { writeFileSync } from "node:fs";
import { client, env, brief } from "./lib.mjs";
const JARS = process.env.JARS;
if (!JARS) throw new Error("JARS=<path in scratchpad> required");
const ROLES = ["SUPERADMIN", "ADMIN", "INSTRUCTOR", "STUDENT", "WATCHER", "INSTRUCTOR2"];
const out = {};
const info = {};
for (const role of ROLES) {
  const c = client(role);
  const r = await c.login(env[`${role}_EMAIL`], env[`${role}_PASSWORD`]);
  out[role] = Object.fromEntries(c.jar);
  info[role] = { id: r.user?.id ?? null, callback: r.callbackStatus, superadmin: !!r.user?.isSuperAdmin,
    enrollments: (r.user?.enrollments ?? []).map((e) => ({ slug: e.domainSlug, id: e.domainId, roles: e.roles })) };
  console.log(role.padEnd(12), r.user?.id ? "OK" : "FAIL", r.callbackStatus, JSON.stringify(info[role].enrollments));
}
writeFileSync(JARS, JSON.stringify({ jars: out, info }, null, 1));
// Domenii (toate, inclusiv private) + id-ul unui elev de test din altă materie.
const sa = client("SUPERADMIN"); for (const [k, v] of Object.entries(out.SUPERADMIN)) sa.jar.set(k, v);
const d = await sa.get("/api/admin/domains");
console.log("admin/domains", brief(d));
const list = d.json?.domains ?? d.json ?? [];
for (const x of Array.isArray(list) ? list : []) console.log("  ", x.slug, x.id, x.visibility ?? "", x.isActive ?? "");
for (const key of ["POSTA_DEMO", "JOURNEY"]) {
  const u = await sa.get(`/api/admin/users?search=${encodeURIComponent(env[`${key}_EMAIL`])}&limit=5`);
  const users = u.json?.users ?? [];
  const hit = users.find((x) => (x.email || "").toLowerCase() === env[`${key}_EMAIL`].toLowerCase());
  console.log(key, brief(u), hit ? `id=${hit.id} enrollments=${JSON.stringify((hit.enrollments ?? []).map((e) => e.domain?.slug ?? e.domainId))}` : "not found");
}
