/**
 * Motor de predicción PLAYWIN.
 *
 * Pipeline:
 *  1. λ (goles esperados) de cada equipo a partir de su forma reciente
 *     (ataque propio + defensa rival) con ventaja de localía.
 *  2. Ajuste por clima (lluvia/viento fuerte → menos goles).
 *  3. Matriz Poisson → probabilidades 1X2, over/under, BTTS.
 *  4. Mezcla con probabilidades implícitas del mercado (cuando hay cuotas):
 *     el mercado es sabio, el modelo aporta el ángulo estadístico.
 *  5. En vivo: se congelan los goles ya anotados, se proyectan los minutos
 *     restantes con λ escalado por dominio real (tiros a puerta).
 *  6. Selección de pick (1X2 / doble oportunidad / over-under / BTTS)
 *     con nivel de confianza y factores explicables.
 */
import type { MatchDetail, FormGame } from "@/lib/data/espn";
import type { MatchWeather } from "@/lib/data/weather";
import type {
  Prediction,
  PredictionFactor,
  Confidence,
  PickCode,
  SimplePickCode,
} from "@/lib/types";
import {
  scoreMatrix,
  outcomes,
  overProb,
  bttsProb,
  comboProb,
  americanToProb,
  devig,
  type Outcomes,
} from "./poisson";
import { buildSummary } from "./explain";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function avg(nums: number[], fallback: number): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : fallback;
}

function formPoints(form: FormGame[]): number {
  return form.reduce((s, g) => s + (g.result === "W" ? 3 : g.result === "D" ? 1 : 0), 0);
}

/** Convierte probabilidades [0..1] a enteros % que suman 100 (mayor residuo). */
function toPercentages(o: Outcomes): { home: number; draw: number; away: number } {
  const raw = [o.home * 100, o.draw * 100, o.away * 100];
  const floors = raw.map(Math.floor);
  let rest = 100 - floors.reduce((s, n) => s + n, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (rest <= 0) break;
    floors[i] += 1;
    rest -= 1;
  }
  return { home: floors[0], draw: floors[1], away: floors[2] };
}

