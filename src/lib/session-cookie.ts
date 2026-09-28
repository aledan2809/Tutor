import { getToken } from "next-auth/jwt";

/** Auth.js session cookie names: `__Secure-` on https, plain on http (local builds). */
export const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"] as const;

// Auth.js's own rule (SessionStore): every cookie whose name merely STARTS with the session name is
// read and joined — `<name>.0` chunks, but also `<name>X`. Anything narrower lets a renamed cookie in.
export const isSessionCookie = (name: string) => SESSION_COOKIES.some((c) => name.startsWith(c));

/**
 * The session a request carries — only when its cookie decrypts with our secret (a cookie is whatever
 * the client sends). `sv` is the session version, 0 for a token from before the column. Edge-safe.
 */
export async function sessionFromHeaders(headers: Headers): Promise<{ id: string; sv: number } | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const names = (headers.get("cookie") ?? "").split(";").map((p) => p.split("=")[0].trim());
  for (const cookieName of SESSION_COOKIES) {
    if (!names.some((n) => n.startsWith(cookieName))) continue;
    const token = await getToken({
      req: { headers },
      secret,
      cookieName,
      secureCookie: cookieName.startsWith("__Secure-"),
    }).catch(() => null);
    const id = token && (typeof token.id === "string" ? token.id : token.sub);
    if (id) return { id, sv: typeof token.sv === "number" ? token.sv : 0 };
  }
  return null;
}

/** The same request with the session cookies taken out; every other cookie (OAuth state, PKCE) stays. */
export function withoutSessionCookies<T extends Request>(req: T, make: (url: string, init: RequestInit) => T): T {
  const kept = (req.headers.get("cookie") ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p && !isSessionCookie(p.split("=")[0].trim()));
  const headers = new Headers(req.headers);
  if (kept.length) headers.set("cookie", kept.join("; "));
  else headers.delete("cookie");
  const init: RequestInit & { duplex?: "half" } = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    init.duplex = "half";
  }
  return make(req.url, init);
}

/** Names of the session cookies a request carries (what `withoutSessionCookies` takes out). */
export function sessionCookieNames(req: Request): string[] {
  return (req.headers.get("cookie") ?? "")
    .split(";")
    .map((p) => p.split("=")[0].trim())
    .filter((n) => n && isSessionCookie(n));
}

/**
 * After a sign-in that set a new session, expire every old session cookie the browser still holds
 * under another name (the old session's `.0`/`.1` chunks next to a new single cookie, or the
 * reverse): Auth.js joins all of them on the next request, the result doesn't decrypt, and the
 * person is signed out right after signing in. Auth.js would clear them itself, but it didn't see
 * them — `withoutSessionCookies` took them out. A failed sign-in leaves the old session alone.
 */
export function expireLeftoverSessionCookies(res: Response, stripped: string[]): Response {
  if (!stripped.length) return res;
  const setCookies = res.headers.getSetCookie();
  const set = new Set(setCookies.map((c) => c.split("=")[0].trim()));
  const signedIn = setCookies.some((c) => {
    const name = c.split("=")[0].trim();
    return isSessionCookie(name) && !/(^|;\s*)(max-age=0|expires=thu, 01 jan 1970)/i.test(c);
  });
  if (!signedIn) return res;
  const headers = new Headers(res.headers);
  for (const name of stripped) {
    if (set.has(name)) continue;
    const secure = name.startsWith("__Secure-") ? "; Secure" : "";
    headers.append("Set-Cookie", `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`);
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
