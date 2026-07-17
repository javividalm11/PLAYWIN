import type { Probabilities } from "@/lib/types";

/**
 * Barra de probabilidades 1X2.
 * El resultado más probable se resalta en verde marca; el resto queda en grises.
 */
export function ProbBar({
  probs,
  homeLabel = "1",
  awayLabel = "2",
  compact = false,
}: {
  probs: Probabilities;
  homeLabel?: string;
  awayLabel?: string;
  compact?: boolean;
}) {
  const max = Math.max(probs.home, probs.draw, probs.away);
  const seg = (value: number, isMax: boolean) =>
    `${isMax ? "bg-gradient-to-r from-brand-500 to-brand-600" : "bg-pitch-500"} transition-all duration-700`;

  return (
    <div>
      <div
        className={`flex w-full overflow-hidden rounded-full ${compact ? "h-1.5" : "h-2.5"} bg-pitch-700`}
        role="img"
        aria-label={`Probabilidades: local ${probs.home}%, empate ${probs.draw}%, visitante ${probs.away}%`}
      >
        <div style={{ width: `${probs.home}%` }} className={seg(probs.home, probs.home === max)} />
        <div
          style={{ width: `${probs.draw}%` }}
          className={`${seg(probs.draw, probs.draw === max)} border-x border-pitch-900`}
        />
        <div style={{ width: `${probs.away}%` }} className={seg(probs.away, probs.away === max)} />
      </div>
      {!compact && (
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-silver-500">
          <span className={probs.home === max ? "font-semibold text-brand-400" : ""}>
            {homeLabel} {probs.home}%
          </span>
          <span className={probs.draw === max ? "font-semibold text-brand-400" : ""}>
            X {probs.draw}%
          </span>
          <span className={probs.away === max ? "font-semibold text-brand-400" : ""}>
            {awayLabel} {probs.away}%
          </span>
        </div>
      )}
    </div>
  );
}
