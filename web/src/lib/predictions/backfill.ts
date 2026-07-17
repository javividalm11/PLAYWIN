/**
 * Backfill del día: para cada partido de la fecha genera el pick que el
 * modelo daría PRE-PARTIDO (se le ocultan marcador/estado en vivo para no
 * contaminar la predicción) y, si el partido ya terminó, lo liquida.
 *
 * No sobreescribe pronósticos ya registrados (ignoreDuplicates).
 * Uso: cold-start del track record y respaldo diario vía cron.
 */
import "server-only";
import { getAdminSupabase } from "@/lib/supabase/server";
import { getScoreboard, getMatchDetail } from "@/lib/data/espn";
import { getMatchWeather } from "@/lib/data/weather";
import { buildPrediction } from "@/lib/prediction/engine";
import { evaluatePick } from "./store";
import type { MatchDetail } from "@/lib/data/espn";

/** Versión pre-partido del detalle: sin marcador, minuto ni stats en vivo. */
export function asPrematch(detail: MatchDetail): MatchDetail {
  return {
    ...detail,
    liveStats: undefined,
    match: {
      ...detail.match,
      status: "scheduled",
      score: undefined,
      minute: undefined,
    },
  };
}

export type BackfillResult = {
  created: number;
  settledNow: number;
  skippedExisting: number;
  failed: number;
};

export async function backfillDay(dateYYYYMMDD?: string): Promise<BackfillResult | null> {
  const db = getAdminSupabase();
  if (!db) return null;

  const matches = await getScoreboard(dateYYYYMMDD);
  const res: BackfillResult = { created: 0, settledNow: 0, skippedExisting: 0, failed: 0 };
  if (matches.length === 0) return res;

  // Filas ya existentes (pre-registradas honestamente): no se tocan
  const { data: existing } = await db
    .from("predictions")
    .select("match_id")
    .in("match_id", matches.map((m) => m.id));
  const have = new Set((existing ?? []).map((r) => r.match_id));

  for (const m of matches) {
    if (have.has(m.id)) {
      res.skippedExisting++;
      continue;
    }
    if (m.status === "postponed") continue;

    try {
      const detail = await getMatchDetail(m.id);
      if (!detail) {
        res.failed++;
        continue;
      }
      const prematch = asPrematch(detail);
      const weather = await getMatchWeather(
        detail.venueCity,
        detail.venueCountry,
        detail.match.kickoff,
      );
      const prediction = buildPrediction(prematch, weather);
      if (!prediction.pick.code) {
        res.failed++;
        continue;
      }

      const finished = detail.match.status === "finished" && detail.match.score;
      const outcome = finished
        ? evaluatePick(
            prediction.pick.code,
            detail.match.score!.home,
            detail.match.score!.away,
          )
        : "pending";

      const { error } = await db.from("predictions").upsert(
        {
          match_id: m.id,
          match_label: `${m.home.name} vs ${m.away.name}`,
          league: m.league,
          kickoff: m.kickoff,
          market: prediction.pick.market,
          selection: prediction.pick.selection,
          pick_code: prediction.pick.code,
          probability: prediction.pick.probability,
          confidence: prediction.pick.confidence,
          probs: prediction.probs,
          outcome,
          final_score: finished
            ? `${detail.match.score!.home}-${detail.match.score!.away}`
            : null,
          settled_at: finished ? new Date().toISOString() : null,
        },
        { onConflict: "match_id", ignoreDuplicates: true },
      );
      if (error) {
        res.failed++;
        continue;
      }
      res.created++;
      if (finished) res.settledNow++;
    } catch {
      res.failed++;
    }
  }
  return res;
}
