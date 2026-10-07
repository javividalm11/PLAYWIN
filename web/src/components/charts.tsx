/**
 * Gráficos monocromos del sistema bento. SVG puro, sin dependencias y
 * renderizables en servidor. El lima solo aparece donde el signo importa.
 */

/** Área + línea para series acumuladas (balance, bankroll). */
export function Sparkline({
  points,
  height = 130,
  tone = "brand",
  label,
}: {
  points: number[];
  height?: number;
  tone?: "brand" | "white";
  label: string;
}) {
  const W = 700;
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-silver-600" style={{ height }}>
        Aún no hay suficientes datos para trazar la curva.
      </div>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const pad = 10;
  const x = (i: number) => (i / (points.length - 1)) * (W - pad * 2) + pad;
  const y = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const stroke = tone === "brand" ? "#a4e100" : "#ffffff";
  const id = `spark-${tone}`;
  const zeroY = min < 0 && max > 0 ? y(0) : null;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} role="img" aria-label={label} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor={stroke} stopOpacity=".28" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {zeroY != null && <line x1={pad} x2={W - pad} y1={zeroY} y2={zeroY} stroke="#ffffff" strokeOpacity=".18" strokeDasharray="5 5" />}
      <path d={`${line} L${W - pad},${height - pad} L${pad},${height - pad} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Barras categóricas: tramadas por defecto, sólidas las destacadas —
 * el contraste trama/sólido de la referencia.
 */
export function HatchBars({
  data,
  height = 150,
}: {
  data: Array<{ label: string; value: number; solid?: boolean; tone?: "white" | "brand" | "risk" }>;
  height?: number;
}) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div>
      <div className="flex items-end gap-2 md:gap-3" style={{ height }}>
        {data.map(d => {
          const tone = d.tone ?? "white";
          const solidBg = tone === "brand" ? "bg-brand-500" : tone === "risk" ? "bg-risk-500" : "bg-white";
          const hatchBg = tone === "brand" ? "hatch-brand bg-brand-500/8" : tone === "risk" ? "hatch bg-risk-500/10" : "hatch bg-white/[.05]";
          return (
            <div key={d.label} className="flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.value}`}>
              <span className="tabular mb-2 text-center text-xs font-medium text-silver-300">{d.value}</span>
              <div
                className={`w-full rounded-t-[5px] border border-white/12 ${d.solid ? solidBg : hatchBg}`}
                style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 1)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2 md:gap-3">
        {data.map(d => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-silver-600">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Radar poligonal sobre anillos. Útil para repartos por mercado o por mes. */
export function Radar({ data, size = 230, label }: { data: Array<{ label: string; value: number }>; size?: number; label: string }) {
  const n = data.length;
  if (n < 3) return null;
  const c = size / 2;
  const r = c - 34;
  const max = Math.max(1, ...data.map(d => d.value));
  const at = (i: number, ratio: number) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return [c + Math.cos(a) * r * ratio, c + Math.sin(a) * r * ratio] as const;
  };
  const ring = (ratio: number) => data.map((_, i) => at(i, ratio).join(",")).join(" ");
  const shape = data.map((d, i) => at(i, d.value / max).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full" style={{ maxWidth: size }} role="img" aria-label={label}>
      {[0.25, 0.5, 0.75, 1].map(ratio => (
        <polygon key={ratio} points={ring(ratio)} fill="none" stroke="#ffffff" strokeOpacity={ratio === 1 ? ".16" : ".07"} />
      ))}
      {data.map((_, i) => {
        const [x, y] = at(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#ffffff" strokeOpacity=".07" />;
      })}
      <polygon points={shape} fill="#ffffff" fillOpacity=".1" stroke="#ffffff" strokeOpacity=".65" strokeWidth="1.5" strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = at(i, d.value / max);
        return <circle key={d.label} cx={x} cy={y} r="2.5" fill="#ffffff" fillOpacity=".85" />;
      })}
      {data.map((d, i) => {
        const [x, y] = at(i, 1.19);
        return (
          <text key={d.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#8f969e" letterSpacing=".06em">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
