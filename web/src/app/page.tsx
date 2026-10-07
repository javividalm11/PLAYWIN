import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { HomeSports, HomeAgenda } from "@/components/home-sports";
import { ResultsChart3D } from "@/components/results-chart-3d";
import { ScrollScene } from "@/components/scroll-scene";
import { Reveal } from "@/components/reveal";
import {
  Arrow, Band, SectionHead, KpiCard, Features, Markets, PlansTeaser, Faq, FinalCta,
} from "@/components/home-sections";
import { getTodayBoard, getDailyPicks, getMatchAnalysis } from "@/lib/data";
import { getTrackRecord } from "@/lib/predictions/store";

export const revalidate = 120;

export default async function HomePage() {
  const [board, picks, track] = await Promise.all([
    getTodayBoard(),
    getDailyPicks(3, 8),
    getTrackRecord().catch(() => null),
  ]);

  const liveTop = board.live.slice(0, 2);
  const liveAnalyses = await Promise.allSettled(liveTop.map((m) => getMatchAnalysis(m.id)));
  const livePredictions = new Map(liveAnalyses.flatMap((r) =>
    r.status === "fulfilled" && r.value ? [[r.value.detail.match.id, r.value.prediction] as const] : [],
  ));
  const upcoming = board.upcoming.slice(0, 6);
  const noData = board.live.length + board.upcoming.length + board.finished.length === 0;

  const stats = track?.stats;
  const settled = stats ? stats.won + stats.lost : 0;
  const currentDateParts = new Intl.DateTimeFormat("en", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const currentMonth = `${currentDateParts.find(p => p.type === "year")?.value}-${currentDateParts.find(p => p.type === "month")?.value}`;
  const monthlySettled = track?.byDay.filter(d => d.day.startsWith(currentMonth)).reduce((sum, d) => sum + d.won + d.lost, 0);
  const winningStreak = stats?.streak?.type === "won" ? stats.streak.count : 0;
  const pct = (n: number | null | undefined) => (n == null ? "—" : `${n}%`);

  return (
    <div>
      <HomeHero live={board.live.length} upcoming={board.upcoming.length} track={track} />

      <ScrollScene />

      {/* Resultados verificables */}
      <div className="pv-home-lower">
      <Band tone="light" className="pv-results" >
        <SectionHead
          kicker="Resultados verificables"
          light
          title="Los números cuentan toda la historia."
          lead="Cada pronóstico registrado queda visible, incluidos los que fallan."
          action={<Link href="/resultados" className="pv-button pv-button-dark">Ver historial completo <Arrow /></Link>}
        />
        <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard trend={track?.trends?.hitRate} comparison="Variación del acierto: últimos 7 días frente a los 7 anteriores" accent label="Acierto histórico" value={pct(stats?.hitRate)} hint={settled ? `sobre ${settled.toLocaleString("es-MX")} liquidados` : "aún sin liquidados"} />
          <KpiCard trend={track?.trends?.safeHitRate} comparison="Variación del acierto de alta confianza: últimos 7 días frente a los 7 anteriores" artwork="confidence" icon="shield" status="Confianza del modelo ≥ 85%" label="Picks de alta confianza" value={pct(stats?.safe.hitRate)} hint="acierto histórico de esta selección" />
          <KpiCard trend={track?.trends?.streak} comparison="Variación de la mejor racha: últimos 7 días frente a los 7 anteriores" artwork="streak" icon="trophy" status="Aciertos consecutivos" label="Racha de logros" value={settled ? `${winningStreak}×` : "—"} hint={winningStreak ? "pronósticos acertados seguidos" : "sin racha de aciertos activa"} />
          <KpiCard trend={track?.trends?.monthly} comparison="Variación de liquidados: mes actual frente al mismo número de días del mes anterior" artwork="transparency" icon="crown" status="Aciertos y fallos del mes" label="Acumulado mensual" value={monthlySettled == null ? "—" : monthlySettled.toLocaleString("es-MX")} hint="pronósticos liquidados este mes" />
        </Reveal>
        <Reveal className="pv-performance-wrap" delay={120}>
          {track
            ? <ResultsChart3D byDay={track.byDay} />
            : <div className="card-surface flex items-center justify-center p-10 text-center text-sm text-silver-500">Activa el historial de resultados para ver la gráfica.</div>}
        </Reveal>
      </Band>

      {/* Partidos y pronósticos */}
      {(noData || liveTop.length > 0 || picks.length > 0) && <HomeSports live={liveTop} liveCount={board.live.length} predictions={livePredictions} picks={picks} noData={noData} />}

      <HomeAgenda matches={upcoming} />

      <Features />
      <Markets />
      <PlansTeaser />
      <Faq />
      <FinalCta />
      </div>
    </div>
  );
}


