"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bento, Micro, Pill, Stat, SegmentBar } from "./bento";
import { Sparkline, HatchBars } from "./charts";

type Bet = { id: string; event_name: string; selection: string; stake: number; odds: number; status: "pending" | "won" | "lost" | "void"; placed_at: string };

const LABELS = { pending: "Pendiente", won: "Ganada", lost: "Perdida", void: "Nula" } as const;
const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const profit = (b: Bet) => (b.status === "won" ? Number(b.stake) * (Number(b.odds) - 1) : b.status === "lost" ? -Number(b.stake) : 0);

export function BetDashboard() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [eventName, setEventName] = useState("");
  const [selection, setSelection] = useState("");
  const [stake, setStake] = useState("");
  const [odds, setOdds] = useState("");

  useEffect(() => {
    fetch("/api/bets", { cache: "no-store" })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); setBets(data.bets ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const settled = bets.filter(b => b.status === "won" || b.status === "lost");
    const won = settled.filter(b => b.status === "won").length;
    const staked = settled.reduce((n, b) => n + Number(b.stake), 0);
    const net = settled.reduce((n, b) => n + profit(b), 0);
    const curve = [...settled]
      .sort((a, b) => a.placed_at.localeCompare(b.placed_at))
      .reduce<number[]>((acc, b) => [...acc, (acc.at(-1) ?? 0) + profit(b)], [0]);
    return {
      net,
      staked,
      roi: staked ? (net / staked) * 100 : null,
      hit: settled.length ? (won / settled.length) * 100 : null,
      won,
      lost: settled.length - won,
      pending: bets.filter(b => b.status === "pending").length,
      settled: settled.length,
      curve,
      biggest: Math.max(0, ...settled.map(b => Math.abs(profit(b)))),
    };
  }, [bets]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/bets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName, selection, stake: Number(stake), odds: Number(odds) }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setBets(v => [data.bet, ...v]);
      setEventName(""); setSelection(""); setStake(""); setOdds("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, status: Bet["status"]) {
    setError("");
    const r = await fetch("/api/bets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const data = await r.json();
    if (r.ok) setBets(v => v.map(b => (b.id === id ? data.bet : b)));
    else setError(data.error);
  }

  async function remove(id: string) {
    setError("");
    const r = await fetch("/api/bets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await r.json();
    if (r.ok) setBets(v => v.filter(b => b.id !== id));
    else setError(data.error);
  }

  const field = "mt-2 w-full rounded-[10px] border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white/30";

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
      <div className="spotlight" aria-hidden />

      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div>
          <Micro>Área personal · Control de apuestas</Micro>
          <h1 className="display mt-3 text-[clamp(36px,5vw,64px)]">Tu juego, en perspectiva.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-silver-500">
            Registra las apuestas que haces fuera de PickVerde y mide el balance real. Los resultados los marcas tú.
          </p>
        </div>
        <Link href="/picks" className="pill !px-4 !py-2.5 transition-colors hover:bg-white/10">Explorar pronósticos ↗</Link>
      </div>

      {error && (
        <div role="alert" className="relative mt-7 border-l-2 border-warn-500 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
          {error} {error.includes("sesión") && <Link href="/login" className="ml-1 underline">Acceder</Link>}
        </div>
      )}

      {/* Fila de métricas */}
      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Bento lit>
          <Stat label="Balance neto" value={loading ? "…" : money(stats.net)} tone={stats.net > 0 ? "good" : stats.net < 0 ? "bad" : "plain"} hint="Solo apuestas liquidadas" size="lg" />
        </Bento>
        <Bento>
          <Stat label="ROI" value={loading ? "…" : stats.roi == null ? "—" : `${stats.roi.toFixed(1)}%`} tone={(stats.roi ?? 0) > 0 ? "good" : (stats.roi ?? 0) < 0 ? "bad" : "plain"} hint={stats.staked ? `sobre ${money(stats.staked)} arriesgados` : "Beneficio / importe liquidado"} />
        </Bento>
        <Bento>
          <Stat label="Tasa de acierto" value={loading ? "…" : stats.hit == null ? "—" : `${stats.hit.toFixed(1)}%`} hint={`${stats.settled} liquidadas · ${stats.won}✓ ${stats.lost}✗`} />
        </Bento>
        <Bento>
          <Stat label="Pendientes" value={loading ? "…" : String(stats.pending)} tone="muted" hint="Por resolver" />
        </Bento>
      </div>

      {/* Curva + composición */}
      <div className="relative mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Bento lit>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Micro>Evolución</Micro>
              <h2 className="mt-2 text-xl text-white">Balance acumulado</h2>
            </div>
            <Pill tone={stats.net > 0 ? "good" : stats.net < 0 ? "bad" : "neutral"}>
              {stats.settled} liquidadas
            </Pill>
          </div>
          <div className="mt-6">
            <Sparkline points={stats.curve} label="Balance acumulado de tus apuestas" tone={stats.net < 0 ? "white" : "brand"} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-silver-600">
            <span>Primera apuesta</span>
            <span>Actualidad</span>
          </div>
        </Bento>

        <Bento>
          <Micro>Composición</Micro>
          <h2 className="mt-2 text-xl text-white">Reparto de apuestas</h2>
          <div className="mt-6 flex items-baseline gap-5">
            <span className="tabular text-3xl font-medium text-white">{stats.won}</span>
            <span className="tabular text-3xl font-medium text-silver-500">{stats.lost}</span>
            <span className="tabular text-3xl font-medium text-silver-600">{stats.pending}</span>
          </div>
          <div className="mt-2 flex gap-5 text-[10px] text-silver-600">
            <span>Ganadas</span><span>Perdidas</span><span>Pendientes</span>
          </div>
          <div className="mt-5">
            <SegmentBar segments={[
              { label: "Ganadas", value: stats.won, solid: true },
              { label: "Perdidas", value: stats.lost },
              { label: "Pendientes", value: stats.pending },
            ]} />
          </div>
          <div className="mt-6">
            <HatchBars
              height={110}
              data={[
                { label: "Ganadas", value: stats.won, solid: true, tone: "brand" },
                { label: "Perdidas", value: stats.lost, tone: "risk" },
                { label: "Pendientes", value: stats.pending },
              ]}
            />
          </div>
        </Bento>
      </div>

      {/* Alta de apuesta */}
      <div className="relative mt-4 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Bento>
          <Micro>Nuevo registro</Micro>
          <h2 className="mt-2 text-xl text-white">Añadir apuesta</h2>
          <form onSubmit={submit} className="mt-6">
            <label className="block text-xs font-semibold text-silver-400">
              Evento
              <input required minLength={2} maxLength={120} value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Real Madrid vs Barcelona" className={field} />
            </label>
            <label className="mt-4 block text-xs font-semibold text-silver-400">
              Selección
              <input required minLength={2} maxLength={120} value={selection} onChange={e => setSelection(e.target.value)} placeholder="Más de 2.5 goles" className={field} />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-silver-400">
                Importe (MXN)
                <input required type="number" min="0.01" max="1000000" step="0.01" value={stake} onChange={e => setStake(e.target.value)} placeholder="100" className={field} />
              </label>
              <label className="block text-xs font-semibold text-silver-400">
                Cuota decimal
                <input required type="number" min="1.01" max="1000" step="0.001" value={odds} onChange={e => setOdds(e.target.value)} placeholder="1.85" className={field} />
              </label>
            </div>
            <button disabled={saving} className="mt-6 w-full rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-pitch-950 transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar apuesta"}
            </button>
            <p className="mt-3 text-[11px] leading-5 text-silver-600">
              Tu registro es privado. PickVerde no acepta ni procesa apuestas.
            </p>
          </form>
        </Bento>

        <Bento>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <Micro>Historial</Micro>
              <h2 className="mt-2 text-xl text-white">Todas tus apuestas</h2>
            </div>
            <span className="text-xs text-silver-600">{bets.length} registros</span>
          </div>

          <div className="mt-5 -mx-5 overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Evento / selección", "Fecha", "Importe", "Cuota", "Balance", "Estado", ""].map(h => (
                    <th key={h} className="micro px-5 pb-3 font-semibold md:px-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bets.map(b => (
                  <tr key={b.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3.5 md:px-6">
                      <strong className="block font-medium text-white">{b.event_name}</strong>
                      <span className="text-xs text-silver-600">{b.selection}</span>
                    </td>
                    <td className="tabular px-5 py-3.5 text-silver-500 md:px-6">{new Date(b.placed_at).toLocaleDateString("es-MX")}</td>
                    <td className="tabular px-5 py-3.5 text-silver-300 md:px-6">{money(b.stake)}</td>
                    <td className="tabular px-5 py-3.5 text-silver-300 md:px-6">{Number(b.odds).toFixed(2)}</td>
                    <td className={`tabular px-5 py-3.5 md:px-6 ${profit(b) > 0 ? "text-brand-400" : profit(b) < 0 ? "text-risk-500" : "text-silver-600"}`}>
                      {b.status === "pending" ? "—" : money(profit(b))}
                    </td>
                    <td className="px-5 py-3.5 md:px-6">
                      <select
                        aria-label={`Estado de ${b.event_name}`}
                        value={b.status}
                        onChange={e => update(b.id, e.target.value as Bet["status"])}
                        className="rounded-lg border border-white/10 bg-pitch-850 px-2 py-1.5 text-xs text-white"
                      >
                        {Object.entries(LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 md:px-6">
                      <button onClick={() => remove(b.id)} className="text-xs text-silver-600 transition-colors hover:text-risk-500" aria-label={`Eliminar ${b.event_name}`}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bets.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-silver-600 md:px-6">
                {loading ? "Cargando registros…" : "Aún no hay apuestas registradas."}
              </p>
            )}
          </div>
        </Bento>
      </div>

      <p className="relative mt-8 text-center text-[11px] text-silver-600">
        18+ · El rendimiento pasado no garantiza resultados futuros. Juega con responsabilidad.
      </p>
    </div>
  );
}
