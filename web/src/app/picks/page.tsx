import type { Metadata } from "next";
import Link from "next/link";
import { PickCard } from "@/components/pick-card";
import { getDailyPicks } from "@/lib/data";
import { isSafePick } from "@/lib/prediction/config";

export const metadata: Metadata = { title: "Picks del día" };
export const revalidate = 300;

export default async function PicksPage() {
  const picks = await getDailyPicks(12, 20);
  const safe = picks.filter((p) => isSafePick(p.prediction.pick.probability));
  const rest = picks.filter((p) => !isSafePick(p.prediction.pick.probability));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-silver-100">🎯 Picks del día</h1>
      <p className="mt-1 text-sm text-silver-500">
        Selecciones del modelo con su explicación. El rendimiento histórico verificable
        está en{" "}
        <Link href="/resultados" className="font-semibold text-brand-500 hover:text-brand-400">
          Resultados
        </Link>
        .
      </p>

      {safe.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-lg font-bold text-silver-100">🔒 Picks seguros</h2>
          <p className="mb-4 text-xs text-silver-500">
            Certeza extrema (≥85% de probabilidad). Pocos al día, máxima fiabilidad.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {safe.map(({ match, prediction }) => (
              <PickCard key={match.id} match={match} prediction={prediction} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-silver-100">⚡ Más picks del día</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rest.map(({ match, prediction }) => (
              <PickCard key={match.id} match={match} prediction={prediction} />
            ))}
          </div>
        </section>
      )}

      {picks.length === 0 && (
        <div className="card-surface mt-8 p-10 text-center text-silver-500">
          Generando los picks de hoy… vuelve en unos minutos.
        </div>
      )}
    </div>
  );
}
