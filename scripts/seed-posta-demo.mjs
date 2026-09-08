#!/usr/bin/env node
/**
 * Demo-ul Poșta Română, construit prin API-ul aplicației, nu prin scriere directă în bază.
 *
 * De ce prin API: fiecare pas (materie nouă, cod de acces, publicare) trece prin
 * aceleași verificări și scrie în jurnalul de audit ca și cum l-ar fi făcut un om
 * din panou. O scriere directă în bază ar sări exact peste partea pe care o vindem.
 *
 * Conținutul stă în `scripts/data/posta-demo.json` — scriptul nu știe nimic despre
 * Poșta, doar despre pași. Același script reconstruiește demo-ul de la zero dacă
 * cineva îl șterge.
 *
 *   node scripts/seed-posta-demo.mjs                 # simulare, nu scrie nimic
 *   node scripts/seed-posta-demo.mjs --apply         # execută
 *   node scripts/seed-posta-demo.mjs --apply --questions   # și generează grilele
 *   node scripts/seed-posta-demo.mjs --apply --publish     # și publică tot
 *
 * Cere în mediu: TUTOR_BASE_URL (implicit https://etutor.ro),
 * TUTOR_SUPERADMIN_EMAIL, TUTOR_SUPERADMIN_PASSWORD.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.TUTOR_BASE_URL || "https://etutor.ro";
const APPLY = process.argv.includes("--apply");
const WITH_QUESTIONS = process.argv.includes("--questions");
const WITH_PUBLISH = process.argv.includes("--publish");
const DATA = join(HERE, "data", "posta-demo.json");
/**
 * Ce s-a creat deja. Ruta de import creează un curs NOU la fiecare apel — fără
 * fișierul ăsta, a doua rulare dublează cursurile (pățit 2026-09-08). Tot de aici
 * se știe că materia are deja un cod în circulație, ca o re-rulare să nu-l rotească
 * și să nu lase oamenii pe dinafară.
 */
const STATE = join(HERE, "data", "posta-demo.state.json");
// --only <slug>: o singură materie per proces, ca generarea grilelor (lentă, fiecare
// grilă trece prin judecător) să poată rula pe cele trei materii în paralel.
const ONLY = (() => {
  const i = process.argv.indexOf("--only");
  return i > 0 ? process.argv[i + 1] : null;
})();

let cookie = "";

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}), ...(init.headers || {}) },
    redirect: "manual",
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length) {
    const jar = new Map(cookie.split("; ").filter(Boolean).map((c) => [c.split("=")[0], c]));
    for (const c of setCookie) {
      const first = c.split(";")[0];
      jar.set(first.split("=")[0], first);
    }
    cookie = [...jar.values()].join("; ");
  }
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 400) }; }
  return { status: res.status, body };
}

async function login() {
  const email = process.env.TUTOR_SUPERADMIN_EMAIL;
  const password = process.env.TUTOR_SUPERADMIN_PASSWORD;
  if (!email || !password) throw new Error("Lipsesc TUTOR_SUPERADMIN_EMAIL / TUTOR_SUPERADMIN_PASSWORD");
  const { body: csrf } = await call("/api/auth/csrf");
  const form = new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, redirect: "false", callbackUrl: `${BASE}/dashboard` });
  await call("/api/auth/callback/credentials?", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const { body: session } = await call("/api/auth/session");
  if (!session?.user?.email) throw new Error("Autentificarea a eșuat");
  return session.user.email;
}

