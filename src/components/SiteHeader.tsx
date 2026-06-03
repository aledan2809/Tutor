import { Link } from "@/i18n/navigation";
import { Brand } from "./Brand";

// Audience colors — reused inside the respective pages + on the homepage.
export const AUDIENCE = {
  elev: { color: "text-blue-400 hover:text-blue-300", accent: "blue" },
  parinte: { color: "text-emerald-400 hover:text-emerald-300", accent: "emerald" },
  profesor: { color: "text-amber-400 hover:text-amber-300", accent: "amber" },
} as const;

export function SiteHeader({ locale }: { locale?: string }) {
  const ro = locale !== "en";
  const esti = ro ? "Ești" : "I'm a";
  const audiences = [
    { href: "/elev", label: ro ? "ELEV/STUDENT" : "STUDENT", color: AUDIENCE.elev.color },
    { href: "/parinte", label: ro ? "PĂRINTE" : "PARENT", color: AUDIENCE.parinte.color },
    { href: "/creatori", label: ro ? "PROFESOR" : "TEACHER", color: AUDIENCE.profesor.color },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" aria-label="eTUTOR.ro">
          <Brand className="text-xl" />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          {audiences.map((a) => (
            <Link key={a.href} href={a.href} className="hidden flex-col items-start leading-none sm:flex">
              <span className="text-[10px] text-gray-500">{esti}</span>
              <span className={`text-sm font-extrabold tracking-wide ${a.color}`}>{a.label}</span>
            </Link>
          ))}
          <Link
            href="/auth/signin"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {ro ? "Autentificare" : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
