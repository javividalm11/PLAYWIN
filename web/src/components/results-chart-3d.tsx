"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { TrackRecord } from "@/lib/predictions/store";
import { InterfaceIcon } from "./icons";

function LayersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 18l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Info({ label }: { label: string }) {
  return <span className="pv-performance-info" title={label} aria-label={label}>i</span>;
}
function ResultIcon({ won }: { won: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d={won ? "m5 12 4.5 4.5L19 7" : "m6 6 12 12M18 6 6 18"} stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Column({ x, bottom, height, width, kind, gradient, dimensional }: { x: number; bottom: number; height: number; width: number; kind: "won" | "lost"; gradient: string; dimensional: boolean }) {
  if (height <= 0) return null;
  const top = bottom - height;
  const depth = dimensional ? 11 : 0;
  const lift = dimensional ? 7 : 0;
  return <g className={`pv-column pv-column-${kind}`}>
    {dimensional && <path d={`M${x + width},${bottom} l${depth},-${lift} V${top - lift} l-${depth},${lift}Z`} fill={kind === "won" ? "#83d500" : "#ff263f"} />}
    <rect x={x} y={top} width={width} height={height} fill={`url(#${gradient})`} />
    {dimensional && <path d={`M${x},${top} l${depth},-${lift} h${width} l-${depth},${lift}Z`} fill={kind === "won" ? "#caff65" : "#ff8b95"} />}
    <path d={`M${x},${top} H${x + width} V${bottom}`} fill="none" stroke="#ffffff85" strokeWidth=".7" />
  </g>;
}

export function ResultsChart3D({ byDay }: { byDay: TrackRecord["byDay"] }) {
  const id = useId().replace(/:/g, "");
  const [days, setDays] = useState(14);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [showWon, setShowWon] = useState(true);
  const [showLost, setShowLost] = useState(true);
  const [dimensional, setDimensional] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const window = byDay.slice(-days);
  const won = window.reduce((sum, d) => sum + d.won, 0);
  const lost = window.reduce((sum, d) => sum + d.lost, 0);
  const total = won + lost;
  const peak = Math.max(0, ...window.map(d => d.won + d.lost));
  const rawStep = Math.max(1, peak / 4);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = ([1, 1.2, 1.5, 2, 2.4, 3, 4, 4.8, 5, 6, 8, 9.6, 10].find(n => n * magnitude >= rawStep) ?? 10) * magnitude;
  const ceiling = Math.max(4, step * 4);
  const bestDay = window.reduce<(typeof window)[number] | undefined>((best, d) => !best || d.won + d.lost > best.won + best.lost ? d : best, undefined);
  const selected = window.find(d => d.day === selectedDay) ?? bestDay;
  const selectedIndex = selected ? window.indexOf(selected) : -1;
  const baseline = 230;
  const plotHeight = 177;
  const slot = 990 / Math.max(1, window.length);
  const width = Math.min(31, slot * .46);
  const dateLabel = (day: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(`${day}T12:00:00`));
  const monthLabel = (day: string) => new Intl.DateTimeFormat("es-MX", { month: "short" }).format(new Date(`${day}T12:00:00`)).replace(".", "");
  const selectedTotal = selected ? selected.won + selected.lost : 0;
  const selectedX = 70 + selectedIndex * slot + (slot - width) / 2;
  const selectedHeight = selected ? ((showWon ? selected.won : 0) + (showLost ? selected.lost : 0)) / ceiling * plotHeight : 0;
  const tipX = Math.max(66, Math.min(923, selectedX > 720 ? selectedX - 179 : selectedX + width + 20));
  const tipY = Math.max(4, Math.min(116, baseline - selectedHeight - 93));
  const ratio = (count: number) => selectedTotal ? Math.round(count / selectedTotal * 100) : 0;
  const select = (day: string) => setSelectedDay(day);
  useEffect(() => {
    const scroll = scrollRef.current;
    const column = scroll?.querySelector('[aria-pressed="true"]');
    if (!scroll || !column || scroll.scrollWidth <= scroll.clientWidth) return;
    const rect = column.getBoundingClientRect();
    scroll.scrollLeft += rect.left - scroll.getBoundingClientRect().left + rect.width / 2 - scroll.clientWidth / 2;
  }, [selected?.day, days]);

  return <div className="pv-performance-scene">
    <div className="pv-chart3d pv-performance-glass">
      <div className="pv-performance-player" aria-hidden />
      <div className="pv-chart3d-head pv-performance-head"><div><p className="pv-eyebrow">RENDIMIENTO DEL MODELO</p><h3>La historia <span>detrás de cada pick.</span></h3><p>Aciertos y fallos por día · Últimos {days} días</p></div><p className="pv-performance-motto" aria-hidden>DATOS<br />QUE<br />GENERAN<br />VENTAJA</p><div className="pv-chart-period" aria-label="Periodo del gráfico">{[14, 30].map(n => <button key={n} type="button" aria-pressed={days === n} onClick={() => { setDays(n); setSelectedDay(null); }}>{n} días</button>)}</div></div>
      <div className="pv-chart-toolbar pv-performance-stats">
        <div className="pv-performance-stat"><span className="pv-performance-stat-icon"><LayersIcon /></span><strong>{total.toLocaleString("es-MX")}</strong><span>liquidados</span><Info label="Total de pronósticos acertados y fallados liquidados en el periodo seleccionado." /></div>
        <div className="pv-performance-stat"><span className="pv-performance-stat-icon pv-performance-target"><InterfaceIcon name="target" /></span><strong>{total ? `${Math.round(won / total * 100)}%` : "—"}</strong><span>de acierto</span><Info label="Pronósticos acertados divididos entre el total de aciertos y fallos del periodo." /></div>
        <div className="pv-chart-legend pv-performance-counts"><button type="button" aria-pressed={showWon} onClick={() => setShowWon(!showWon)}><i className="pv-legend-won" />Acertados <b>{won.toLocaleString("es-MX")}</b></button><button type="button" aria-pressed={showLost} onClick={() => setShowLost(!showLost)}><i className="pv-legend-lost" />Fallados <b>{lost.toLocaleString("es-MX")}</b></button></div>
      </div>
      <div className="pv-performance-plot">
        <div className="pv-performance-plot-head"><p>PICKS LIQUIDADOS</p><div><span><i className="pv-legend-won" />Acertados</span><span><i className="pv-legend-lost" />Fallados</span></div></div>
        <p className="pv-performance-scroll-hint">Desliza para explorar todos los días <span aria-hidden>↔</span></p>
        <div ref={scrollRef} className="pv-chart-scroll" tabIndex={0} role="region" aria-label="Gráfico de resultados. Desplázate horizontalmente en pantallas pequeñas." onPointerLeave={() => setTooltipVisible(false)}>
          <svg className="pv-chart-svg" viewBox="0 0 1120 286" preserveAspectRatio="none" role="group" aria-label={`Pronósticos liquidados en los últimos ${days} días. Selecciona un día para consultar sus resultados.`}>
            <defs>
              <linearGradient id={`${id}-won`} x1="0" x2="1" y1="0" y2=".2"><stop stopColor="#a4e100" /><stop offset=".35" stopColor="#c9ff36" /><stop offset="1" stopColor="#92e100" /></linearGradient>
              <linearGradient id={`${id}-lost`} x1="0" x2="1"><stop stopColor="#ff7c86" /><stop offset=".6" stopColor="#ff5669" /><stop offset="1" stopColor="#ff344d" /></linearGradient>
              <radialGradient id={`${id}-glow`}><stop stopColor="#a4e100" stopOpacity=".3" /><stop offset="1" stopColor="#a4e100" stopOpacity="0" /></radialGradient>
              <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#244036" floodOpacity=".12" /></filter>
            </defs>
            <path d={`M65 ${baseline} H1065 L1087 ${baseline - 13} H87Z`} fill="#eaf0e76b" stroke="#cdd7cf" strokeWidth=".6" />
            {[0, 1, 2, 3, 4].map(t => { const y = baseline - t * plotHeight / 4; return <g key={t}><text x="53" y={y + 4} textAnchor="end" fill="#53627d" fontSize="10">{ceiling * t / 4}</text><path d={`M65 ${y} l22 -13 H1087`} fill="none" stroke="#dce3ec" strokeWidth=".6" strokeDasharray={t === 0 ? undefined : "2 2"} /><path d={`M59 ${y} H65`} stroke="#acb8c8" strokeWidth=".6" /></g>; })}
            <path d={`M65 ${baseline} V53 l22 -13 V${baseline - 13}`} fill="none" stroke="#c2cddb" strokeWidth=".6" />
            {window.map((d, index) => {
              const x = 70 + index * slot + (slot - width) / 2;
              const wonH = showWon ? d.won / ceiling * plotHeight : 0;
              const lostH = showLost ? d.lost / ceiling * plotHeight : 0;
              const isSelected = selected?.day === d.day;
              const center = x + width / 2 + 5;
              return <g key={d.day} role="button" tabIndex={0} aria-label={`${dateLabel(d.day)}: ${d.won} acertados, ${d.lost} fallados`} aria-pressed={isSelected} className="pv-day-column" onFocus={() => { select(d.day); setTooltipVisible(true); }} onBlur={() => setTooltipVisible(false)} onClick={() => select(d.day)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(d.day); setTooltipVisible(true); } }}>
                <path d={`M${center} 40 V${baseline - 13}`} stroke="#dde4ed" strokeWidth=".6" strokeDasharray="2 2" />
                <rect x={x - 7} y="38" width={width + 25} height="198" rx="4" fill={isSelected ? "#a4e10006" : "transparent"} />
                {wonH + lostH > 0 ? <><ellipse cx={center + 5} cy={baseline + 1} rx={width * 1.4} ry="10" fill={`url(#${id}-glow)`} pointerEvents="none" /><g className="pv-bar-hit-area" onPointerEnter={() => { select(d.day); setTooltipVisible(true); }} onPointerLeave={() => setTooltipVisible(false)}><Column x={x} bottom={baseline} height={wonH} width={width} kind="won" gradient={`${id}-won`} dimensional={dimensional} /><Column x={x} bottom={baseline - wonH} height={lostH} width={width} kind="lost" gradient={`${id}-lost`} dimensional={dimensional} /></g></> : <path d={`M${x} ${baseline - 1} l11 -7 h${width} l-11 7Z`} fill="#c4ccd4b3" />}
                {isSelected && <g pointerEvents="none"><path d={`M${center} 1 V${baseline - wonH - lostH - 2}`} stroke="#90d721" strokeWidth=".8" strokeDasharray="2 2" /><circle cx={center} cy={baseline - wonH - lostH - 2} r="8" fill="#e1ff9b77" stroke="#7acb08" /><circle cx={center} cy={baseline - wonH - lostH - 2} r="4" fill="#a4e100" stroke="#fff" /><path d={`m${center - 6} ${baseline + 3} 6 6 6-6`} fill="none" stroke="#4f9900" strokeWidth="1.4" /></g>}
                <text x={center} y="255" textAnchor="middle" fill={isSelected ? "#175600" : "#53627d"} fontSize={isSelected ? "12" : "10"} fontWeight={isSelected ? "750" : "400"}><tspan x={center}>{d.label}</tspan><tspan x={center} dy="13">{monthLabel(d.day)}</tspan></text>
                {isSelected && <circle cx={center} cy="279" r="2" fill="#3d7d0a" />}
              </g>;
            })}
            {selected && <g className={`pv-performance-tooltip${tooltipVisible ? " is-visible" : ""}`} aria-hidden={!tooltipVisible} transform={`translate(${tipX} ${tipY})`} pointerEvents="none" filter={`url(#${id}-shadow)`}>
              <rect width="160" height="121" rx="13" fill="#ffffffee" stroke="#e0e7ef" strokeWidth=".8" />
              <text x="15" y="21" fill="#53627d" fontSize="10">{new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long" }).format(new Date(`${selected.day}T12:00:00`))}</text>
              <text x="15" y="48" fill="#080e1b" fontSize="25" fontWeight="750">{selectedTotal.toLocaleString("es-MX")}</text><text x="15" y="63" fill="#53627d" fontSize="10">liquidados</text>
              <circle cx="20" cy="84" r="5" fill="#a4e100" /><text x="33" y="88" fill="#101827" fontSize="11" fontWeight="750">{selected.won}</text><text x="60" y="88" fill="#53627d" fontSize="9">aciertos ({ratio(selected.won)}%)</text>
              <circle cx="20" cy="103" r="5" fill="#ff4e68" /><text x="33" y="107" fill="#101827" fontSize="11" fontWeight="750">{selected.lost}</text><text x="60" y="107" fill="#53627d" fontSize="9">fallos ({ratio(selected.lost)}%)</text>
            </g>}
          </svg>
        </div>
        {!total && <p className="pv-performance-empty">Sin pronósticos liquidados en este periodo.</p>}
      </div>
      <div className="pv-chart-detail pv-performance-detail" aria-live="polite" aria-atomic="true">
        <div className="pv-performance-date"><span>FECHA SELECCIONADA</span><strong><InterfaceIcon name="calendar" />{selected ? dateLabel(selected.day) : "—"}</strong></div>
        <div className="pv-performance-detail-item pv-performance-win"><span className="pv-performance-detail-icon"><ResultIcon won /></span><strong>{selected?.won.toLocaleString("es-MX") ?? "—"}</strong><span>aciertos</span></div>
        <div className="pv-performance-detail-item pv-performance-loss"><span className="pv-performance-detail-icon"><ResultIcon won={false} /></span><strong>{selected?.lost.toLocaleString("es-MX") ?? "—"}</strong><span>fallados</span></div>
        <div className="pv-performance-detail-item"><span className="pv-performance-detail-icon"><LayersIcon /></span><strong>{selected ? selectedTotal.toLocaleString("es-MX") : "—"}</strong><span>liquidados</span></div>
        <button type="button" className="pv-performance-view" aria-pressed={dimensional} onClick={() => setDimensional(!dimensional)}><svg viewBox="0 0 24 24" aria-hidden><path d="M3 14h4v8H3zM10 8h4v14h-4zM17 2h4v20h-4z" fill="currentColor" /></svg>VISTA {dimensional ? "3D" : "2D"}<span aria-hidden><svg viewBox="0 0 20 20" fill="none"><path d="m7 5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span></button>
      </div>
    </div>
    <p className="pv-performance-note">Historial del modelo · Aciertos y fallos incluidos · El rendimiento pasado no garantiza resultados futuros.</p>
  </div>;
}
