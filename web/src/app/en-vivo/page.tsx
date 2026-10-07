import type { Metadata } from "next";
import Link from "next/link";
import { MatchCard } from "@/components/match-card";
import { AutoRefresh } from "@/components/auto-refresh";
import { getTodayBoard, getMatchAnalysis } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "En vivo" };
export const revalidate = 30;

export default async function LivePage() {
  const { live } = await getTodayBoard();

  // Probabilidades en vivo (limitado para cuidar la fuente de datos)
  const analyses = await Promise.allSettled(live.slice(0, 9).map((m) => getMatchAnalysis(m.id)));
  const predictions = new Map(
    analyses.flatMap((r) =>
      r.status === "fulfilled" && r.value ? [[r.value.detail.match.id, r.value.prediction] as const] : [],
    ),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AutoRefresh seconds={45} />
      <PageHeading eyebrow="En directo · Fútbol" title="Partidos en vivo" icon="pulse" description={<>Probabilidades recalculadas minuto a minuto. La información se actualiza automáticamente cada 45 segundos.</>} />

      {live.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((m) => (
            <MatchCard key={m.id} match={m} prediction={predictions.get(m.id)} />
          ))}
        </div>
      ) : (
        <div className="card-surface mt-8 p-10 text-center text-silver-500">
          No hay partidos en vivo en este momento. Revisa los{" "}
          <Link href="/partidos" className="font-semibold text-brand-500 hover:text-brand-400">
            próximos partidos
          </Link>
          .
        </div>
      )}
    </div>
  );
}
