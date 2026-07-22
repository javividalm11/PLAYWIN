/**
 * Track record de pronósticos:
 *  - recordPrediction(): guarda/actualiza el pick PRE-PARTIDO de cada partido
 *    (se congela al kickoff — es lo que hace honesto el historial).
 *  - settlePending(): al terminar los partidos marca won/lost/void comparando
 *    el pick estructurado contra el marcador final.
 *  - getTrackRecord(): datos agregados para la página /resultados.
 */
import "server-only";
import { getAdminSupabase } from "@/lib/supabase/server";
import { getMatchDetail, type MatchDetail } from "@/lib/data/espn";
import type { Prediction, PickCode } from "@/lib/types";

export type PredictionRow = {
  id: number;
  match_id: string;
  match_label: string;
  league: string | null;
  kickoff: string;
  market: string;
  selection: string;
  pick_code: PickCode;
  probability: number;
  confidence: string;
  outcome: "pending" | "won" | "lost" | "void";
  final_score: string | null;
};

let missingTableWarned = false;

function warnMissingTable(msg: string) {
  if (!missingTableWarned && msg.includes("predictions")) {
    console.warn("[predictions] Falta la tabla: ejecuta supabase/migrations/002-pronosticos.sql");
    missingTableWarned = true;
  }
}

