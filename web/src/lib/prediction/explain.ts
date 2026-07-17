/**
 * Generador de explicaciones en español.
 * Convierte los factores del modelo en un párrafo natural y variado
 * (la variación se siembra con el id del partido para ser estable).
 *
 * Diseñado para poder sustituirse por una llamada a la API de Claude
 * cuando haya presupuesto — misma entrada, misma salida.
 */
import type { Prediction } from "@/lib/types";
import type { MatchDetail } from "@/lib/data/espn";

function seededIndex(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % len;
}

const OPENERS = [
  (h: string, a: string) => `Duelo entre ${h} y ${a} bajo la lupa del modelo.`,
  (h: string, a: string) => `El análisis de ${h} vs ${a} deja señales claras.`,
  (h: string, a: string) => `Esto es lo que dicen los datos del ${h} – ${a}:`,
];

const CLOSERS_ALTA = [
  (sel: string, p: number) => `Con todos los factores sobre la mesa, el modelo respalda "${sel}" con un ${p}% de probabilidad.`,
  (sel: string, p: number) => `La lectura completa apunta con fuerza a "${sel}" (${p}%).`,
];
const CLOSERS_MEDIA = [
  (sel: string, p: number) => `El valor está en "${sel}" (${p}%), aunque conviene un stake moderado.`,
  (sel: string, p: number) => `"${sel}" asoma como la mejor opción (${p}%), en un partido con margen de sorpresa.`,
];
const CLOSERS_BAJA = [
  (sel: string, p: number) => `Partido muy abierto: "${sel}" es lo más probable (${p}%), pero ningún escenario domina. Precaución.`,
];

export function buildSummary(prediction: Prediction, detail: MatchDetail): string {
  const { match } = detail;
  const parts: string[] = [];
  const seed = match.id;

  parts.push(OPENERS[seededIndex(seed, OPENERS.length)](match.home.name, match.away.name));

  // Los 3 factores más influyentes se narran tal cual (ya vienen ordenados)
  const top = prediction.factors.filter((f) => f.key !== "home").slice(0, 3);
  for (const f of top) {
    parts.push(f.detail);
  }

  const closers =
    prediction.pick.confidence === "alta"
      ? CLOSERS_ALTA
      : prediction.pick.confidence === "media"
        ? CLOSERS_MEDIA
        : CLOSERS_BAJA;
  parts.push(
    closers[seededIndex(seed + "c", closers.length)](
      prediction.pick.selection,
      prediction.pick.probability,
    ),
  );

  return parts.join(" ");
}
