import type { TrackRecord } from "@/lib/predictions/store";

const CHART_H = 140;

/**
 * Columnas apiladas de acertados/fallados por día (ventana de 14 días).
 * Los días sin picks liquidados muestran una línea base, para que una ventana
 * vacía se lea como "no hubo datos" y no como una gráfica rota.
 */
export function DailyChart({ byDay, days = 14, title = "Rendimiento por día — últimos 14 días" }: { byDay: TrackRecord["byDay"]; days?: number; title?: string }) {
  const window = byDay.slice(-days);
  const max = Math.max(1, ...window.map(d => d.won + d.lost));
  const settled = window.reduce((n, d) => n + d.won + d.lost, 0);

  return (
    <div className="card-surface overflow-hidden p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-silver-300">{title}</h2>
        {/* Leyenda de estados (icono + etiqueta, nunca solo color) */}
        <div className="flex gap-4 text-xs text-silver-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" aria-hidden /> ✓ Acertados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-risk-500" aria-hidden /> ✗ Fallados
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-1.5" style={{ height: CHART_H + 24 }}>
        {window.map(d => {
          const total = d.won + d.lost;
          const wonH = Math.round((d.won / max) * CHART_H);
          const lostH = Math.round((d.lost / max) * CHART_H);
          return (
            <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end gap-0">
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-pitch-600 bg-pitch-950 px-2.5 py-1.5 text-[11px] text-silver-300 group-hover:block">
                {new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(d.day + "T12:00:00"))}
                : <span className="font-semibold text-brand-400">{d.won} ✓</span> ·{" "}
                <span className="font-semibold text-risk-500">{d.lost} ✗</span>
              </div>

              {/* columna apilada: fallados arriba, acertados en la base */}
              <div className="flex w-full max-w-7 flex-col items-stretch transition-transform duration-300 group-hover:-translate-y-1">
                {lostH > 0 && (
                  <div
                    className="w-full rounded-t bg-gradient-to-b from-risk-500 to-risk-600 shadow-[0_0_12px_rgba(224,82,82,.18)]"
                    style={{ height: lostH }}
                  />
                )}
                {d.won > 0 && lostH > 0 && <div className="h-0.5 w-full" aria-hidden />}
                {wonH > 0 && (
                  <div
                    className={`w-full bg-gradient-to-b from-brand-400 to-brand-600 shadow-[0_0_14px_rgba(164,225,0,.2)] ${d.lost === 0 ? "rounded-t" : ""}`}
                    style={{ height: wonH }}
                  />
                )}
                {total === 0 && <div className="h-0.5 w-full rounded bg-pitch-600" aria-hidden />}
              </div>
              <span className="mt-2 text-[10px] text-silver-600">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-1 h-px w-full bg-pitch-600" aria-hidden />

      {settled === 0 && (
        <p className="mt-4 text-center text-xs leading-5 text-silver-500">
          Sin pronósticos liquidados en esta ventana. El histórico completo sigue disponible en{" "}
          <span className="text-silver-400">Resultados</span>.
        </p>
      )}
    </div>
  );
}
