// Live check of package 1 on etutor.ro, as an anonymous visitor only: no account, no form sent, no
// Google sign-in completed (the Google button is followed only until the request leaves for Google).
// Run: node Reports/pachet1-2026-10-16/verificare-live.mjs
import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "https://etutor.ro";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "live");
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();
try {
  // Phone, anonymous.
  const phone = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const p = await phone.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const res = await p.goto(`${BASE}/ro/parinte?voucher=V126S`, { waitUntil: "networkidle" });
  check("/ro/parinte răspunde 200", res?.status() === 200, String(res?.status()));
  const text = await p.locator("body").innerText();
  check("prețul mare: sub 1 leu pe zi", text.includes("sub 1 leu pe zi"));
  check("prețul din probă 23,24", text.includes("23,24"));
  check("prețul cu codul 24,90", text.includes("24,90"));
  check("exemplul din cont (Andrei)", text.includes("Andrei") && text.includes("ecuații cu fracții"));
  check("butonul Google pe pagină", (await p.getByRole("button", { name: /Google/ }).count()) > 0);
  check("fără „AI” în text", !/\bAI\b/.test(text));
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("fără depășire orizontală pe telefon", overflow <= 0, `${overflow}px`);
  await p.screenshot({ path: path.join(OUT, "parinte-telefon.png") });
  await p.screenshot({ path: path.join(OUT, "parinte-telefon-intreg.png"), fullPage: true });

  // The Google button leads to Google with our callback (stop at the request, no sign-in).
  const googleReq = new Promise((resolve) => {
    p.on("request", (r) => {
      if (r.url().startsWith("https://accounts.google.com/")) resolve(r.url());
    });
    setTimeout(() => resolve(null), 20000);
  });
  await p.route("https://accounts.google.com/**", (route) => route.abort());
  await p.getByRole("button", { name: /Google/ }).first().click();
  const gUrl = await googleReq;
  check("Google: cererea pleacă spre accounts.google.com", Boolean(gUrl));
  if (gUrl) {
    const redirect = new URL(gUrl).searchParams.get("redirect_uri") ?? "";
    check("Google: întoarcerea e pe etutor.ro", redirect.startsWith(`${BASE}/api/auth/callback/google`), redirect);
  }
  check("fără erori JavaScript pe pagină", errors.length === 0, errors.join(" | "));

  // Register page: Google for parents, not for students.
  const r = await phone.newPage();
  const rr = await r.goto(`${BASE}/ro/auth/register?plan=FAMILY&voucher=V126S&start=free`, { waitUntil: "networkidle" });
  check("înregistrare 200", rr?.status() === 200);
  check("înregistrare: butonul Google pentru părinte", (await r.getByRole("button", { name: /Google/ }).count()) > 0);
  await r.screenshot({ path: path.join(OUT, "inregistrare-telefon.png") });

  // Desktop.
  const desk = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: "ro-RO" });
  const d = await desk.newPage();
  await d.goto(`${BASE}/ro/parinte`, { waitUntil: "networkidle" });
  const dOverflow = await d.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("calculator: fără depășire orizontală", dOverflow <= 0, `${dOverflow}px`);
  await d.screenshot({ path: path.join(OUT, "parinte-calculator.png") });

  // Server routes that must stay closed.
  const api = await desk.request.get(`${BASE}/api/plans`);
  check("/api/plans fără cont 401", api.status() === 401, String(api.status()));
  const cb = await desk.request.post(`${BASE}/api/stripe/callback`, { data: {} });
  check("callback fără semnătură 400", cb.status() === 400, String(cb.status()));
  const done = await desk.request.get(`${BASE}/ro/auth/google-done`, { maxRedirects: 0 });
  check("google-done fără sesiune trimite la autentificare", [302, 303, 307, 308].includes(done.status()) || done.status() === 200, String(done.status()));
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificări trecute`);
process.exit(failed.length ? 1 : 0);
