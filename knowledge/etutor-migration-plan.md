# Tutor — `etutor.ro` domain migration plan (Cloudflare DNS → VPS2)

> Created 2026-05-27. Domain `etutor.ro` acquired on **Hostico**. Target: serve Tutor on
> `etutor.ro` (currently `tutor.knowbest.ro`, VPS2 `72.62.155.74`, PM2 `tutor` :3013, local PG).
> Tutor uses **NextAuth v5** (`AUTH_URL` / `NEXTAUTH_URL`) + Google/GitHub OAuth → callback URLs
> must include the new domain. The `/creatori` page is already live and will work on `etutor.ro/creatori`
> automatically once DNS resolves.

## Status legend
- 👤 **USER action** (registrar / Cloudflare / OAuth consoles — I can't do these)
- 🤖 **I execute on VPS2** (once DNS resolves to the VPS)

---

## Phase 1 — Cloudflare DNS (👤 USER)

1. **Add site to Cloudflare** (free plan): dashboard → Add a site → `etutor.ro`.
2. Cloudflare gives you **2 nameservers** (e.g. `xxx.ns.cloudflare.com`).
3. **At Hostico** (registrar): replace the current nameservers with Cloudflare's two. Propagation 5 min–24h.
4. **In Cloudflare → DNS**, add:
   - `A` · `etutor.ro` · `72.62.155.74` · **Proxy status: DNS only (grey cloud)** ← important for Let's Encrypt
   - `A` · `www` · `72.62.155.74` · **DNS only (grey cloud)**
5. Verify propagation: `dig +short etutor.ro` → must return `72.62.155.74`.

> Keep grey-cloud (DNS only) until the SSL cert is issued (Phase 3). You may switch to orange-cloud
> (proxied) afterwards **only with SSL/TLS mode = Full (strict)** — otherwise you get redirect loops.

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
- **Let's Encrypt + Cloudflare proxy**: cert issuance fails behind orange-cloud unless you use DNS-01
  or Cloudflare origin certs. Use grey-cloud for HTTP-01 (Phase 1.4), then optionally proxy.
- **NextAuth `AUTH_URL` mismatch** → "callback URL mismatch" / login bounce. AUTH_URL must equal the
  canonical public origin exactly (`https://etutor.ro`, no trailing slash).
- **OAuth redirect URIs** are the #1 cause of post-migration login failure — add them BEFORE flipping AUTH_URL.
- Tutor is **not** standalone (`next start`), so no `.next/standalone` static copy needed.

## What's done already (2026-05-27)
- `/creatori` creator-recruitment page + waitlist LIVE on tutor.knowbest.ro (works on etutor.ro after DNS).
- This plan persisted. Phases 2-6 are ~30-45 min once 👤 Phase 1 (Cloudflare + Hostico nameservers) is done.
