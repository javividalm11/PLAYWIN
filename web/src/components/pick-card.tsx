import Link from "next/link";
import type { Match, Prediction } from "@/lib/types";
import { confidenceStyles, formatKickoffFull } from "@/lib/format";
import { isSafePick } from "@/lib/prediction/config";

export function PickCard({ match, prediction }: { match: Match; prediction: Prediction }) {
  const conf = confidenceStyles[prediction.pick.confidence];
  const safe = isSafePick(prediction.pick.probability);

  return (
    <Link
      href={`/partido/${match.id}`}
      className="card-surface group relative block overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-brand-500/50"
    >
      {/* Probabilidad grande de fondo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-4 font-mono text-[88px] font-bold leading-none text-brand-500/8 transition-colors group-hover:text-brand-500/15"
      >
        {prediction.pick.probability}%
      </span>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          {safe && (
            <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-bold text-pitch-950">
              🔒 Pick seguro
            </span>
          )}
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${conf.className}`}>
            {conf.label}
          </span>
          <span className="text-[11px] text-silver-600">{prediction.pick.market}</span>
        </div>

        <p className="mt-3 text-lg font-bold leading-snug text-silver-100">
          {prediction.pick.selection}
        </p>
        <p className="mt-0.5 text-sm text-silver-500">
          {match.home.name} vs {match.away.name} · {formatKickoffFull(match.kickoff)}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <p className="line-clamp-2 max-w-[75%] text-xs leading-relaxed text-silver-500">
            {prediction.summary}
          </p>
          <span className="font-mono text-2xl font-bold text-brand-400">
            {prediction.pick.probability}%
          </span>
        </div>
      </div>
    </Link>
  );
}
