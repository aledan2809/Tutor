// Faza 9 — stres ușor pe producție: 30 cereri GET simultane pe paginile publice de intrare.
const pages = ["/ro", "/ro/parinte", "/ro/preturi", "/ro/auth/signin", "/ro/try"];
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(p * a.length))];
for (const p of pages) {
  const t = []; let bad = 0;
  await Promise.all(Array.from({ length: 30 }, async () => {
    const t0 = Date.now();
    try { const r = await fetch("https://etutor.ro" + p, { headers: { "user-agent": "etutor-e2e-stress/1" } }); if (!r.ok) bad++; await r.arrayBuffer(); } catch { bad++; }
    t.push(Date.now() - t0);
  }));
  console.log(`${p.padEnd(16)} n=30 p50=${pct(t, 0.5)}ms p95=${pct(t, 0.95)}ms max=${Math.max(...t)}ms non-200=${bad}`);
}
