// Închide sesiunile conturilor de test deschise de 00-descoperire.mjs și șterge fișierul cu cookie-uri.
//   JARS=<scratchpad>/jars.json node 03-deconectare.mjs
import { readFileSync, unlinkSync } from "node:fs";
import { client, BASE } from "./lib.mjs";
const { jars } = JSON.parse(readFileSync(process.env.JARS, "utf8"));
for (const [role, jar] of Object.entries(jars)) {
  const c = client(role); for (const [k, v] of Object.entries(jar)) c.jar.set(k, v);
  const { json } = await c.get("/api/auth/csrf");
  const cookie = [...c.jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const r = await fetch(`${BASE}/api/auth/signout`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded", cookie }, body: new URLSearchParams({ csrfToken: json.csrfToken, callbackUrl: `${BASE}/ro` }) });
  console.log(role.padEnd(12), "signout", r.status);
}
unlinkSync(process.env.JARS); console.log("jars deleted");
