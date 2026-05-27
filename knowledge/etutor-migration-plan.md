# Tutor — `etutor.ro` domain migration plan (Hostico DNS → VPS2; Cloudflare optional)

> Created 2026-05-27. Domain `etutor.ro` acquired on **Hostico**. Target: serve Tutor on
> `etutor.ro` (currently `tutor.knowbest.ro`, VPS2 `72.62.155.74`, PM2 `tutor` :3013, local PG).
> Tutor uses **NextAuth v5** (`AUTH_URL` / `NEXTAUTH_URL`) + Google/GitHub OAuth → callback URLs
> must include the new domain. The `/creatori` page is already live and will work on `etutor.ro/creatori`
> automatically once DNS resolves.

## Status legend
- 👤 **USER action** (registrar / Cloudflare / OAuth consoles — I can't do these)
- 🤖 **I execute on VPS2** (once DNS resolves to the VPS)

---

## Phase 1 — DNS A-records via Hostico (👤 USER) — Cloudflare NOT required

Cloudflare is **not needed** to point a domain at a VPS — just two A-records. This is exactly how
every other `*.knowbest.ro` (tutor, legal, hh, contakt, seap) already resolves to VPS2.

1. **Hostico → panou DNS** (zona DNS a lui `etutor.ro`). Make sure the domain uses Hostico's own
   nameservers (the default after purchase). Add:
   - `A` · `@` (or `etutor.ro`) → `72.62.155.74`
   - `A` · `www` → `72.62.155.74`
2. Verify propagation (5 min–a few h): `dig +short etutor.ro` → must return `72.62.155.74`.

> **Optional — Cloudflare (only if you later want CDN / DDoS / hidden origin):** add the site to
> Cloudflare, switch Hostico nameservers to Cloudflare's, recreate the A-records there as **DNS only
> (grey cloud)** for cert issuance; you may enable the proxy (orange cloud) afterwards **only with
> SSL/TLS = Full (strict)**. Overkill for a single VPS app — skip unless you have a reason.

## Phase 2 — nginx vhost on VPS2 (🤖 once `dig` returns the VPS IP)

Mirror `tutor-knowbest` → new `etutor` vhost:
```nginx
server {
    server_name etutor.ro www.etutor.ro;
    location / {
        proxy_pass http://127.0.0.1:3013;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 100M;
    }
    listen 80;
}
```
`ln -s /etc/nginx/sites-available/etutor /etc/nginx/sites-enabled/` → `nginx -t` → `systemctl reload nginx`.

## Phase 3 — SSL (🤖)

`certbot --nginx -d etutor.ro -d www.etutor.ro` → certbot adds the 443 server block + HTTP→HTTPS 301
(same pattern as the tutor-knowbest vhost). Auto-renew via the existing certbot timer.

## Phase 4 — App config: switch canonical domain to etutor.ro (🤖 + 👤 OAuth)

1. 🤖 `/var/www/tutor/.env` (backup first): set
   ```
   AUTH_URL=https://etutor.ro
   NEXTAUTH_URL=https://etutor.ro
   ```
   `pm2 restart tutor --update-env` (NextAuth derives callback URLs from AUTH_URL).
2. 👤 **OAuth provider consoles** — add the new redirect URIs (keep the old ones until cutover verified):
   - Google Cloud Console → OAuth client → Authorized redirect URIs: add `https://etutor.ro/api/auth/callback/google`
   - GitHub OAuth App → Authorization callback URL: add `https://etutor.ro/api/auth/callback/github`
   - (Authorized JS origins: add `https://etutor.ro`)
3. 🤖 Sync new `.env` to `Master/credentials/tutor.env`.

## Phase 5 — Redirect old domain (🤖, optional but recommended)

Point `tutor.knowbest.ro` at the new domain so old links don't 404:
```nginx
# in tutor-knowbest vhost, replace the proxy_pass location with:
return 301 https://etutor.ro$request_uri;
```
(Or keep it serving in parallel during a soak, then redirect.)

## Phase 6 — Registry + verification (🤖)

- Update `Master/DEPLOY_REGISTRY.md` (VPS2 row + DNS table: add `etutor.ro` → 72.62.155.74) +
  `Master/ECOSYSTEM_REGISTRY.md` Tutor row + custom-domains table.
- Verify: `https://etutor.ro/` 200, `https://etutor.ro/ro/creatori` 200, login via Google/GitHub works
  on the new domain, `https://etutor.ro/api/auth/session` 200, HTTP→HTTPS 301.
- L41-style spot check: `tutor.knowbest.ro` still 200 (or 301 to etutor) per Phase 5 choice.

## Gotchas
- **Hostico DNS direct** = simplest; certbot HTTP-01 works out of the box (no proxy in front).
  Only relevant if you opt into Cloudflare: cert issuance fails behind orange-cloud — use grey-cloud.
- **NextAuth `AUTH_URL` mismatch** → "callback URL mismatch" / login bounce. AUTH_URL must equal the
  canonical public origin exactly (`https://etutor.ro`, no trailing slash).
- **OAuth redirect URIs** are the #1 cause of post-migration login failure — add them BEFORE flipping AUTH_URL.
- Tutor is **not** standalone (`next start`), so no `.next/standalone` static copy needed.

## What's done already (2026-05-27)
- `/creatori` creator-recruitment page + waitlist LIVE — now on **https://etutor.ro/ro/creatori** ✅.
- This plan persisted.

## MIGRATION COMPLETE (2026-05-27)
- **DNS apex** `etutor.ro` → `72.62.155.74` (VPS2) ✅. nginx vhost `etutor` → `:3013`, SSL cert valid to 2026-08-25 ✅. `AUTH_URL`/`NEXTAUTH_URL` = `https://etutor.ro` ✅ (set during VPS-side setup).
- **Phase 5 redirect** ✅: `tutor.knowbest.ro` → 301 → `etutor.ro$request_uri` (vhost rewritten; backup `tutor-knowbest.bak-2026-05-27-pre-redirect`). Verified 301.
- Apex verified: `/ro` 200, `/ro/creatori` 200, `/api/auth/session` 200.

### Still open (👤 USER)
- **`www.etutor.ro` typo**: resolves to `72.61.155.74` (should be `72.62.155.74` — `61`→`62`). Fix the `www` A-record at Hostico.
- **OAuth redirect URIs**: since `AUTH_URL` = etutor.ro, add in Google/GitHub consoles:
  `https://etutor.ro/api/auth/callback/google` + `https://etutor.ro/api/auth/callback/github` (+ JS origin `https://etutor.ro`). Until then Google/GitHub login fails; credentials (email/parolă) login works.

### Still open (🤖 — deferred, Master docs)
- Phase 6 registries: add `etutor.ro` row to `Master/DEPLOY_REGISTRY.md` + `ECOSYSTEM_REGISTRY.md` (NOT committed this session — Master tree has unrelated drift from a parallel knowbest session; capture in ST).
