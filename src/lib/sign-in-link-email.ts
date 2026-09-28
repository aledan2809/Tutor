/**
 * The email that carries a one-time sign-in link. The page the link came from decides the
 * language: Auth.js keeps it in the link as `callbackUrl` (/en/... → English, anything else →
 * Romanian, the site's default).
 */
export function signInLinkEmail(url: string): { subject: string; html: string } {
  let english = false;
  try {
    const cb = new URL(url).searchParams.get("callbackUrl") ?? "";
    english = /^(https?:\/\/[^/]+)?\/en(\/|$)/.test(cb);
  } catch {
    english = false;
  }
  // The link is ours (built by Auth.js from AUTH_URL); only quotes could break the attribute.
  const href = url.replace(/"/g, "%22");
  const button = (label: string) =>
    `<p><a href="${href}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a></p>`;
  if (english) {
    return {
      subject: "Your sign-in link for eTutor.ro",
      html: `<p>Hi,</p>
<p>Someone asked to sign in to eTutor.ro with this email address. The button below signs you in. It works once, within the next 24 hours.</p>
${button("Sign in to eTutor.ro")}
<p>If it wasn't you, ignore this email: nobody gets into your account without this link.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
    };
  }
  return {
    subject: "Linkul tău de intrare pe eTutor.ro",
    html: `<p>Bună,</p>
<p>Cineva a cerut să intre pe eTutor.ro cu această adresă de email. Cu butonul de mai jos intri în cont. Merge o singură dată, în următoarele 24 de ore.</p>
${button("Intră pe eTutor.ro")}
<p>Dacă n-ai cerut tu, ignoră emailul: nimeni nu intră în contul tău fără acest link.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
  };
}
