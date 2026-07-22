import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { settlePending, getTrackRecord, type PredictionRow, type TrackRecord } from "@/lib/predictions/store";

export const metadata: Metadata = { title: "Resultados del modelo" };
export const dynamic = "force-dynamic";

/* Colores de ESTADO (validados para daltonismo: verde↔rojo ΔE 10.3 deutan).
   Regla: el estado SIEMPRE lleva icono + etiqueta, nunca solo color. */
const OUTCOME = {
  won: { label: "Acertado", icon: "✓", bar: "bg-brand-500", chip: "bg-brand-500/15 text-brand-400" },
  lost: { label: "Fallado", icon: "✗", bar: "bg-risk-500", chip: "bg-risk-500/15 text-risk-500" },
  pending: { label: "Pendiente", icon: "●", bar: "bg-pitch-500", chip: "bg-pitch-600 text-silver-400" },
  void: { label: "Nulo", icon: "–", bar: "bg-warn-500", chip: "bg-warn-500/15 text-warn-400" },
} as const;

function fmtDate(dt: string): string {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dt));
}

/* ─────────── KPI tiles ─────────── */

function StatTile({
  label,
  value,
  hint,
  hero = false,
}: {
  label: string;
  value: string;
  hint?: string;
  hero?: boolean;
}) {
  return (
    <div className="card-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-silver-500">{label}</p>
      <p
        className={`mt-2 font-semibold text-silver-100 ${hero ? "text-5xl text-brand-400" : "text-3xl"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-silver-600">{hint}</p>}
    </div>
  );
}

/* ─────────── Gráfica: rendimiento por día (columnas apiladas) ─────────── */

function DailyChart({ byDay }: { byDay: TrackRecord["byDay"] }) {
  const CHART_H = 140;
  const max = Math.max(1, ...byDay.map((d) => d.won + d.lost));

  return (
    <div className="card-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-silver-400">
          Rendimiento por día — últimos 14 días
        </h2>
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
        {byDay.map((d) => {
          const total = d.won + d.lost;
          const wonH = Math.round((d.won / max) * CHART_H);
          const lostH = Math.round((d.lost / max) * CHART_H);
          return (
            <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end gap-0">
              {/* tooltip */}
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-pitch-600 bg-pitch-950 px-2.5 py-1.5 text-[11px] text-silver-300 group-hover:block">
                {new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(d.day + "T12:00:00"))}
                : <span className="font-semibold text-brand-400">{d.won} ✓</span> ·{" "}
                <span className="font-semibold text-risk-500">{d.lost} ✗</span>
              </div>

              {/* columna apilada: fallados arriba, acertados en la base */}
              <div className="flex w-full max-w-6 flex-col items-stretch">
                {lostH > 0 && (
                  <div
                    className={`w-full bg-risk-500 ${d.won === 0 ? "rounded-t" : "rounded-t"}`}
                    style={{ height: lostH }}
                  />
                )}
                {d.won > 0 && lostH > 0 && <div className="h-0.5 w-full" aria-hidden />}
                {wonH > 0 && (
                  <div
                    className={`w-full bg-brand-500 ${d.lost === 0 ? "rounded-t" : ""}`}
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
    </div>
  );
}

/* ─────────── Visualización por partido ─────────── */

function MatchRow({ row }: { row: PredictionRow }) {
  const o = OUTCOME[row.outcome];
  return (
    <li className="border-b border-pitch-700/60 py-3.5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <Link
            href={`/partido/${row.match_id}`}
            className="truncate text-sm font-semibold text-silver-100 hover:text-brand-400"
          >
            {row.match_label}
          </Link>
          <p className="mt-0.5 text-xs text-silver-500">
            {fmtDate(row.kickoff)} · {row.market}: {row.selection}
            {row.final_score ? ` · Final ${row.final_score}` : ""}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${o.chip}`}
        >
          {o.icon} {o.label}
        </span>
      </div>

      {/* barra de probabilidad (magnitud) coloreada por estado */}
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-pitch-700">
          <div
            className={`h-full rounded-r ${o.bar}`}
            style={{ width: `${row.probability}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-silver-400">
          {row.probability}%
        </span>
      </div>
    </li>
  );
}

/* ─────────── Página ─────────── */

export default async function ResultsPage() {
  await settlePending();
  const tr = await getTrackRecord();

  if (!tr) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="card-surface p-8 text-sm leading-relaxed text-silver-400">
          <h1 className="mb-3 text-xl font-bold text-silver-100">📊 Resultados del modelo</h1>
          Para activar el track record ejecuta{" "}
          <code className="rounded bg-pitch-700 px-1.5 py-0.5 text-brand-400">
            supabase/migrations/002-pronosticos.sql
          </code>{" "}
          en el SQL Editor de Supabase.
        </div>
      </div>
    );
  }

  const { stats, byDay, rows } = tr;
  const settled = stats.won + stats.lost;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AutoRefresh seconds={90} />
      <h1 className="text-2xl font-bold text-silver-100">📊 Resultados del modelo</h1>
      <p className="mt-1 max-w-2xl text-sm text-silver-500">
        Cada pronóstico se congela antes del kickoff y se liquida automáticamente con el
        marcador final. Sin trampas: esta página incluye aciertos y fallos.
      </p>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Acierto histórico"
          value={stats.hitRate != null ? `${stats.hitRate}%` : "—"}
          hint={settled > 0 ? `sobre ${settled} liquidados` : "aún sin liquidados"}
          hero
        />
        <StatTile
          label="Hoy"
          value={`${stats.today.won}✓ ${stats.today.lost}✗`}
          hint={`${stats.today.pending} pendientes`}
        />
        <StatTile
          label="Racha actual"
          value={
            stats.streak
              ? `${stats.streak.count} ${stats.streak.type === "won" ? "✓" : "✗"}`
              : "—"
          }
          hint={
            stats.streak
              ? stats.streak.type === "won"
                ? "aciertos seguidos"
                : "fallos seguidos"
              : "sin liquidados aún"
          }
        />
        <StatTile
          label="🔒 Picks seguros"
          value={stats.safe.hitRate != null ? `${stats.safe.hitRate}%` : "—"}
          hint={
            stats.safe.won + stats.safe.lost > 0
              ? `${stats.safe.won}✓ ${stats.safe.lost}✗ · prob. ≥85% · ${stats.total} pronósticos totales`
              : `aún sin liquidados · ${stats.total} pronósticos totales`
          }
        />
      </div>

      {/* Gráfica diaria */}
      <div className="mt-6">
        <DailyChart byDay={byDay} />
      </div>

      {/* Por partido */}
      <section className="mt-6">
        <div className="card-surface p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-silver-400">
              Pronósticos por partido
            </h2>
            <div className="flex flex-wrap gap-3 text-[11px] text-silver-500">
              {(Object.keys(OUTCOME) as Array<keyof typeof OUTCOME>).map((k) => (
                <span key={k} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${OUTCOME[k].bar}`} aria-hidden />
                  {OUTCOME[k].icon} {OUTCOME[k].label}
                </span>
              ))}
            </div>
          </div>

          {rows.length > 0 ? (
            (() => {
              const now = Date.now();
              // Jugados/en juego primero (más reciente arriba); próximos al final
              const past = rows.filter((r) => new Date(r.kickoff).getTime() <= now);
              const upcoming = rows
                .filter((r) => new Date(r.kickoff).getTime() > now)
                .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
              return (
                <>
                  <ul className="mt-4">
                    {past.slice(0, 30).map((r) => (
                      <MatchRow key={r.id} row={r} />
                    ))}
                  </ul>
                  {upcoming.length > 0 && (
                    <>
                      <h3 className="mt-8 mb-2 text-xs font-bold uppercase tracking-wider text-silver-500">
                        📅 Próximos pronósticos ya congelados
                      </h3>
                      <ul>
                        {upcoming.slice(0, 15).map((r) => (
                          <MatchRow key={r.id} row={r} />
                        ))}
                      </ul>
                    </>
                  )}
                </>
              );
            })()
          ) : (
            <p className="mt-6 py-8 text-center text-sm text-silver-600">
              Aún no hay pronósticos registrados. Se guardan automáticamente cuando el
              modelo analiza los partidos del día — vuelve en unos minutos.
            </p>
          )}
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-silver-600">
        Los pronósticos pendientes se liquidan al finalizar cada partido. Rendimiento
        pasado no garantiza resultados futuros. 18+
      </p>
    </div>
  );
}