/** Guarda el pick pre-partido (upsert por match_id). No bloquea al llamador. */
export async function recordPrediction(
  detail: MatchDetail,
  prediction: Prediction,
): Promise<void> {
  const db = getAdminSupabase();
  const { match } = detail;
  if (
    !db ||
    match.status !== "scheduled" ||
    !prediction.pick.code ||
    new Date(match.kickoff).getTime() <= Date.now()
  ) {
    return;
  }

  const { error } = await db.from("predictions").upsert(
    {
      match_id: match.id,
      match_label: `${match.home.name} vs ${match.away.name}`,
      league: match.league,
      kickoff: match.kickoff,
      market: prediction.pick.market,
      selection: prediction.pick.selection,
      pick_code: prediction.pick.code,
      probability: prediction.pick.probability,
      confidence: prediction.pick.confidence,
      probs: prediction.probs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  );
  if (error) warnMissingTable(error.message);
}

/** Evalúa un pick contra el marcador final. */
export function evaluatePick(
  code: PickCode,
  home: number,
  away: number,
): "won" | "lost" | "void" {
  const total = home + away;
  switch (code.type) {
    case "1x2": {
      const winner = home > away ? "home" : away > home ? "away" : "draw";
      return winner === code.side ? "won" : "lost";
    }
    case "dc":
      if (code.side === "1x") return home >= away ? "won" : "lost";
      return away >= home ? "won" : "lost";
    case "ou":
      if (total === code.line) return "void"; // línea entera exacta → push
      if (code.side === "over") return total > code.line ? "won" : "lost";
      return total < code.line ? "won" : "lost";
    case "btts": {
      const both = home > 0 && away > 0;
      return (code.side === "yes") === both ? "won" : "lost";
    }
    case "teamgoal": {
      const scored = code.side === "home" ? home > 0 : away > 0;
      return scored ? "won" : "lost";
    }
    case "combo": {
      const legs = code.legs.map((l) => evaluatePick(l, home, away));
      if (legs.includes("lost")) return "lost";
      if (legs.includes("void")) return "void";
      return "won";
    }
  }
}

let lastSettleRun = 0;

/** Liquida pendientes cuyos partidos ya deberían haber terminado.
 *  Con throttle para no repetir trabajo en cada carga de página.
 *  limit=10 por defecto: cada partido cuesta un fetch y Cloudflare Workers
 *  permite ~50 subrequests por petición. */
export async function settlePending(limit = 10): Promise<void> {
  const db = getAdminSupabase();
  if (!db) return;
  if (Date.now() - lastSettleRun < 5 * 60_000) return;
  lastSettleRun = Date.now();

  const cutoff = new Date(Date.now() - 105 * 60_000).toISOString(); // kickoff + ~105min
  const { data: pending, error } = await db
    .from("predictions")
    .select("id, match_id, pick_code")
    .eq("outcome", "pending")
    .lt("kickoff", cutoff)
    .limit(limit);
  if (error) {
    warnMissingTable(error.message);
    return;
  }

  for (const row of pending ?? []) {
    const detail = await getMatchDetail(row.match_id);
    if (!detail) continue;
    const { match } = detail;

    let outcome: "won" | "lost" | "void" | null = null;
    if (match.status === "postponed") outcome = "void";
    else if (match.status === "finished" && match.score) {
      outcome = evaluatePick(row.pick_code as PickCode, match.score.home, match.score.away);
    }
    if (!outcome) continue; // sigue en juego o sin datos: reintentará luego

    await db
      .from("predictions")
      .update({
        outcome,
        final_score: match.score ? `${match.score.home}-${match.score.away}` : null,
        settled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }
}

export type TrackRecord = {
  rows: PredictionRow[];
  stats: {
    total: number;
    won: number;
    lost: number;
    voided: number;
    pending: number;
    hitRate: number | null; // % sobre liquidados (won+lost)
    streak: { type: "won" | "lost"; count: number } | null;
    today: { won: number; lost: number; pending: number };
    /** Tier "Pick Seguro" (probabilidad ≥85): acierto sobre liquidados */
    safe: { won: number; lost: number; hitRate: number | null };
  };
  byDay: Array<{ day: string; label: string; won: number; lost: number }>;
};

export async function getTrackRecord(): Promise<TrackRecord | null> {
  const db = getAdminSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from("predictions")
    .select(
      "id, match_id, match_label, league, kickoff, market, selection, pick_code, probability, confidence, outcome, final_score",
    )
    .order("kickoff", { ascending: false })
    .limit(300);
  if (error) {
    warnMissingTable(error.message);
    return null;
  }

  const rows = (data ?? []) as PredictionRow[];
  const won = rows.filter((r) => r.outcome === "won").length;
  const lost = rows.filter((r) => r.outcome === "lost").length;
  const voided = rows.filter((r) => r.outcome === "void").length;
  const pending = rows.filter((r) => r.outcome === "pending").length;
  const settled = won + lost;

  // Racha: liquidados en orden cronológico inverso
  const settledRows = rows.filter((r) => r.outcome === "won" || r.outcome === "lost");
  let streak: TrackRecord["stats"]["streak"] = null;
  if (settledRows.length) {
    const first = settledRows[0].outcome as "won" | "lost";
    let count = 0;
    for (const r of settledRows) {
      if (r.outcome === first) count++;
      else break;
    }
    streak = { type: first, count };
  }

  const safeRows = rows.filter((r) => r.probability >= 85);
  const safeWon = safeRows.filter((r) => r.outcome === "won").length;
  const safeLost = safeRows.filter((r) => r.outcome === "lost").length;

  const todayKey = new Date().toLocaleDateString("en-CA");
  const isToday = (r: PredictionRow) =>
    new Date(r.kickoff).toLocaleDateString("en-CA") === todayKey;
  const today = {
    won: rows.filter((r) => isToday(r) && r.outcome === "won").length,
    lost: rows.filter((r) => isToday(r) && r.outcome === "lost").length,
    pending: rows.filter((r) => isToday(r) && r.outcome === "pending").length,
  };

  // Últimos 14 días (solo liquidados)
  const byDayMap = new Map<string, { won: number; lost: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    byDayMap.set(d.toLocaleDateString("en-CA"), { won: 0, lost: 0 });
  }
  for (const r of settledRows) {
    const key = new Date(r.kickoff).toLocaleDateString("en-CA");
    const bucket = byDayMap.get(key);
    if (bucket) bucket[r.outcome as "won" | "lost"]++;
  }
  const byDay = [...byDayMap.entries()].map(([day, v]) => ({
    day,
    label: new Intl.DateTimeFormat("es", { day: "2-digit" }).format(new Date(day + "T12:00:00")),
    ...v,
  }));

  return {
    rows,
    stats: {
      total: rows.length,
      won,
      lost,
      voided,
      pending,
      hitRate: settled > 0 ? Math.round((won / settled) * 100) : null,
      streak,
      today,
      safe: {
        won: safeWon,
        lost: safeLost,
        hitRate:
          safeWon + safeLost > 0 ? Math.round((safeWon / (safeWon + safeLost)) * 100) : null,
      },
    },
    byDay,
  };
}
