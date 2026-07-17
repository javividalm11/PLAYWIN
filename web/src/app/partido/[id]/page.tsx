import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMatchDetail } from "@/lib/data/espn";
import { getMatchWeather } from "@/lib/data/weather";
import type { FormGame } from "@/lib/data/espn";
import { formatKickoffFull } from "@/lib/format";
import { LiveBadge } from "@/components/live-badge";
import { TeamBadge } from "@/components/team-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { ScanPanel } from "@/components/scan-panel";
import type { LiveStats } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = /^\d+$/.test(id) ? await getMatchDetail(id) : null;
  if (!detail) return { title: "Partido no encontrado" };
  return { title: `${detail.match.home.name} vs ${detail.match.away.name}` };
}

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-sm tabular-nums text-silver-300">
        <span className={home >= away ? "font-bold text-brand-400" : ""}>{home}</span>
        <span className="font-sans text-xs text-silver-500">{label}</span>
        <span className={away >= home ? "font-bold text-brand-400" : ""}>{away}</span>
      </div>
      <div className="mt-1 flex h-1.5 gap-1 overflow-hidden">
        <div className="flex flex-1 justify-end rounded-full bg-pitch-700">
          <div
            className={`rounded-full ${home >= away ? "bg-brand-500" : "bg-pitch-500"}`}
            style={{ width: `${homePct}%` }}
          />
        </div>
        <div className="flex flex-1 rounded-full bg-pitch-700">
          <div
            className={`rounded-full ${away >= home ? "bg-brand-500" : "bg-pitch-500"}`}
            style={{ width: `${100 - homePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function LiveStatsPanel({ stats, isFinished }: { stats: LiveStats; isFinished: boolean }) {
  return (
    <div className="card-surface p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-silver-400">
        {isFinished ? "Estadísticas del partido" : "Estadísticas en vivo"}
      </h2>
      <div className="flex flex-col gap-4">
        <StatRow label="Posesión %" home={stats.possession.home} away={stats.possession.away} />
        <StatRow label="Tiros" home={stats.shots.home} away={stats.shots.away} />
        <StatRow label="Tiros a puerta" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
        <StatRow label="Córners" home={stats.corners.home} away={stats.corners.away} />
        <StatRow label="Tarjetas" home={stats.cards.home} away={stats.cards.away} />
      </div>
    </div>
  );
}

function FormStrip({ form, label }: { form: FormGame[]; label: string }) {
  if (form.length === 0) return null;
  const style: Record<FormGame["result"], string> = {
    W: "bg-brand-500/20 text-brand-400 border-brand-500/40",
    D: "bg-pitch-600 text-silver-400 border-pitch-500",
    L: "bg-risk-500/15 text-risk-500 border-risk-500/40",
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-sm text-silver-300">{label}</span>
      <div className="flex gap-1">
        {form.map((g, i) => (
          <span
            key={i}
            title={`${g.result} ${g.goalsFor}-${g.goalsAgainst}${g.opponent ? ` vs ${g.opponent}` : ""}`}
            className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold ${style[g.result]}`}
          >
            {g.result === "W" ? "G" : g.result === "D" ? "E" : "P"}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const detail = await getMatchDetail(id);
  if (!detail) notFound();

  const { match, formHome, formAway, h2h, odds, liveStats } = detail;
  const weather = await getMatchWeather(detail.venueCity, detail.venueCountry, match.kickoff);
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {isLive && <AutoRefresh seconds={45} />}

      {/* ─── Cabecera del partido (datos libres) ─── */}
      <div className="card-surface relative overflow-hidden p-6 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_100%_at_50%_-30%,rgba(164,225,0,0.08),transparent)]"
        />
        <div className="relative">
          <div className="flex items-center justify-between text-xs text-silver-500">
            <span>
              {match.league}
              {match.venue ? ` · ${match.venue}` : ""}
            </span>
            {isLive ? (
              <LiveBadge minute={match.minute} />
            ) : isFinished ? (
              <span className="rounded-full bg-pitch-700 px-2.5 py-0.5 text-[11px] font-semibold text-silver-500">
                Finalizado
              </span>
            ) : (
              <span className="font-mono">{formatKickoffFull(match.kickoff)}</span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <TeamBadge team={match.home} size={56} />
              </div>
              <p className="mt-2 font-semibold text-silver-100">{match.home.name}</p>
              <p className="text-xs text-silver-600">Local</p>
            </div>

            <div className="text-center">
              {match.score ? (
                <p className="font-mono text-4xl font-bold tabular-nums text-silver-100 md:text-5xl">
                  {match.score.home}
                  <span className="mx-2 text-silver-600">–</span>
                  {match.score.away}
                </p>
              ) : (
                <p className="font-mono text-2xl font-bold text-silver-500">VS</p>
              )}
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <TeamBadge team={match.away} size={56} />
              </div>
              <p className="mt-2 font-semibold text-silver-100">{match.away.name}</p>
              <p className="text-xs text-silver-600">Visitante</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-silver-500">
            {weather && (
              <span className="rounded-full border border-pitch-600 bg-pitch-800 px-3 py-1">
                🌡 {weather.tempC}°C · 🌧 {weather.precipProbPct}% · 💨 {weather.windKmh} km/h
              </span>
            )}
            {odds?.details && (
              <span className="rounded-full border border-pitch-600 bg-pitch-800 px-3 py-1">
                💱 Línea: {odds.details}
                {odds.overUnderLine ? ` · O/U ${odds.overUnderLine}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ─── Análisis (acción gateada) ─── */}
        <ScanPanel
          matchId={match.id}
          isLive={isLive}
          isFinished={isFinished}
          homeLabel={match.home.name}
          awayLabel={match.away.name}
          homeShort={match.home.shortName ?? "1"}
          awayShort={match.away.shortName ?? "2"}
        />

        {/* ─── Contexto libre ─── */}
        <div className="flex flex-col gap-6">
          {liveStats && <LiveStatsPanel stats={liveStats} isFinished={isFinished} />}

          {(formHome.length > 0 || formAway.length > 0) && (
            <div className="card-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-silver-400">
                Forma reciente
              </h2>
              <div className="flex flex-col gap-3">
                <FormStrip form={formHome} label={match.home.name} />
                <FormStrip form={formAway} label={match.away.name} />
              </div>
            </div>
          )}

          {h2h.length > 0 && (
            <div className="card-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-silver-400">
                Últimos enfrentamientos
              </h2>
              <ul className="flex flex-col gap-2.5 text-sm">
                {h2h.map((g, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-silver-400">
                    <span className="min-w-0 truncate">
                      {g.homeTeam} <span className="text-silver-600">vs</span> {g.awayTeam}
                    </span>
                    <span className="font-mono font-semibold text-silver-200">{g.score ?? "–"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card-surface p-5 text-xs leading-relaxed text-silver-600">
            <p>
              Las probabilidades se recalculan con cada dato nuevo (marcador, forma, cuotas,
              clima). Esto es análisis estadístico, no una garantía de resultado. Juega
              responsablemente. 18+
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
