import Image from "next/image";
import Link from "next/link";
import { HeaderAuth } from "./header-auth";

const NAV = [
  { href: "/partidos", label: "Partidos" },
  { href: "/en-vivo", label: "En vivo" },
  { href: "/picks", label: "Picks del día" },
  { href: "/resultados", label: "Resultados" },
  { href: "/precios", label: "Precios" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-pitch-600/60 bg-pitch-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="shrink-0" aria-label="PLAYWIN — Inicio">
          <Image
            src="/brand/wordmark.png"
            alt="PLAYWIN — Analizador de Apuestas"
            width={427}
            height={120}
            priority
            className="h-9 w-auto mix-blend-screen"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-silver-400 transition-colors hover:bg-pitch-700 hover:text-silver-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
