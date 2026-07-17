import type { Metadata } from "next";
import { MatchCard } from "@/components/match-card";
import { getTodayBoard } from "@/lib/data";
import type { Match } from "@/lib/types";

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-silver-100">Partidos de hoy</h1>
      <p className="mt-1 text-sm text-silver-500">
        {all.length} partidos · {board.live.length} en vivo · {board.upcoming.length} por
        jugar. Toca cualquiera para ver su análisis.
      </p>

      {all.length === 0 && (
        <div className="card-surface mt-8 p-10 text-center text-silver-500">
          No pudimos cargar los partidos. Intenta de nuevo en unos segundos.
        </div>
      )}

      {[...grouped.entries()].map(([league, matches]) => (
        <section key={league} className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-silver-200">{league}</h2>
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