export function buildPrediction(detail: MatchDetail, weather: MatchWeather | null): Prediction {
  const { match, formHome, formAway, odds, liveStats, h2h } = detail;
  const factors: PredictionFactor[] = [];
  const isLive = match.status === "live" || match.status === "halftime";

  /* ── 1. λ desde la forma ── */
  const atkH = avg(formHome.map((g) => g.goalsFor), 1.35);
  const defH = avg(formHome.map((g) => g.goalsAgainst), 1.25);
  const atkA = avg(formAway.map((g) => g.goalsFor), 1.25);
  const defA = avg(formAway.map((g) => g.goalsAgainst), 1.35);

  let lambdaH = clamp(((atkH + defA) / 2) * 1.12, 0.25, 4.2); // ventaja local
  let lambdaA = clamp(((atkA + defH) / 2) * 0.92, 0.2, 4.0);

  const ptsH = formPoints(formHome);
  const ptsA = formPoints(formAway);
  if (formHome.length >= 3 && formAway.length >= 3) {
    const diff = (ptsH - ptsA) / (formHome.length * 3);
    factors.push({
      key: "form",
      label: "Forma reciente",
      impact: clamp(diff * 4, -3, 3),
      detail: `${match.home.shortName ?? "Local"} suma ${ptsH} pts de ${formHome.length * 3} posibles (${formHome.map((g) => g.result).join("-")}); ${match.away.shortName ?? "Visita"} lleva ${ptsA} de ${formAway.length * 3} (${formAway.map((g) => g.result).join("-")}).`,
    });
  }

  factors.push({
    key: "home",
    label: "Localía",
    impact: 0.7,
    detail: `Jugar en ${match.venue ?? "casa"} eleva el gol esperado del local ~12% según el histórico de la liga.`,
  });

  /* ── 2. Clima ── */
  if (weather && (weather.precipProbPct >= 60 || weather.windKmh >= 35)) {
    lambdaH *= 0.92;
    lambdaA *= 0.92;
    factors.push({
      key: "weather",
      label: "Clima",
      impact: -0.3,
      detail: `Pronóstico: ${weather.precipProbPct}% de lluvia, viento ${weather.windKmh} km/h, ${weather.tempC}°C. Condiciones que históricamente reducen los goles.`,
    });
  } else if (weather) {
    factors.push({
      key: "weather",
      label: "Clima",
      impact: 0,
      detail: `Condiciones normales: ${weather.tempC}°C, ${weather.precipProbPct}% de lluvia, viento ${weather.windKmh} km/h.`,
    });
  }

  /* ── 3. H2H ── */
  if (h2h.length >= 3) {
    let hWins = 0,
      aWins = 0;
    for (const g of h2h) {
      if (!g.score) continue;
      const [hs, as] = g.score.split("-").map((n) => parseInt(n, 10));
      if (Number.isNaN(hs) || Number.isNaN(as)) continue;
      const homeTeamWon = hs > as;
      const awayTeamWon = as > hs;
      // score está en perspectiva home/away de cada partido histórico
      if (g.homeTeam === match.home.name ? homeTeamWon : awayTeamWon) hWins++;
      else if (g.homeTeam === match.home.name ? awayTeamWon : homeTeamWon) aWins++;
    }
    if (hWins + aWins > 0) {
      factors.push({
        key: "h2h",
        label: "Historial directo",
        impact: clamp(((hWins - aWins) / h2h.length) * 2.5, -2.5, 2.5),
        detail: `En los últimos ${h2h.length} cruces: ${hWins} triunfos de ${match.home.shortName ?? "local"}, ${aWins} de ${match.away.shortName ?? "visita"} y ${h2h.length - hWins - aWins} empates.`,
      });
    }
  }

  /* ── Poisson base ── */
  const matrix = scoreMatrix(lambdaH, lambdaA);
  let probs = outcomes(matrix);

  /* ── 4. Mezcla con mercado ── */
  if (!isLive && odds?.homeML != null && odds?.awayML != null && odds?.drawML != null) {
    const [mh, md, ma] = devig([
      americanToProb(odds.homeML),
      americanToProb(odds.drawML),
      americanToProb(odds.awayML),
    ]);
    probs = {
      home: 0.58 * mh + 0.42 * probs.home,
      draw: 0.58 * md + 0.42 * probs.draw,
      away: 0.58 * ma + 0.42 * probs.away,
    };
    const fav = mh > ma ? match.home : match.away;
    factors.push({
      key: "market",
      label: "Mercado de apuestas",
      impact: clamp((mh - ma) * 3, -2.5, 2.5),
      detail: `${odds.provider ?? "Las casas"} ven favorito a ${fav.name} (${odds.details ?? "línea cerrada"}). El modelo pondera esta señal.`,
    });
  }

  /* ── 5. En vivo ── */
  let overP: number;
  let bttsP: number;
  const goalsNow = (match.score?.home ?? 0) + (match.score?.away ?? 0);
  const ouLine = odds?.overUnderLine ?? 2.5;

  if (isLive && match.score) {
    const minute = match.minute ?? 45;
    const remaining = clamp((94 - minute) / 94, 0.02, 1);
    let mH = 1,
      mA = 1;
    if (liveStats) {
      const powerH = liveStats.shotsOnTarget.home + 0.3 * liveStats.shots.home + 1;
      const powerA = liveStats.shotsOnTarget.away + 0.3 * liveStats.shots.away + 1;
      const tilt = clamp(powerH / (powerH + powerA), 0.25, 0.75);
      mH = 0.6 + 0.8 * tilt;
      mA = 0.6 + 0.8 * (1 - tilt);
      factors.push({
        key: "live-dominance",
        label: "Dominio en vivo",
        impact: clamp((tilt - 0.5) * 6, -3, 3),
        detail: `Tiros a puerta ${liveStats.shotsOnTarget.home}-${liveStats.shotsOnTarget.away}, posesión ${liveStats.possession.home}%-${liveStats.possession.away}%.`,
      });
    }
    const liveMatrix = scoreMatrix(lambdaH * remaining * mH, lambdaA * remaining * mA);
    probs = outcomes(liveMatrix, match.score.home, match.score.away);
    overP = overProb(liveMatrix, ouLine, goalsNow);
    bttsP = bttsProb(liveMatrix, match.score.home > 0, match.score.away > 0);

    const diff = match.score.home - match.score.away;
    factors.push({
      key: "score",
      label: "Marcador actual",
      impact: clamp(diff * 1.6, -3, 3),
      detail: `${match.score.home}-${match.score.away} al minuto ${minute}. Quedan ~${Math.max(0, 94 - minute)} minutos por proyectar.`,
    });
  } else {
    overP = overProb(matrix, ouLine);
    bttsP = bttsProb(matrix);
    factors.push({
      key: "xgoals",
      label: "Goles esperados del modelo",
      impact: clamp((lambdaH - lambdaA) * 1.3, -3, 3),
      detail: `El modelo proyecta ${lambdaH.toFixed(2)} goles esperados para ${match.home.shortName ?? "el local"} y ${lambdaA.toFixed(2)} para ${match.away.shortName ?? "la visita"}.`,
    });
  }

  const pct = toPercentages(probs);

  /* ── 6. Selección del pick ── */
  type Candidate = { market: string; selection: string; p: number; code: PickCode };
  const candidates: Candidate[] = [];
  let valuePick: Prediction["valuePick"];
  const best1x2 = Math.max(probs.home, probs.draw, probs.away);

  if (probs.home === best1x2)
    candidates.push({
      market: "1X2",
      selection: `${match.home.name} gana`,
      p: probs.home,
      code: { type: "1x2", side: "home" },
    });
  else if (probs.away === best1x2)
    candidates.push({
      market: "1X2",
      selection: `${match.away.name} gana`,
      p: probs.away,
      code: { type: "1x2", side: "away" },
    });
  else
    candidates.push({
      market: "1X2",
      selection: "Empate",
      p: probs.draw,
      code: { type: "1x2", side: "draw" },
    });

  // Doble oportunidad — SIEMPRE candidata (backtest 7d: 73.3% de acierto,
  // el mejor mercado). En superfavoritos produce picks de 85-95%: el tier "seguro".
  {
    const dcHome = probs.home + probs.draw;
    const dcAway = probs.away + probs.draw;
    const dc =
      dcHome >= dcAway
        ? { sel: `${match.home.name} o empate (1X)`, p: dcHome, code: { type: "dc", side: "1x" } as PickCode }
        : { sel: `${match.away.name} o empate (X2)`, p: dcAway, code: { type: "dc", side: "x2" } as PickCode };
    candidates.push({ market: "Doble oportunidad", selection: dc.sel, p: dc.p, code: dc.code });
  }

  // En vivo, los mercados ya liquidados no son picks útiles:
  //  - Over ya superado / Under imposible → fuera.
  //  - BTTS con ambos equipos ya anotando → fuera.
  // Over/Under: el backtest lo muestra débil (56.8%) → solo candidato con
  // probabilidad alta (≥62%). "Ambos anotan" queda EXCLUIDO de los picks
  // (backtest: 47.1%, peor que el azar) — bttsP se conserva para uso futuro.
  void bttsP;
  const remainingLine = isLive ? `${ouLine} goles (total del partido)` : `${ouLine} goles`;
  if (!isLive || goalsNow <= ouLine) {
    const ou =
      overP >= 0.5
        ? {
            market: "Over/Under",
            selection: `Más de ${remainingLine}`,
            p: overP,
            code: { type: "ou", side: "over", line: ouLine } as PickCode,
          }
        : {
            market: "Over/Under",
            selection: `Menos de ${remainingLine}`,
            p: 1 - overP,
            code: { type: "ou", side: "under", line: ouLine } as PickCode,
          };
    if (ou.p >= 0.62) candidates.push(ou);
  }

  // ── Mercados de certeza natural alta (solo pre-partido) ──
  // Derivados de la misma matriz Poisson. Solo entran como candidatos si
  // superan el umbral del tier seguro; el backtest decide si sobreviven.
  if (!isLive) {
    const over05 = overProb(matrix, 0.5);
    const under45 = 1 - overProb(matrix, 4.5);
    const under55 = 1 - overProb(matrix, 5.5);

    const extras: Candidate[] = [
      {
        market: "Menos de 4.5 goles",
        selection: "Menos de 4.5 goles en el partido",
        p: under45,
        code: { type: "ou", side: "under", line: 4.5 },
      },
      {
        market: "Menos de 5.5 goles",
        selection: "Menos de 5.5 goles en el partido",
        p: under55,
        code: { type: "ou", side: "under", line: 5.5 },
      },
      // "Equipo anota" EXCLUIDO: backtest 81.5% (n=27), no supera la vara del 85%.
      // El modelo sobreestima ~5pts este mercado; revisar tras integrar xG.
      {
        market: "Goles en el partido",
        selection: "Al menos 1 gol en el partido (más de 0.5)",
        p: over05,
        code: { type: "ou", side: "over", line: 0.5 },
      },
    ];

    // ── Combinadas del mismo partido (probabilidad EXACTA por matriz) ──
    // Mejoran el momio del tier seguro: DC favorito + O1.5 paga ~1.15-1.25
    // frente al ~1.05 de un under 5.5, con probabilidad similar.
    const dcHomeP = probs.home + probs.draw;
    const dcAwayP = probs.away + probs.draw;
    const dcSide: "1x" | "x2" = dcHomeP >= dcAwayP ? "1x" : "x2";
    const dcTeam = dcSide === "1x" ? match.home.name : match.away.name;
    const dcLeg = { type: "dc", side: dcSide } as SimplePickCode;

    extras.push(
      {
        market: "Combinada",
        selection: `${dcTeam} o empate + Más de 1.5 goles`,
        p: comboProb(matrix, dcSide, 2, null),
        code: { type: "combo", legs: [dcLeg, { type: "ou", side: "over", line: 1.5 }] },
      },
      {
        market: "Combinada",
        selection: `${dcTeam} o empate + Menos de 4.5 goles`,
        p: comboProb(matrix, dcSide, null, 4),
        code: { type: "combo", legs: [dcLeg, { type: "ou", side: "under", line: 4.5 }] },
      },
      {
        market: "Combinada",
        selection: `${probs.home >= probs.away ? match.home.name : match.away.name} gana + Más de 1.5 goles`,
        p: comboProb(matrix, probs.home >= probs.away ? "home" : "away", 2, null),
        code: {
          type: "combo",
          legs: [
            { type: "1x2", side: probs.home >= probs.away ? "home" : "away" },
            { type: "ou", side: "over", line: 1.5 },
          ],
        },
      },
    );

    // ⚠️ Combinadas EXCLUIDAS del tier seguro: backtest 25% real (n=4) vs 85%+
    // reclamado. Poisson independiente subestima los marcadores bajos del
    // favorito (1-0, 0-0) → "DC + Over 1.5" se infla. Volverán al tier cuando
    // el modelo tenga corrección Dixon-Coles y re-aprueben el backtest.
    for (const c of extras) {
      if (c.p >= 0.85 && c.market !== "Combinada") candidates.push(c);
    }

    // ── Pick de Valor (para buscadores de momio; NO entra al tier seguro) ──
    // Solo mercados calibrados (el bucket 60-75% del backtest rinde ~68-74%).
    const valuePool = [...candidates, ...extras].filter(
      (c) => c.p >= 0.58 && c.p <= 0.74 && c.market !== "Combinada",
    );
    if (valuePool.length > 0) {
      const vp = valuePool.sort((a, b) => b.p - a.p)[0];
      valuePick = {
        market: vp.market,
        selection: vp.selection,
        probability: Math.round(vp.p * 100),
        fairOdds: Math.round((1 / vp.p) * 100) / 100,
      };
    }
  }

  // Selección del pick (calibrada con backtest de 241 partidos):
  //  1. Certeza extrema (≥85%) → tier "seguro". Entre varios seguros se
  //     prefiere el mercado con MEJOR MOMIO a igual seguridad: combinadas
  //     primero (pagan 1.15-1.30), luego DC, y los unders triviales al final
  //     (pagan ~1.05 y el apostador no los toma).
  //  2. Si el 1X2 es contundente (≥55%) → 1X2 (mejor valor).
  //  3. Si no → la alternativa más probable.
  const SAFE_PRIORITY: Record<string, number> = {
    Combinada: 0,
    "Doble oportunidad": 1,
    "Menos de 4.5 goles": 2,
    "Menos de 5.5 goles": 3,
    "Goles en el partido": 4,
    "Over/Under": 2,
    "1X2": 1,
  };
  let pick: Candidate;
  const safeCands = candidates
    .filter((c) => c.p >= 0.85)
    .sort(
      (a, b) =>
        (SAFE_PRIORITY[a.market] ?? 9) - (SAFE_PRIORITY[b.market] ?? 9) || b.p - a.p,
    );
  if (safeCands.length > 0) {
    pick = safeCands[0];
  } else if (best1x2 >= 0.55) {
    pick = candidates[0];
  } else {
    pick = [...candidates].sort((a, b) => b.p - a.p)[0];
  }

  const confidence: Confidence = pick.p >= 0.65 ? "alta" : pick.p >= 0.55 ? "media" : "baja";

  const prediction: Prediction = {
    matchId: match.id,
    probs: pct,
    pick: {
      market: pick.market,
      selection: pick.selection,
      confidence,
      // Techo del 96%: en fútbol nada es 100%, y mostrarlo destruye credibilidad
      probability: Math.round(Math.min(pick.p, 0.96) * 100),
      code: pick.code,
      fairOdds: Math.round((1 / Math.min(pick.p, 0.96)) * 100) / 100,
    },
    valuePick,
    factors: factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    summary: "",
    generatedAt: new Date().toISOString(),
  };
  prediction.summary = buildSummary(prediction, detail);
  return prediction;
}
