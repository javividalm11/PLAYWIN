/**
 * GET /api/live/[id] — Snapshot en vivo (marcador, stats, probabilidades).
 * Gateado igual que /api/predict: es consumo del servicio.
 */
import { NextResponse } from "next/server";
import { getMatchAnalysis } from "@/lib/data";
import { gateServiceAction, logServiceEvent } from "@/lib/access/gate";

export async function GET(_req: Request, ctx: RouteContext<"/api/live/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const { identity, result } = await gateServiceAction("live", id);
  if (!result.allowed) {
    // Los reintentos denegados de polling no se registran (inflarían la tabla)
    return NextResponse.json(
      { error: "trial_expired", nextStep: result.nextStep },
      { status: 402 },
    );
  }

  const analysis = await getMatchAnalysis(id);
  if (!analysis) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }
  const { match } = analysis.detail;
  await logServiceEvent(
    identity,
    "live",
    id,
    result,
    `${match.home.name} vs ${match.away.name}`,
  );
  return NextResponse.json({
    match: analysis.detail.match,
    liveStats: analysis.detail.liveStats ?? null,
    prediction: analysis.prediction,
  });
}
