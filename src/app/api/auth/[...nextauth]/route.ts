import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { withoutSessionCookies, sessionCookieNames, expireLeftoverSessionCookies } from "@/lib/session-cookie";
import { decodedApiPath } from "@/lib/rate-limit-rules";

// Coming back from Google, Auth.js attaches the Google account to whoever the session cookie names —
// and it only decrypts the cookie, it doesn't run our session-version check. So a session ended by a
// password reset could still attach its holder's Google to the account and get back in for good. The
// app never links Google from inside an account, so this callback simply doesn't see the session.
async function run(req: NextRequest, handler: (r: NextRequest) => Promise<Response>): Promise<Response> {
  if (decodedApiPath(req.nextUrl.pathname) !== "/api/auth/callback/google") return handler(req);
  const stripped = sessionCookieNames(req);
  const res = await handler(
    withoutSessionCookies(req, (url, init) => new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1])),
  );
  return expireLeftoverSessionCookies(res, stripped);
}

export const GET = (req: NextRequest) => run(req, handlers.GET);
export const POST = (req: NextRequest) => run(req, handlers.POST);
