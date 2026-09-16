import { Link } from "@/i18n/navigation";
import { Brand } from "./Brand";

// Audience colors — reused inside the respective pages + on the homepage.
export const AUDIENCE = {
  elev: { color: "text-blue-400 hover:text-blue-300", accent: "blue" },
  parinte: { color: "text-emerald-400 hover:text-emerald-300", accent: "emerald" },
  profesor: { color: "text-amber-400 hover:text-amber-300", accent: "amber" },
} as const;

// Same audiences, darker, for a header drawn over a light background (the parents' page hero,
// where the header sits on the cream photo instead of the dark site bar).
const AUDIENCE_ON_LIGHT = {
  elev: "text-blue-700 hover:text-blue-800",
  parinte: "text-emerald-700 hover:text-emerald-800",
  profesor: "text-amber-700 hover:text-amber-800",
} as const;

export function SiteHeader({ locale, tone = "dark" }: { locale?: string; tone?: "dark" | "light" }) {
  const ro = locale !== "en";
  const light = tone === "light";
  const esti = ro ? "Ești" : "I'm a";
  const audiences = [
    { href: "/elev", label: ro ? "ELEV/STUDENT" : "STUDENT", color: light ? AUDIENCE_ON_LIGHT.elev : AUDIENCE.elev.color },
    { href: "/parinte", label: ro ? "PĂRINTE" : "PARENT", color: light ? AUDIENCE_ON_LIGHT.parinte : AUDIENCE.parinte.color },
    { href: "/creatori", label: ro ? "PROFESOR" : "TEACHER", color: light ? AUDIENCE_ON_LIGHT.profesor : AUDIENCE.profesor.color },
  ];

  return (
    <header className={light ? "bg-transparent" : "border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm"}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" aria-label="eTUTOR.ro" className="inline-flex min-h-[44px] items-center">
          <Brand className="text-xl" />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          {audiences.map((a) => (
            <Link key={a.href} href={a.href} className="hidden flex-col items-start leading-none sm:flex">
              <span className={`text-[10px] ${light ? "text-stone-600" : "text-gray-400"}`}>{esti}</span>
              <span className={`text-sm font-extrabold tracking-wide ${a.color}`}>{a.label}</span>
            </Link>
          ))}
          <Link
            href="/preturi"
            className={`hidden text-sm sm:inline ${light ? "text-stone-800 hover:text-stone-950" : "text-gray-300 hover:text-white"}`}
          >
            {ro ? "Prețuri" : "Pricing"}
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {ro ? "Autentificare" : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
