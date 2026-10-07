import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "./brand-mark";

/** Fondo del acceso. Reutiliza el clip del hero hasta que haya uno propio. */
const AUTH_VIDEO = "/brand/hero.mp4";

const NAV = [
  { href: "/partidos", label: "Partidos" },
  { href: "/picks", label: "Pronósticos" },
  { href: "/resultados", label: "Resultados" },
  { href: "/precios", label: "Precios" },
];

/**
 * Pantalla completa de acceso: vídeo a sangre, panel a la derecha, nav arriba
 * y aviso legal abajo. Sin cabecera ni pie del sitio.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section className="auth-shell relative grid h-[100svh] min-h-[640px] w-full grid-rows-[auto_1fr_auto] overflow-hidden bg-black isolate">
      <div className="absolute inset-0 -z-10 bg-black">
        <video
          className="h-full w-full object-cover object-center"
          src={AUTH_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="auth-scrim absolute inset-0" aria-hidden="true" />
      </div>

      <nav
        className="flex items-center justify-between gap-8 px-[clamp(20px,5vw,100px)] py-[clamp(20px,2.4vw,34px)]"
        style={{ paddingTop: "max(clamp(20px,2.4vw,34px), env(safe-area-inset-top, 0px))" }}
        aria-label="Principal"
      >
        <Link href="/" className="flex items-center gap-3 text-white" aria-label="PickVerde, inicio">
          <BrandMark className="h-6 w-6 text-brand-500" />
          <span className="auth-display text-[clamp(20px,1.75vw,30px)] font-[200] leading-none tracking-[0.16em]">PICKVERDE</span>
        </Link>

        <div className="flex items-center gap-[clamp(24px,3.2vw,62px)]">
          <div className="hidden items-center gap-[clamp(20px,2.8vw,56px)] min-[901px]:flex">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="auth-mono text-[clamp(11px,0.78vw,14px)] font-normal uppercase tracking-[0.18em] text-white transition-colors duration-[250ms] hover:text-white/60"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/precios"
            className="auth-mono hidden border border-white/[0.26] px-[clamp(20px,1.8vw,32px)] py-[clamp(12px,1vw,17px)] text-[clamp(11px,0.78vw,14px)] font-normal uppercase tracking-[0.18em] text-white transition-colors duration-[250ms] hover:border-white/50 hover:bg-white/[0.05] min-[901px]:block"
          >
            Ver planes
          </Link>
        </div>
      </nav>

      <div className="flex min-h-0 items-center justify-center overflow-y-auto px-[clamp(20px,5vw,100px)] min-[721px]:justify-end">
        {children}
      </div>

      <footer
        className="border-t border-white/[0.14] px-[clamp(20px,5vw,100px)] py-[clamp(18px,1.7vw,30px)] text-center"
        style={{ paddingBottom: "max(clamp(18px,1.7vw,30px), env(safe-area-inset-bottom, 0px))" }}
      >
        <p className="auth-display text-[clamp(12px,0.82vw,16px)] font-[300] leading-[1.5] text-white/60">
          Al crear una cuenta en PickVerde aceptas nuestro{" "}
          <Link href="/privacidad" className="text-white underline decoration-1 underline-offset-[3px] hover:text-white/60">Aviso de Privacidad</Link>{" "}
          y los{" "}
          <Link href="/terminos" className="text-white underline decoration-1 underline-offset-[3px] hover:text-white/60">Términos del Servicio</Link>.
          {" "}18+. PickVerde es una herramienta de análisis, no una casa de apuestas.
        </p>
      </footer>
    </section>
  );
}
