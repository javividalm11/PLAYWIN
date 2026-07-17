/**
 * POST /api/predict — Genera el pronóstico de un partido.
 *
 * ⭐ Esta es LA acción de servicio monetizable:
 *  - Pasa por el trial gating (IP + fingerprint + sesión).
 *  - Cada solicitud queda registrada en service_events (dashboard admin).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getMatchAnalysis } from "@/lib/data";
import { gateServiceAction, logServiceEvent } from "@/lib/access/gate";

export async function POST(request: NextRequest) {
  let matchId: string | undefined;
  try {
    const body = (await request.json()) as { matchId?: string };
    matchId = body.matchId;
  } catch {
    /* body inválido */
  }
  if (!matchId || !/^\d+$/.test(matchId)) {
    return NextResponse.json({ error: "matchId inválido" }, { status: 400 });
  }

  const { identity, result } = await gateServiceAction("predict", matchId);
  if (!result.allowed) {
    await logServiceEvent(identity, "predict", matchId, result);
    return NextResponse.json(
      {
        error: "trial_expired",
        nextStep: result.nextStep, // "register" | "subscribe"
      },
      { status: 402 },
    );
  }

  const analysis = await getMatchAnalysis(matchId);
  if (!analysis) {
    await logServiceEvent(identity, "predict", matchId, result);
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const { match } = analysis.detail;
  await logServiceEvent(
    identity,
    "predict",
    matchId,
    result,
    `${match.home.name} vs ${match.away.name}`,
  );

  return NextResponse.json({
    match: analysis.detail.match,
    prediction: analysis.prediction,
    weather: analysis.weather,
    liveStats: analysis.detail.liveStats ?? null,
    access: { tier: result.tier, daysLeft: result.daysLeft },
  });
}
