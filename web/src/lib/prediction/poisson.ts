/**
 * Modelo Poisson de goles: dado el ritmo goleador esperado (λ) de cada equipo,
 * genera la matriz de probabilidades de todos los marcadores y de ahí
 * las probabilidades 1X2, over/under y ambos-anotan.
 */

const MAX_GOALS = 9;

function poissonPmf(k: number, lambda: number): number {
  // e^-λ · λ^k / k!
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / fact;
}

export type ScoreMatrix = number[][]; // [golesLocal][golesVisita] → prob

export function scoreMatrix(lambdaHome: number, lambdaAway: number): ScoreMatrix {
  const m: ScoreMatrix = [];
  for (let h = 0; h <= MAX_GOALS; h++) {
    m[h] = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      m[h][a] = poissonPmf(h, lambdaHome) * poissonPmf(a, lambdaAway);
    }
  }
  return m;
}

export type Outcomes = { home: number; draw: number; away: number };

/** Probabilidades 1X2. offsetHome/offsetAway: goles ya anotados (para live). */
export function outcomes(m: ScoreMatrix, offsetHome = 0, offsetAway = 0): Outcomes {
  let home = 0,
    draw = 0,
    away = 0;
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const th = h + offsetHome;
      const ta = a + offsetAway;
      if (th > ta) home += m[h][a];
      else if (th === ta) draw += m[h][a];
      else away += m[h][a];
    }
  }
  const total = home + draw + away || 1;
  return { home: home / total, draw: draw / total, away: away / total };
}

export function overProb(m: ScoreMatrix, line: number, offsetGoals = 0): number {
  let over = 0,
    total = 0;
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      total += m[h][a];
      if (h + a + offsetGoals > line) over += m[h][a];
    }
  }
  return over / (total || 1);
}

export function bttsProb(m: ScoreMatrix, homeScored = false, awayScored = false): number {
  if (homeScored && awayScored) return 1;
  let p = 0,
    total = 0;
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      total += m[h][a];
      if ((homeScored || h > 0) && (awayScored || a > 0)) p += m[h][a];
    }
  }
  return p / (total || 1);
}

/** Cuota americana → probabilidad implícita (sin quitar el vig). */
export function americanToProb(ml: number): number {
  return ml < 0 ? -ml / (-ml + 100) : 100 / (ml + 100);
}

/** Normaliza probabilidades implícitas quitando el margen de la casa. */
export function devig(probs: number[]): number[] {
  const sum = probs.reduce((s, p) => s + p, 0) || 1;
  return probs.map((p) => p / sum);
}
