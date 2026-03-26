# Project Status - Tutor

Last Updated: 2026-03-26

## Current State
- Phase 1 scaffold complete - project builds successfully
- Next.js 15.3.3 with App Router, TypeScript strict, Tailwind CSS v4, dark theme
- PostgreSQL + Prisma ORM schema defined (13 models, all enums)
- NextAuth v5 configured with Google OAuth + Resend email magic links
- Role-based authorization system (multi-role per user per domain)
- Middleware: next-intl locale routing + auth protection for dashboard routes
- Bilingual setup (RO+EN) with next-intl, full message files
- PWA manifest + service worker skeleton in place
- Database seed script ready (aviation domain, 3 users, 5 questions, exam simulation)

## TODO
- [ ] Phase 2-12 implementation (per big pipeline)
- [ ] Set up actual PostgreSQL database and run migrations
- [ ] Configure Resend API key for email magic links
- [ ] Add Google OAuth redirect URI for localhost:3000
- [ ] Replace placeholder PWA icons with real ones

## Recent Changes
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
