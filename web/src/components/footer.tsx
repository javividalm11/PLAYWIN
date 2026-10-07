import Link from "next/link";
import { BrandLockup } from "./brand-mark";

const COLS = [
  {
    title: "Producto",
    links: [
      { href: "/partidos", label: "Partidos" },
      { href: "/en-vivo", label: "En vivo" },
      { href: "/picks", label: "Pronósticos" },
      { href: "/resultados", label: "Resultados" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/dashboard", label: "Mi panel" },
      { href: "/precios", label: "Precios" },
      { href: "/login", label: "Acceder" },
      { href: "/registro", label: "Crear cuenta" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terminos", label: "Términos" },
      { href: "/privacidad", label: "Privacidad" },
      { href: "/juego-responsable", label: "Juego responsable" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-pitch-950">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="PickVerde, inicio"><BrandLockup /></Link>
            <p className="mt-4 text-sm leading-6 text-silver-500">
              Inteligencia deportiva para tomar mejores decisiones. Datos, contexto y probabilidades en un solo lugar.
            </p>
            <Link href="/registro" className="mt-6 inline-flex items-center rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-pitch-950 transition hover:bg-brand-400">
              Empezar gratis
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            {COLS.map(col => (
              <div key={col.title} className="flex flex-col gap-3">
                <span className="micro">{col.title}</span>
                {col.links.map(l => (
                  <Link key={l.href} href={l.href} className="text-silver-400 transition-colors hover:text-brand-400">{l.label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 rounded-[24px] border border-white/10 bg-white/[.03] p-6 text-xs leading-6 text-silver-500">
          <p>
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-silver-600 font-bold">18+</span>
            PickVerde es una herramienta de análisis estadístico y{" "}
            <strong className="text-silver-300">no es una casa de apuestas</strong>: no aceptamos ni procesamos apuestas.
            Las predicciones son estimaciones probabilísticas y no garantizan resultados. Apuesta con responsabilidad y solo
            dinero que puedas permitirte perder. Si sientes que el juego deja de ser divertido, busca ayuda profesional.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-xs text-silver-600 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} PickVerde. Todos los derechos reservados.</p>
          <p>Hecho con datos, no con corazonadas.</p>
        </div>
      </div>
    </footer>
  );
}
