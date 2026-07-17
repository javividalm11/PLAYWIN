import Link from "next/link";
import type { Match, Prediction, Team } from "@/lib/types";
import { formatKickoff } from "@/lib/format";
import { ProbBar } from "./prob-bar";
import { LiveBadge } from "./live-badge";
import { TeamBadge } from "./team-badge";

function TeamRow({
  team,
  score,
  winner,
}: {
  team: Team;
  score?: number;
  winner?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamBadge team={team} size={26} />
        <span className={`truncate text-sm ${winner ? "font-semibold text-silver-100" : "text-silver-300"}`}>
          {team.name}
        </span>
      </div>
      {typeof score === "number" && (
        <span className={`font-mono text-base tabular-nums ${winner ? "font-bold text-brand-400" : "text-silver-400"}`}>
          {score}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ match, prediction }: { match: Match; prediction?: Prediction }) {
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";
  const homeWinning = (match.score?.home ?? 0) > (match.score?.away ?? 0);
  const awayWinning = (match.score?.away ?? 0) > (match.score?.home ?? 0);

  return (
    <Link
      href={`/partido/${match.id}`}
      className={`card-surface group block p-4 transition-all hover:-translate-y-0.5 hover:border-brand-500/50 ${
        isLive ? "border-brand-500/30" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-silver-500">{match.league}</span>
        {isLive ? (
          <LiveBadge minute={match.minute} />
        ) : isFinished ? (
          <span className="rounded-full bg-pitch-700 px-2.5 py-0.5 text-[11px] font-semibold text-silver-500">
            Finalizado
          </span>
        ) : match.status === "postponed" ? (
          <span className="rounded-full bg-pitch-700 px-2.5 py-0.5 text-[11px] font-semibold text-warn-400">
            Pospuesto
          </span>
        ) : (
          <span className="font-mono text-xs text-silver-400">{formatKickoff(match.kickoff)}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <TeamRow team={match.home} score={match.score?.home} winner={homeWinning} />
        <TeamRow team={match.away} score={match.score?.away} winner={awayWinning} />
      </div>

      {prediction && !isFinished && (
        <div className="mt-4 border-t border-pitch-700 pt-3">
          <ProbBar
            probs={prediction.probs}
            homeLabel={match.home.shortName ?? "1"}
            awayLabel={match.away.shortName ?? "2"}
          />
        </div>
      )}

      <div className="mt-3 text-right text-xs font-medium text-brand-500 opacity-0 transition-opacity group-hover:opacity-100">
        Ver análisis →
      </div>
    </Link>
  );
}
