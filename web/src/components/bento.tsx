import type { ReactNode } from "react";

/** Tarjeta base del bento grid. `lit` añade el filo superior iluminado. */
export function Bento({ children, className = "", lit = false }: { children: ReactNode; className?: string; lit?: boolean }) {
  return <div className={`${lit ? "bento-lit" : "bento"} p-5 md:p-6 ${className}`}>{children}</div>;
}

export function Micro({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`micro ${className}`}>{children}</p>;
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  const tones = {
    neutral: "",
    good: "border-brand-500/35 bg-brand-500/12 text-brand-300",
    bad: "border-risk-500/35 bg-risk-500/12 text-risk-500",
  };
  return <span className={`pill ${tones[tone]}`}>{children}</span>;
}

/**
 * Cifra grande con etiqueta. `tone` tiñe el número cuando el signo importa
 * (balance, ROI); por defecto va en blanco como la referencia monocroma.
 */
export function Stat({
  label,
  value,
  hint,
  tone = "plain",
  size = "md",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "plain" | "good" | "bad" | "muted";
  size?: "md" | "lg";
}) {
  const tones = { plain: "text-white", good: "text-brand-400", bad: "text-risk-500", muted: "text-silver-500" };
  return (
    <div>
      <Micro>{label}</Micro>
      <p className={`tabular mt-3 font-medium tracking-tight ${tones[tone]} ${size === "lg" ? "text-4xl md:text-5xl" : "text-3xl"}`}>{value}</p>
      {hint && <p className="mt-2 text-xs leading-5 text-silver-600">{hint}</p>}
    </div>
  );
}

/** Barra de composición horizontal segmentada (referencia: 58 / 34 / 8). */
export function SegmentBar({ segments }: { segments: Array<{ label: string; value: number; solid?: boolean }> }) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  if (total <= 0) return <div className="h-7 w-full rounded-md border border-white/10 bg-white/[.03]" />;
  return (
    <div className="flex h-7 w-full gap-1 overflow-hidden" role="img" aria-label={segments.map(s => `${s.label}: ${s.value}`).join(", ")}>
      {segments.map(s => s.value > 0 && (
        <div
          key={s.label}
          title={`${s.label}: ${s.value}`}
          style={{ width: `${(s.value / total) * 100}%` }}
          className={`h-full rounded-[5px] border border-white/12 ${s.solid ? "bg-white" : "hatch bg-white/[.06]"}`}
        />
      ))}
    </div>
  );
}
