import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SearchBar } from "@/components/search-bar";
import { MatchCard } from "@/components/match-card";
import { searchTeams, getTodayBoard } from "@/lib/data";

export const metadata: Metadata = { title: "Buscar" };

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [teams, board] = query
    ? await Promise.all([searchTeams(query), getTodayBoard()])
    : [[], { live: [], upcoming: [], finished: [] }];

  const nq = normalize(query);
  const todayMatches = query
    ? [...board.live, ...board.upcoming, ...board.finished].filter((m) =>
        [m.home.name, m.away.name, m.league, m.home.shortName, m.away.shortName]
          .filter(Boolean)
          .some((f) => normalize(f as string).includes(nq)),
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-silver-100">Buscar</h1>
      <div className="mt-4 max-w-2xl">
        <SearchBar size="md" />
      </div>

      {query && (
        <p className="mt-6 text-sm text-silver-500">
          Resultados para <span className="font-semibold text-silver-200">&ldquo;{query}&rdquo;</span>
        </p>
      )}

      {/* Equipos */}
      {teams.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-4 text-lg font-bold text-silver-100">Equipos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/equipo/${t.id}`}
                className="card-surface group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-500/50"
              >
                {t.logo && (
                  <Image src={t.logo} alt="" width={36} height={36} className="object-contain" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-silver-100">{t.name}</p>
                  <p className="truncate text-xs text-silver-500">{t.leagueName ?? "Fútbol"}</p>
                </div>
                <span className="ml-auto shrink-0 text-xs font-medium text-brand-500 opacity-0 transition-opacity group-hover:opacity-100">
                  Ver →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Partidos de hoy que coinciden */}
      {todayMatches.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-silver-100">Partidos de hoy</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {query && teams.length === 0 && todayMatches.length === 0 && (
        <div className="card-surface mt-8 p-10 text-center">
          <p className="text-silver-400">
            No encontramos resultados para <strong>&ldquo;{query}&rdquo;</strong>.
          </p>
          <p className="mt-2 text-sm text-silver-600">
            Prueba con el nombre del equipo en su idioma original (ej. &ldquo;Bayern&rdquo;,
            &ldquo;América&rdquo;, &ldquo;Boca Juniors&rdquo;).
          </p>
        </div>
      )}
    </div>
  );
}
