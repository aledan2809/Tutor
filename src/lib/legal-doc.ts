// Server-side fetch + render of a versioned legal document from the Legal Hub
// (legal.knowbest.ro). Used by the /privacy, /terms, /cookies pages so the content
// is in the initial HTML (cacheable, works without JS). eTutor has no per-app
// documents → the Hub serves the MASTER document, rendered with eTutor's controller
// entity (Class RDA Impex SRL), resolved server-side from the AppEntityMapping
// (appSlug = "tutor"). Falls back to local defaults when the Hub is unreachable.

const APP_SLUG = "tutor";
const APP_NAME = "eTutor";

export type LegalDocType = "privacy" | "tos" | "cookies";

// Controller entity for eTutor (Class RDA Impex SRL). Used only as the offline
// fallback — the live Hub returns the authoritative entity record.
const ENTITY_FALLBACK = {
  name: "Class RDA Impex SRL",
  cui: "29867320",
  jurisdiction: "RO",
  address: "Str. Pridvorului nr.5, bl.6, ap.1, Sector 4, București, RO",
  dpoEmail: "dpo@4pro.io",
};

export type LegalDoc = {
  html: string;
  version: string | null;
  effectiveFrom: string | null;
  entityName: string | null;
  ok: boolean;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}
export function mdToHtml(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^---+$/.test(line.trim())) {
      closeList();
      out.push("<hr/>");
      continue;
    }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      closeList();
      const lvl = m[1].length;
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}

function formatAddress(address: unknown): string {
  if (typeof address === "string") return address || ENTITY_FALLBACK.address;
  if (!address || typeof address !== "object") return ENTITY_FALLBACK.address;
  const a = address as Record<string, string | undefined>;
  const parts = [a.street, a.sector, a.city, a.country].filter(Boolean);
  return parts.length ? parts.join(", ") : ENTITY_FALLBACK.address;
}

export async function getLegalDocument(
  type: LegalDocType,
  locale: string = "ro",
): Promise<LegalDoc> {
  const empty: LegalDoc = { html: "", version: null, effectiveFrom: null, entityName: null, ok: false };
  const apiUrl = process.env.LEGAL_API_URL;
  if (!apiUrl) return empty;
  const intlLocale = locale === "en" ? "en-GB" : "ro-RO";
  try {
    const url = `${apiUrl.replace(/\/$/, "")}/api/v1/public/legal/${APP_SLUG}/${type}?locale=${encodeURIComponent(locale)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Cache the legal doc for an hour on the server; revalidate in the background.
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return empty;
    const body = await res.json();
    const entity = body.entity ?? {};
    const version = body.version ?? {};
    if (!version.id || !version.contentMarkdown) return empty;

    const effDate = version.effectiveFrom
      ? new Intl.DateTimeFormat(intlLocale, { year: "numeric", month: "long", day: "2-digit" }).format(new Date(version.effectiveFrom))
      : "—";
    const vars: Record<string, string> = {
      "{entity_name}": entity.name ?? ENTITY_FALLBACK.name,
      "{entity_cui}": entity.cui ?? ENTITY_FALLBACK.cui,
      "{entity_jurisdiction}": entity.jurisdiction ?? ENTITY_FALLBACK.jurisdiction,
      "{entity_address}": entity.address ? formatAddress(entity.address) : ENTITY_FALLBACK.address,
      "{entity_dpo_email}": entity.dpoEmail ?? ENTITY_FALLBACK.dpoEmail,
      "{app_dpo_email}": entity.dpoEmail ?? ENTITY_FALLBACK.dpoEmail,
      "{effective_date}": effDate,
      "{version}": version.version ?? "—",
      "{app_name}": APP_NAME,
      "{app_slug}": APP_SLUG,
      "{user_email}": "—",
      "{rendered_at}": new Intl.DateTimeFormat(intlLocale, { year: "numeric", month: "long", day: "2-digit" }).format(new Date()),
    };
    let text = version.contentMarkdown as string;
    for (const [k, v] of Object.entries(vars)) text = text.split(k).join(v);

    return {
      html: mdToHtml(text),
      version: version.version ?? null,
      effectiveFrom: version.effectiveFrom ?? null,
      entityName: vars["{entity_name}"],
      ok: true,
    };
  } catch {
    return empty;
  }
}
