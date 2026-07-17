import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { MatchCard } from "@/components/match-card";
import { PickCard } from "@/components/pick-card";
import { getTodayBoard, getDailyPicks, getMatchAnalysis } from "@/lib/data";
import { getTrackRecord } from "@/lib/predictions/store";

export const revalidate = 120;

export default async function HomePage() {
  const [board, picks, track] = await Promise.all([
    getTodayBoard(),
    getDailyPicks(3, 8),
    getTrackRecord().catch(() => null),
  ]);

  // Cifra estrella: track record real cuando ya es representativo;
  // mientras tanto, el backtest verificable (241 partidos, 2026-07-16).
  const liveRate = track?.stats.hitRate ?? null;
  const liveSettled = (track?.stats.won ?? 0) + (track?.stats.lost ?? 0);
  const headline =
    liveRate != null && liveRate >= 85 && liveSettled >= 50
      ? { pct: liveRate, label: `acierto verificado en ${liveSettled} pronósticos` }
      : { pct: 92, label: "acierto en backtest de 241 partidos" };

  // Probabilidades en vivo para los 3 partidos en curso más avanzados
  const liveTop = board.live.slice(0, 3);
  const liveAnalyses = await Promise.allSettled(liveTop.map((m) => getMatchAnalysis(m.id)));
  const livePredictions = new Map(
    liveAnalyses.flatMap((r) =>
      r.status === "fulfilled" && r.value ? [[r.value.detail.match.id, r.value.prediction] as const] : [],
    ),
  );

  const upcoming = board.upcoming.slice(0, 6);
  const noData = board.live.length + board.upcoming.length + board.finished.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ─── Hero ─── */}
      <section className="py-16 text-center md:py-24">
        <div className="animate-fade-up">
          <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-400">
            ⚽ Análisis de fútbol en tiempo real
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Apuesta con <span className="text-gradient-brand">datos</span>,
            <br className="hidden md:block" /> no con corazonadas.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-silver-400 md:text-lg">
            PLAYWIN lee estadísticas, forma, cuotas, clima e historial para decirte{" "}
            <strong className="text-silver-200">quién tiene mayores probabilidades de ganar</strong> —
            antes del partido y en vivo, minuto a minuto.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl animate-fade-up">
          <SearchBar />
          <p className="mt-3 text-xs text-silver-600">
            Prueba: &ldquo;Real Madrid&rdquo;, &ldquo;Boca Juniors&rdquo;, &ldquo;América&rdquo;…
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-lg">
          <Link
            href="/resultados"
            className="card-surface group flex items-center justify-center gap-4 border-brand-500/40 px-6 py-4 transition-all hover:border-brand-500/70 hover:glow-brand"
          >
            <span className="font-mono text-4xl font-bold text-brand-400">{headline.pct}%</span>
            <span className="text-left text-sm leading-snug text-silver-300">
              de {headline.label}
              <span className="block text-xs text-silver-500 transition-colors group-hover:text-brand-500">
                Verifícalo tú mismo: aciertos y fallos públicos →
              </span>
            </span>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-silver-500">
          <span>📊 Modelo estadístico propio</span>
          <span>🔴 Probabilidades en vivo</span>
          <span>🧠 Explicación de cada pick</span>
          <span>🎁 3 días gratis, sin tarjeta</span>
        </div>
      </section>

      {noData && (
        <section className="pb-8">
          <div className="card-surface p-10 text-center text-silver-500">
            No pudimos cargar los partidos en este momento. Actualiza la página en unos
            segundos.
          </div>
        </section>
      )}

      {/* ─── En vivo ─── */}
      {liveTop.length > 0 && (
        <section className="py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-silver-100">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-live-pulse" />
              En vivo ahora
            </h2>
            <Link href="/en-vivo" className="text-sm font-medium text-brand-500 hover:text-brand-400">
              Ver todos ({board.live.length}) →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTop.map((m) => (
              <MatchCard key={m.id} match={m} prediction={livePredictions.get(m.id)} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Picks del día ─── */}
      {picks.length > 0 && (
        <section className="py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-silver-100">🎯 Picks del día</h2>
            <Link href="/picks" className="text-sm font-medium text-brand-500 hover:text-brand-400">
              Ver todos →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {picks.map(({ match, prediction }) => (
              <PickCard key={match.id} match={match} prediction={prediction} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Próximos partidos ─── */}
      {upcoming.length > 0 && (
        <section className="py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-silver-100">📅 Partidos de hoy</h2>
            <Link href="/partidos" className="text-sm font-medium text-brand-500 hover:text-brand-400">
              Calendario completo →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      <section className="py-16">
        <div className="card-surface relative overflow-hidden p-8 text-center md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_-20%,rgba(164,225,0,0.12),transparent)]"
          />
          <h2 className="relative text-2xl font-bold md:text-3xl">
            Empieza gratis. <span className="text-gradient-brand">Gana con ventaja.</span>
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-silver-400 md:text-base">
            3 días de acceso completo sin registrarte. Regístrate y suma 2 días más.
            ¿Te convence? Solo <strong className="text-brand-400">$9 USD al mes</strong>.
          </p>
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/registro"
              className="rounded-xl bg-brand-500 px-7 py-3 text-sm font-bold text-pitch-950 transition-all hover:bg-brand-400 hover:glow-brand"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/precios"
              className="rounded-xl border border-pitch-500 px-7 py-3 text-sm font-semibold text-silver-300 transition-colors hover:border-silver-500 hover:text-white"
            >
              Ver precios
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
