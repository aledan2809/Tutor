import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              // 'unsafe-eval' removed (Next.js production does not need it). 'unsafe-inline'
              // kept until a dedicated nonce migration (next-intl middleware) — see TODO.
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.googleusercontent.com; " +
              "font-src 'self'; " +
              // Google Identity Services (One Tap) — was silently blocked by default-src 'self'.
              "connect-src 'self' https://accounts.google.com https://*.googleapis.com; " +
              "frame-src 'self' https://accounts.google.com; " +
              "frame-ancestors 'self'; " +
              "base-uri 'self'; " +
              "form-action 'self' https://accounts.google.com; " +
              "object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