async function main() {
  const plan = JSON.parse(readFileSync(DATA, "utf8"));
  if (ONLY) plan.domains = plan.domains.filter((d) => d.slug === ONLY);
  if (!plan.domains.length) throw new Error(`Nicio materie pentru --only ${ONLY}`);
  console.log(`${APPLY ? "EXECUȚIE" : "SIMULARE"} pe ${BASE}`);
  console.log(`  organizație: ${plan.organization.name} (${plan.organization.slug})`);
  for (const d of plan.domains) {
    const m = d.course.modules.length;
    const chars = d.course.modules.reduce((n, x) => n + x.lessonMarkdown.length, 0);
    console.log(`  materie: ${d.name} (${d.slug}) — curs „${d.course.title}", ${m} module, ${chars} caractere`);
  }
  if (!APPLY) { console.log("\nNimic scris. Rulează cu --apply."); return; }

  const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
  const who = await login();
  console.log(`autentificat: ${who}`);

  // 1. Organizația — idempotent: dacă slug-ul există deja, o refolosim.
  const { body: orgs } = await call("/api/admin/organizations");
  let org = (orgs.organizations || []).find((o) => o.slug === plan.organization.slug);
  if (!org) {
    const r = await call("/api/admin/organizations", { method: "POST", body: JSON.stringify(plan.organization) });
    if (r.status >= 300) throw new Error(`organizație: ${r.status} ${JSON.stringify(r.body)}`);
    org = r.body.organization;
    console.log(`  + organizație ${org.slug}`);
  } else console.log(`  = organizație ${org.slug} (exista)`);

  const rezultat = [];
  for (const d of plan.domains) {
    // 2. Materia, privată.
    const { body: doms } = await call("/api/admin/domains");
    // GET /api/admin/domains întoarce un array simplu, nu {domains}.
    let dom = (Array.isArray(doms) ? doms : []).find((x) => x.slug === d.slug);
    if (!dom) {
      const r = await call("/api/admin/domains", {
        method: "POST",
        body: JSON.stringify({ name: d.name, slug: d.slug, description: d.description, icon: d.icon, visibility: "PRIVATE" }),
      });
      if (r.status >= 300) throw new Error(`materie ${d.slug}: ${r.status} ${JSON.stringify(r.body)}`);
      dom = r.body; // POST întoarce materia direct
      console.log(`  + materie ${d.slug}`);
    } else console.log(`  = materie ${d.slug} (exista)`);

    // 3. O legăm de organizație (idempotent — ruta ignoră ce e deja legat).
    await call(`/api/admin/organizations/${org.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "assignDomains", domainIds: [dom.id] }),
    });

    // 4. Cursul, importat ca ciornă — o singură dată. Ruta creează un curs nou la
    //    fiecare apel, deci refolosim ce s-a creat prima oară.
    let slug = state[d.slug]?.curs;
    if (slug) {
      console.log(`  = curs ${slug} (exista)`);
    } else {
    const imp = await call("/api/admin/courses/generate", {
      method: "POST",
      body: JSON.stringify({ action: "import", domainId: dom.id, title: d.course.title, description: d.course.description, modules: d.course.modules }),
    });
    if (imp.status >= 300) throw new Error(`curs ${d.slug}: ${imp.status} ${JSON.stringify(imp.body).slice(0, 300)}`);
      slug = imp.body.course?.slug || imp.body.slug;
      console.log(`  + curs ${slug}`);
    }

    // 5. Codul de acces: 30 de zile, număr limitat de folosiri. Se emite o singură
    //    dată — o rotire ar invalida codurile deja împărțite oamenilor.
    let cod = state[d.slug]?.cod;
    if (cod) {
      console.log(`  = cod ${cod} (emis deja)`);
    } else {
      const jc = await call(`/api/admin/domains/${dom.id}/join-code`, {
        method: "POST",
        body: JSON.stringify({ action: "rotate", expiresInDays: d.joinCode?.expiresInDays ?? 30, maxUses: d.joinCode?.maxUses ?? 50 }),
      });
      cod = jc.body?.display || jc.body?.joinCode;
      console.log(`  + cod ${cod}`);
    }

    state[d.slug] = { domainId: dom.id, curs: slug, cod };
    writeFileSync(STATE, JSON.stringify(state, null, 1));
    rezultat.push({ materie: d.slug, domainId: dom.id, curs: slug, cod });

    // 6. Grilele — opțional, e partea lentă (fiecare grilă trece prin judecător).
    if (WITH_QUESTIONS) {
      for (const m of d.course.modules) {
        const q = await call(`/api/admin/courses/${slug}/questions`, {
          method: "POST",
          body: JSON.stringify({ perModule: d.course.perModule ?? 8, moduleOrders: [m.order], existingPolicy: "topUp" }),
        });
        console.log(`    grile M${m.order}: ${q.status} ${JSON.stringify(q.body?.summary ?? q.body).slice(0, 160)}`);
      }
    }

    // 7. Publicarea — curs + lecții + grile, într-un singur pas reversibil.
    if (WITH_PUBLISH) {
      const p = await call(`/api/admin/courses/${slug}/publish`, { method: "POST", body: JSON.stringify({ action: "publish" }) });
      console.log(`    publicare: ${p.status} ${JSON.stringify(p.body?.published ?? p.body).slice(0, 160)}`);
    }
  }

  console.log("\nGATA:");
  for (const r of rezultat) console.log(`  ${r.materie} → curs ${r.curs}, cod ${r.cod}`);
}

main().catch((e) => { console.error("EȘEC:", e.message); process.exitCode = 1; });
