import type { Metadata } from "next";
import { MatchCard } from "@/components/match-card";
import { getTodayBoard } from "@/lib/data";
import type { Match } from "@/lib/types";
import { PageHeading } from "@/components/page-heading";
import { SportIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Partidos" };
export const revalidate = 60;

function groupByLeague(matches: Match[]): Map<string, Match[]> {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const list = map.get(m.league) ?? [];
    list.push(m);
    map.set(m.league, list);
  }
  return map;
}

export default async function MatchesPage() {
  const board = await getTodayBoard();
  const all = [...board.live, ...board.upcoming, ...board.finished];
  const grouped = groupByLeague(all);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeading eyebrow="Centro de partidos · Fútbol" title="Partidos de hoy" icon="calendar" description={<>{all.length} partidos · {board.live.length} en vivo · {board.upcoming.length} por jugar. Selecciona un encuentro para abrir su análisis completo.</>} />

      {all.length === 0 && (
        <div className="card-surface mt-8 p-10 text-center text-silver-500">
          No pudimos cargar los partidos. Intenta de nuevo en unos segundos.
        </div>
      )}

      {[...grouped.entries()].map(([league, matches]) => (
        <section key={league} className="mt-8">
          <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-silver-200"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-400/10 text-brand-400"><SportIcon sport="football" className="h-5 w-5" /></span>{league}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
