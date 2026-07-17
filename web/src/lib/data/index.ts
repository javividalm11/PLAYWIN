/**
 * Fachada de la capa de datos: lo que las páginas y API routes consumen.
 * Detrás: ESPN (partidos/stats/cuotas) + Open-Meteo (clima) + motor Poisson.
 */
import { getScoreboard, getMatchDetail, searchTeams, getTeamSchedule, type MatchDetail } from "./espn";
import { getMatchWeather, type MatchWeather } from "./weather";
import { buildPrediction } from "@/lib/prediction/engine";
import { recordPrediction } from "@/lib/predictions/store";
import type { Match, Prediction } from "@/lib/types";

export { getScoreboard, searchTeams, getTeamSchedule };
export type { MatchDetail, MatchWeather };

/** Fecha local del servidor en formato ESPN (YYYYMMDD). */
export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA").replace(/-/g, "");
}

export type Board = {
  live: Match[];
  upcoming: Match[];
  finished: Match[];
};

export async function getTodayBoard(): Promise<Board> {
  const all = await getScoreboard(todayKey());
  const byKickoff = (a: Match, b: Match) => a.kickoff.localeCompare(b.kickoff);
  return {
    live: all
      .filter((m) => m.status === "live" || m.status === "halftime")
      .sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0)),
    upcoming: all.filter((m) => m.status === "scheduled").sort(byKickoff),
    finished: all.filter((m) => m.status === "finished").sort(byKickoff),
  };
}

export type MatchAnalysis = {
  detail: MatchDetail;
  prediction: Prediction;
  weather: MatchWeather | null;
};

/** Análisis completo de un partido: datos + clima + predicción. */
export async function getMatchAnalysis(eventId: string): Promise<MatchAnalysis | null> {
  const detail = await getMatchDetail(eventId);
  if (!detail) return null;
  const weather = await getMatchWeather(
    detail.venueCity,
    detail.venueCountry,
    detail.match.kickoff,
  );
  const prediction = buildPrediction(detail, weather);
  // Track record: se guarda el pick pre-partido (fire-and-forget)
  void recordPrediction(detail, prediction).catch(() => {});
  return { detail, prediction, weather };
}

/** Picks del día: analiza los próximos partidos y devuelve los de mayor
 *  probabilidad. poolSize limita las llamadas al origen. */
export async function getDailyPicks(
  limit: number,
  poolSize = 10,
): Promise<Array<{ match: Match; prediction: Prediction }>> {
  const { upcoming, live } = await getTodayBoard();
  const pool = [...live.slice(0, 2), ...upcoming.slice(0, poolSize)];

  const analyses = await Promise.allSettled(pool.map((m) => getMatchAnalysis(m.id)));
  const picks: Array<{ match: Match; prediction: Prediction }> = [];
  for (const r of analyses) {
    if (r.status === "fulfilled" && r.value) {
      picks.push({ match: r.value.detail.match, prediction: r.value.prediction });
    }
  }
  return picks
    .sort((a, b) => b.prediction.pick.probability - a.prediction.pick.probability)
    .slice(0, limit);
}
