import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-pitch-600/60 bg-pitch-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Image
              src="/brand/wordmark.png"
              alt="PLAYWIN"
              width={427}
              height={120}
              className="h-8 w-auto mix-blend-screen"
            />
            <p className="mt-3 text-sm leading-relaxed text-silver-500">
              Plataforma de análisis estadístico deportivo. Convertimos datos en
              probabilidades para que decidas mejor.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-silver-300">Producto</span>
              <Link href="/partidos" className="text-silver-500 hover:text-brand-400">Partidos</Link>
              <Link href="/en-vivo" className="text-silver-500 hover:text-brand-400">En vivo</Link>
              <Link href="/precios" className="text-silver-500 hover:text-brand-400">Precios</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-silver-300">Legal</span>
              <Link href="/terminos" className="text-silver-500 hover:text-brand-400">Términos</Link>
              <Link href="/privacidad" className="text-silver-500 hover:text-brand-400">Privacidad</Link>
              <Link href="/juego-responsable" className="text-silver-500 hover:text-brand-400">Juego responsable</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-pitch-700 pt-6 text-xs leading-relaxed text-silver-600">
          <p>
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-silver-600 font-bold">
              18+
            </span>
            PLAYWIN es una herramienta de análisis estadístico y{" "}
            <strong className="text-silver-500">no es una casa de apuestas</strong>: no
            aceptamos ni procesamos apuestas. Las predicciones son estimaciones
            probabilísticas y no garantizan resultados. Apuesta con responsabilidad y solo
            dinero que puedas permitirte perder.
          </p>
          <p>© {new Date().getFullYear()} PLAYWIN. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
