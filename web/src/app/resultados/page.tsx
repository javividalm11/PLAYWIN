import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { InterfaceIcon, type InterfaceIconName } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";
import { DailyChart } from "@/components/daily-chart";
import { settlePending, getTrackRecord, type PredictionRow } from "@/lib/predictions/store";

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
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  hero?: boolean;
  icon: InterfaceIconName;
}) {
  return (
    <div className="card-surface interactive-card group overflow-hidden p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-silver-500">{label}</p>
          <p className={`mt-3 font-mono font-bold tracking-tight text-silver-100 ${hero ? "text-5xl text-brand-400" : "text-4xl"}`}>{value}</p>
        </div>
        <span className="icon-well flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-400/10 text-brand-400"><InterfaceIcon name={icon} className="h-5 w-5" /></span>
      </div>
      {hint && <p className="mt-2 text-xs leading-5 text-silver-600">{hint}</p>}
      <div className="mt-5 h-px bg-gradient-to-r from-brand-400/45 to-transparent" />
    </div>
  );
}

/* ─────────── Visualización por partido ─────────── */

function MatchRow({ row }: { row: PredictionRow }) {
  const o = OUTCOME[row.outcome];
  return (
    <li className="rounded-xl border-b border-pitch-700/60 px-3 py-3.5 transition-colors hover:bg-white/[.025] last:border-0">
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
          <h1 className="mb-3 flex items-center gap-3 text-xl font-bold text-silver-100"><InterfaceIcon name="chart" className="h-6 w-6 text-brand-400" /> Resultados del modelo</h1>
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AutoRefresh seconds={90} />
      <PageHeading eyebrow="Transparencia PickVerde" title="Rendimiento del modelo" icon="chart" description={<>Cada pronóstico queda registrado antes del inicio y se liquida automáticamente con el marcador final. <strong className="font-semibold text-silver-200">Aciertos y fallos, sin filtros.</strong></>} />

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Acierto histórico"
          value={stats.hitRate != null ? `${stats.hitRate}%` : "—"}
          hint={settled > 0 ? `sobre ${settled} liquidados` : "aún sin liquidados"}
          hero
          icon="trophy"
        />
        <StatTile
          label="Hoy"
          value={`${stats.today.won}✓ ${stats.today.lost}✗`}
          hint={`${stats.today.pending} pendientes`}
          icon="calendar"
        />
        <StatTile
          label="Racha actual"
          value={
            stats.streak
              ? `${stats.streak.count} ${stats.streak.type === "won" ? "✓" : "✗"}`
              : "—"
          }
          icon="pulse"
          hint={
            stats.streak
              ? stats.streak.type === "won"
                ? "aciertos seguidos"
                : "fallos seguidos"
              : "sin liquidados aún"
          }
        />
        <StatTile
          label="Picks de alta confianza"
          value={stats.safe.hitRate != null ? `${stats.safe.hitRate}%` : "—"}
          hint={
            stats.safe.won + stats.safe.lost > 0
              ? `${stats.safe.won}✓ ${stats.safe.lost}✗ · prob. ≥85% · ${stats.total} pronósticos totales`
              : `aún sin liquidados · ${stats.total} pronósticos totales`
          }
          icon="shield"
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
            <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-silver-300">
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
              // Liquidados primero; pronósticos aún pendientes al final.
              const past = rows.filter((r) => r.outcome !== "pending");
              const upcoming = rows
                .filter((r) => r.outcome === "pending")
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
                        Próximos pronósticos ya registrados
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
