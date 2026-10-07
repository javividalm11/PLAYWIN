import type { ReactNode } from "react";
import Link from "next/link";
import type { TrackRecord } from "@/lib/predictions/store";

/** Coloca aquí tu clip de deporte. Mientras no exista, se ve el fondo generativo. */
const HERO_VIDEO = "/brand/hero.mp4";

const DIRECTION = {
  up: "animate-fade-up",
  down: "animate-fade-down",
  scale: "animate-fade-scale",
} as const;

/** Entrada por CSS: arranca en opacity-0 y la revela el `forwards`. */
function Animate({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: keyof typeof DIRECTION;
}) {
  return (
    <div className={`opacity-0 ${DIRECTION[direction]} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/**
 * Tarjeta de cristal con el track record. Equivale a la "Revenue Card" de la
 * referencia: cifra grande, delta y barras diarias. Solo datos reales.
 */
function TrackCard({ track }: { track: TrackRecord | null }) {
  const won = track?.stats.won ?? 0;
  const settled = won + (track?.stats.lost ?? 0);
  const streak = track?.stats.streak ?? null;
  const days = (track?.byDay ?? []).slice(-32);
  const peak = Math.max(1, ...days.map(d => d.won + d.lost));

  return (
    <Animate delay={900} direction="scale" className="w-full max-w-[405px] mx-auto lg:mx-0">
      <div className="w-full rounded-[24px] sm:rounded-[33px] bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] p-5 sm:p-8 pb-5 sm:pb-6">
        <p className="text-white text-[16px] sm:text-[20px] font-[450] leading-[20px] mb-3 sm:mb-4">Track record</p>

        <p className="mb-2 sm:mb-3 tabular">
          <span className="text-white text-[28px] sm:text-[46px] font-[450] leading-[1]">{won.toLocaleString("es-MX")}</span>
          <span className="text-white/20 text-[28px] sm:text-[46px] font-[450] leading-[1]">/{settled.toLocaleString("es-MX")}</span>
        </p>

        <div className="flex items-center gap-[10px] mb-6 sm:mb-8">
          <span className={`px-[6px] py-[7px] rounded-[6px] text-[12px] sm:text-[14px] font-[450] leading-[14px] ${streak?.type === "lost" ? "bg-risk-500/25 text-white" : "bg-brand-500/25 text-white"}`}>
            {track?.stats.hitRate == null ? "—" : `${track.stats.hitRate}%`}
          </span>
          <span className="text-white/80 text-[12px] sm:text-[14px] font-[450] leading-[14px] opacity-70">
            {streak ? `racha de ${streak.count} ${streak.type === "won" ? "acertados" : "fallados"}` : "pronósticos liquidados"}
          </span>
        </div>

        <div className="relative">
          <div className="flex items-end gap-[1.5px] h-[80px] sm:h-[100px]">
            {days.map((d, i) => {
              const total = d.won + d.lost;
              const allWon = total > 0 && d.lost === 0;
              return (
                <div
                  key={d.day}
                  title={`${d.label}: ${d.won} acertados, ${d.lost} fallados`}
                  className="flex-1 rounded-[0.5px] animate-bar-grow origin-bottom"
                  style={{
                    height: `${Math.max((total / peak) * 100, 2)}%`,
                    backgroundColor: total === 0 ? "rgba(255,255,255,0.1)" : allWon ? "#a4e100" : "rgba(255,255,255,0.85)",
                    animationDelay: `${1100 + i * 30}ms`,
                  }}
                />
              );
            })}
          </div>

          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${((i + 1) / 5) * 100}%` }} />
            ))}
          </div>

          <div className="flex justify-between mt-3">
            {days.filter((_, i) => i % 8 === 0 || i === days.length - 1).map((d, i, arr) => (
              <span
                key={d.day}
                className="text-[9px] sm:text-[10px] font-[450] leading-[10px] text-white/80"
                style={{ opacity: i >= arr.length - 2 ? 0.4 : 1 }}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Animate>
  );
}

export function HomeHero({ live, upcoming, track }: { live: number; upcoming: number; track: TrackRecord | null }) {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-pitch-900">
      {/* Fondo generativo: se ve mientras el vídeo carga, o si aún no existe. */}
      <div className="hero-canvas" aria-hidden="true">
        <div className="hero-grid" />
      </div>

      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* Velo: el vídeo de deporte es más claro que la nebulosa de la referencia
          y sin esto el titular pierde contraste. */}
      <div className="absolute inset-0 bg-gradient-to-r from-pitch-950/85 via-pitch-950/55 to-pitch-950/30" aria-hidden="true" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center py-8">
          <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-24 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            <div className="max-w-[593px]">
              <Animate delay={300}>
                <h1 className="text-white text-[36px] sm:text-[52px] md:text-[64px] lg:text-[72px] font-normal leading-[0.95] mb-5 sm:mb-8">
                  Lee el partido antes de que empiece
                </h1>
              </Animate>

              <Animate delay={500}>
                <p className="text-white/80 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.3] max-w-[370px] mb-7 sm:mb-10">
                  Modelos probabilísticos y datos en vivo. Cada pronóstico queda registrado antes del pitido inicial.
                </p>
              </Animate>

              <Animate delay={700}>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <Link
                    href="/registro"
                    className="inline-flex items-center h-[46px] sm:h-[51px] px-5 sm:px-[27px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-90"
                  >
                    Empezar gratis
                  </Link>
                  <Link
                    href="/resultados"
                    className="inline-flex items-center h-[46px] sm:h-[51px] px-5 sm:px-[27px] rounded-[12px] border border-white text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-80"
                  >
                    Ver resultados
                  </Link>
                </div>
              </Animate>

              <Animate delay={800}>
                <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-white/60">
                  <span><strong className="tabular font-[450] text-white">{live}</strong> en vivo</span>
                  <span><strong className="tabular font-[450] text-white">{upcoming}</strong> próximos hoy</span>
                  <span>18+ · Análisis, no casa de apuestas</span>
                </div>
              </Animate>
            </div>

            <TrackCard track={track} />
          </div>
        </div>
      </div>
    </section>
  );
}
