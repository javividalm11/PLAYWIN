/**
 * GET /api/admin/backtest?days=7 — Backtest del motor contra resultados reales.
 * Para cada partido TERMINADO de los últimos N días reconstruye el pick
 * pre-partido (sin ver el marcador) y lo evalúa contra el resultado final.
 * NO escribe en la tabla predictions: es puro análisis.
 *
 * Devuelve acierto por umbral de probabilidad, mercado y confianza —
 * la curva que decide qué publicar en un tier "alta certeza".
 */
import { NextResponse, type NextRequest } from "next/server";
import { getScoreboard, getMatchDetail } from "@/lib/data/espn";
import { buildPrediction } from "@/lib/prediction/engine";
import { asPrematch } from "@/lib/predictions/backfill";
import { evaluatePick } from "@/lib/predictions/store";
import { isCurrentUserAdmin } from "@/lib/access/admin";

export const dynamic = "force-dynamic";

type Sample = {
  probability: number;
  market: string;
  confidence: string;
  outcome: "won" | "lost" | "void";
};

function bucketStats(samples: Sample[], filter: (s: Sample) => boolean) {
  const subset = samples.filter((s) => filter(s) && s.outcome !== "void");
  const won = subset.filter((s) => s.outcome === "won").length;
  return {
    n: subset.length,
    won,
    hitRate: subset.length ? Math.round((won / subset.length) * 1000) / 10 : null,
  };
}

export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  if (!(await isCurrentUserAdmin()) && !isDev) {
    return NextResponse.json({ error: "solo admin" }, { status: 403 });
  }

  const days = Math.min(14, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 7)));
  const samples: Sample[] = [];
  let failed = 0;

  for (let i = 1; i <= days; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toLocaleDateString("en-CA").replace(/-/g, "");
    const matches = (await getScoreboard(d)).filter(
      (m) => m.status === "finished" && m.score,
    );

    // Concurrencia limitada para no castigar la fuente
    const queue = [...matches];
    async function worker() {
      while (queue.length) {
        const m = queue.shift()!;
        try {
          const detail = await getMatchDetail(m.id);
          if (!detail || detail.match.status !== "finished" || !detail.match.score) continue;
          const prediction = buildPrediction(asPrematch(detail), null);
          if (!prediction.pick.code) continue;
          samples.push({
            probability: prediction.pick.probability,
            market: prediction.pick.market,
            confidence: prediction.pick.confidence,
            outcome: evaluatePick(
              prediction.pick.code,
              detail.match.score.home,
              detail.match.score.away,
            ),
          });
        } catch {
          failed++;
        }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  const thresholds = [50, 60, 65, 70, 75, 80, 85, 90];
  const markets = [...new Set(samples.map((s) => s.market))];

  return NextResponse.json({
    days,
    totalEvaluated: samples.length,
    failed,
    overall: bucketStats(samples, () => true),
    porUmbral: Object.fromEntries(
      thresholds.map((t) => [`>=${t}%`, bucketStats(samples, (s) => s.probability >= t)]),
    ),
    porMercado: Object.fromEntries(
      markets.map((mk) => [mk, bucketStats(samples, (s) => s.market === mk)]),
    ),
    porConfianza: Object.fromEntries(
      ["alta", "media", "baja"].map((c) => [c, bucketStats(samples, (s) => s.confidence === c)]),
    ),
  });
}
