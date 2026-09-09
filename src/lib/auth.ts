import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeJoinCode } from "@/lib/join-code";
import { isJoinCodeUsable } from "@/lib/join-code-policy";
import { redeemJoinCode } from "@/lib/join-code-redeem";
import type { AccountRole, EnrollmentRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSuperAdmin: boolean;
      /** Declared at signup; null on every account created before the column. */
      accountRole: AccountRole | null;
      /** The merchant this account belongs to; null for a platform account. */
      organizationId: string | null;
      /**
       * Administers their own organization. Only meaningful together with
       * organizationId — read the two as a pair, never one alone. Good enough to
       * decide what to DRAW; the server re-reads it from the database before
       * letting anyone act (src/lib/merchant-auth.ts), because this claim is
       * cached for up to five minutes like the rest of the token.
       */
      isOrgAdmin: boolean;
      enrollments: {
        domainId: string;
        domainSlug: string;
        roles: EnrollmentRole[];
      }[];
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "noreply@tutor.app",
    }),
    // Intrarea pe un link de acces, FĂRĂ cont.
    //
    // Cine primește linkul pe WhatsApp intră direct în curs. Contul i se cere abia
    // în faza aleasă de client (`Domain.signupGate`) — imediat, după câteva minute,
    // după a N-a întrebare, sau la final. La un client instituțional, fiecare pas
    // pus înaintea materialului pierde oameni.
    //
    // Invitatul e un rând de User REAL, doar cu `email = null` (coloana e
    // nullable) și `isGuest = true`. De-aia „crearea contului" mai târziu nu mută
    // nimic: pune emailul pe ACELAȘI rând, peste progresul deja scris pe el.
    //
    // Nu e o poartă deschisă: fără un cod valid, nefolosit și neexpirat nu se
    // creează nimic — aceleași reguli ca la tastarea codului, din același loc.
    Credentials({
      id: "guest-access",
      name: "Acces pe link",
      credentials: { code: { type: "text" } },
      async authorize(credentials) {
        const raw = credentials?.code;
        if (typeof raw !== "string" || !raw.trim()) return null;

        // Codul se verifică ÎNAINTE de a crea ceva: altfel oricine ar putea
        // fabrica rânduri de utilizator lovind ruta cu gunoi.
        const code = normalizeJoinCode(raw);
        if (!code) return null;
        const domain = await prisma.domain.findUnique({
          where: { joinCode: code },
          select: {
            id: true,
            isActive: true,
            joinCodeExpiresAt: true,
            joinCodeMaxUses: true,
            joinCodeUses: true,
          },
        });
        if (!domain || !domain.isActive) return null;
        const usable = isJoinCodeUsable(
          {
            expiresAt: domain.joinCodeExpiresAt,
            maxUses: domain.joinCodeMaxUses,
            uses: domain.joinCodeUses,
          },
          new Date()
        );
        if (!usable) return null;

        const guest = await prisma.user.create({
          data: { isGuest: true, locale: "ro", accountRole: "STUDENT" },
          select: { id: true, name: true, email: true, image: true },
        });

        // Înscrierea trece prin aceleași reguli ca tastarea codului: numără
        // folosirea, revendică atomic ultimul loc, lasă urmă în audit.
        const redeemed = await redeemJoinCode(guest.id, code);
        if (!redeemed) {
          // Codul s-a epuizat între verificare și răscumpărare (cineva l-a luat
          // în aceeași clipă). Nu lăsăm în urmă un rând de utilizator orfan.
          await prisma.user.delete({ where: { id: guest.id } }).catch(() => {});
          return null;
        }

        // `email` e null pentru un invitat, iar NextAuth vrea `undefined`, nu `null`.
        return {
          id: guest.id,
          name: guest.name ?? undefined,
          email: guest.email ?? undefined,
          image: guest.image ?? undefined,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.password) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    // Google One Tap: the GSI prompt returns an ID token (JWT), not an auth
    // code, so the standard Google provider (code flow) can't consume it. We
    // verify the ID token server-side via Google's official tokeninfo endpoint
    // (no extra dependency) and converge on the SAME user as the button/email
    // flows (find-or-create by verified email + link a Google Account row so a
    // later button login doesn't hit OAuthAccountNotLinked).
    Credentials({
      id: "google-one-tap",
      name: "Google One Tap",
      credentials: { credential: { type: "text" } },
      async authorize(credentials) {
        const idToken = credentials?.credential as string | undefined;
        const clientId = process.env.AUTH_GOOGLE_ID;
        if (!idToken || !clientId) return null;

        let payload: {
          iss?: string; aud?: string; sub?: string; email?: string;
          email_verified?: string | boolean; name?: string; picture?: string;
          exp?: string | number;
        };
        try {
          const res = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
          );
          if (!res.ok) return null;
          payload = await res.json();
        } catch {
          return null;
        }

        const issOk =
          payload.iss === "accounts.google.com" ||
          payload.iss === "https://accounts.google.com";
        const audOk = payload.aud === clientId;
        const emailVerified =
          payload.email_verified === true || payload.email_verified === "true";
        const notExpired = !!payload.exp && Number(payload.exp) * 1000 > Date.now();
        if (!issOk || !audOk || !emailVerified || !notExpired || !payload.email || !payload.sub) {
          return null;
        }

        const email = payload.email;
        const googleId = payload.sub;
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: payload.name ?? null,
              image: payload.picture ?? null,
              emailVerified: new Date(),
            },
          });
        }
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: { provider: "google", providerAccountId: googleId },
          },
          create: {
            userId: user.id,
            type: "oidc",
            provider: "google",
            providerAccountId: googleId,
          },
          update: {},
        });
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days — keep students signed in (was implicit default)
    updateAge: 24 * 60 * 60, // refresh the cookie at most once a day
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Refresh roles from DB — but NOT on every single request. Re-query only on
      // a fresh login, an explicit session update, or when the cached roles are
      // older than 5 min. This cuts DB load drastically (the callback runs on
      // every authenticated request) and, crucially, the query is now guarded:
      // a transient DB error keeps the existing token instead of throwing, which
      // previously invalidated the session and logged the user out unexpectedly
      // ("delogat de fiecare dată"). The user stays signed in; roles refresh next tick.
      const REFRESH_MS = 5 * 60 * 1000;
      const last = typeof token.rolesAt === "number" ? token.rolesAt : 0;
      const shouldRefresh =
        !!user || trigger === "update" || Date.now() - last > REFRESH_MS;
      if (token.id && shouldRefresh) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              enrollments: {
                where: { isActive: true },
                include: { domain: { select: { id: true, slug: true } } },
              },
            },
          });
          if (dbUser) {
            // Banned → invalidate the session. Auth.js v5 signs the user out
            // when the jwt callback returns null. Takes effect on the next
            // token refresh (≤5 min, per REFRESH_MS) and also blocks a fresh
            // login outright (this block runs when `user` is set). Without this,
            // a ban was cosmetic — the 30-day JWT kept working after "Ban".
            if (dbUser.isBanned) {
              return null;
            }
            token.isSuperAdmin = dbUser.isSuperAdmin ?? false;
            token.accountRole = dbUser.accountRole ?? null;
            token.organizationId = dbUser.organizationId ?? null;
            token.isOrgAdmin = dbUser.isOrgAdmin ?? false;
            token.enrollments = dbUser.enrollments.map((e) => ({
              domainId: e.domain.id,
              domainSlug: e.domain.slug,
              roles: e.roles,
            }));
            token.rolesAt = Date.now();
          }
          // dbUser null (e.g. mid-deploy lookup miss) → keep prior token values.
        } catch {
          // Transient DB error → do NOT throw (that would drop the session).
          // Keep whatever roles the token already carries.
        }
      }
      // Always-defined defaults so the session callback never sees undefined.
      if (token.isSuperAdmin === undefined) token.isSuperAdmin = false;
      if (token.accountRole === undefined) token.accountRole = null;
      if (token.organizationId === undefined) token.organizationId = null;
      if (token.isOrgAdmin === undefined) token.isOrgAdmin = false;
      if (token.enrollments === undefined) token.enrollments = [];
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isSuperAdmin = token.isSuperAdmin as boolean;
      session.user.accountRole = (token.accountRole as AccountRole | null) ?? null;
      session.user.organizationId = (token.organizationId as string | null) ?? null;
      session.user.isOrgAdmin = (token.isOrgAdmin as boolean) ?? false;
      session.user.enrollments = token.enrollments as {
        domainId: string;
        domainSlug: string;
        roles: EnrollmentRole[];
      }[];
      return session;
    },
  },
});
