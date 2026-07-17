/** Helpers de formato compartidos */

export function formatKickoff(iso: string): string {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatKickoffFull(iso: string): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export const confidenceStyles: Record<
  "alta" | "media" | "baja",
  { label: string; className: string }
> = {
  alta: {
    label: "Confianza alta",
    className: "bg-brand-500/15 text-brand-400 border-brand-500/40",
  },
  media: {
    label: "Confianza media",
    className: "bg-warn-500/10 text-warn-400 border-warn-500/40",
  },
  baja: {
    label: "Confianza baja",
    className: "bg-risk-500/10 text-risk-500 border-risk-500/40",
  },
};
