# Project Status - Tutor

Last Updated: 2026-03-27

## Current State
- Phase 1 COMPLETE - project builds and database seeded
- Next.js 15.3.3 with App Router, TypeScript strict, Tailwind CSS v4, dark theme
- PostgreSQL (Neon) + Prisma ORM - 40+ models, all enums, full schema deployed
- NextAuth v5 configured with Google OAuth + Resend email magic links + Credentials
- Role-based authorization system (multi-role per user per domain)
- Middleware: next-intl locale routing + auth protection for dashboard routes
- Bilingual setup (RO+EN) with next-intl, full message files (367+ keys)
- PWA manifest + service worker skeleton in place
- Database seeded: aviation domain, 8 users, 233 questions, 5 exam formats, 12 escalation templates
- Neon DB: project `round-forest-01709273` (eu-central-1)

## TODO
- [x] Project scaffold (Next.js 14+, TypeScript strict, Tailwind, dark theme)
- [x] PostgreSQL + Prisma ORM schema (all models)
- [x] NextAuth v5 (Google OAuth + email magic links + credentials)
- [x] Role-based middleware (multi-role per user per domain)
- [x] Bilingual setup (RO+EN) with next-intl
- [x] PWA manifest + service worker skeleton
- [x] Database created on Neon and schema pushed
- [x] Database seeded with aviation domain
- [ ] Phase 2-12 implementation (per big pipeline)
- [ ] Configure Resend API key for email magic links
- [ ] Add Google OAuth redirect URI for production domain
- [ ] Replace placeholder PWA icons with real ones

## Recent Changes
- 2026-03-27: Created Neon database (round-forest-01709273), pushed schema, seeded data
- 2026-03-27: Generated migration SQL (0001_init, 1009 lines)
- 2026-03-27: Updated Master credentials with real DATABASE_URL
- 2026-03-26: Phase 1 scaffold created
- 2026-03-26: Fixed next.config.ts with next-intl plugin
- 2026-03-26: Created middleware.ts with i18n + auth protection
- 2026-03-26: Pinned Next.js to 15.3.3 (avoiding 16.x middleware deprecation)
- 2026-03-26: Populated Google OAuth credentials from Master

## Technical Notes
- Next.js pinned to 15.3.3 (not 16.x) - Next.js 16 deprecated middleware.ts in favor of proxy convention, causes Turbopack crash
- Prisma version 5.22.x used (hook normalized from 6.x)
- Auth uses JWT strategy with enrollments embedded in token
- SuperAdmin bypasses all role checks
- Session cookie names: `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod)
- Neon Project ID: round-forest-01709273 (region: aws-eu-central-1)
