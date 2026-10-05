// Probă: aceeași persoană (același telefon+nume) intră de două ori pe codul comun,
// din două "browsere" (fără cookie). Măsurăm: utilizatori creați, joinCodeUses, Recipient.userId.
const BASE = "http://localhost:3113";
const CODE = "QAE2E1005A";
const phone = "0799100510";
async function enter(tag) {
  const jar = new Map();
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const grab = (res) => { for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar.set(kv.slice(0, i), kv.slice(i + 1)); } };
  const r1 = await fetch(`${BASE}/api/auth/csrf`); grab(r1);
  const { csrfToken } = await r1.json();
  const body = new URLSearchParams({ csrfToken, code: CODE, lastName: "qa-e2e-1005-Reintrare", firstName: tag, phone, json: "true" });
  const r2 = await fetch(`${BASE}/api/auth/callback/guest-access`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieHeader() }, body, redirect: "manual" });
  grab(r2); console.log(tag, "location:", r2.headers.get("location"), "cookies:", [...jar.keys()].join(","));
  const r3 = await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: cookieHeader() } });
  const s = await r3.json();
  console.log(tag, "callback", r2.status, "session user:", s?.user?.id ?? null, s?.user?.name ?? null);
}
await enter("Telefon1");
await enter("Telefon2");
