/** Tipos de dominio de PLAYWIN */

export type Team = {
  id: string;
  name: string;
  shortName?: string;
  crest?: string; // URL escudo
  country?: string;
};

export type MatchStatus = "scheduled" | "live" | "halftime" | "finished" | "postponed";

export type Match = {
  id: string;
  league: string;
  leagueId?: string;
  kickoff: string; // ISO 8601
  status: MatchStatus;
  minute?: number; // solo en vivo
  home: Team;
  away: Team;
  score?: { home: number; away: number };
  venue?: string;
};

/** Probabilidades 1X2 en porcentaje (suman ~100) */
export type Probabilities = {
  home: number;
  draw: number;
  away: number;
};

/** Un factor que el modelo consideró. impact: -3 (favorece visita) … +3 (favorece local) */
export type PredictionFactor = {
  key: string;
  label: string;
  impact: number;
  detail: string;
};

export type Confidence = "alta" | "media" | "baja";

/** Pick estructurado (para liquidar automáticamente contra el marcador final) */
export type PickCode =
  | { type: "1x2"; side: "home" | "draw" | "away" }
  | { type: "dc"; side: "1x" | "x2" }
  | { type: "ou"; side: "over" | "under"; line: number }
  | { type: "btts"; side: "yes" | "no" }
  | { type: "teamgoal"; side: "home" | "away" }; // "el equipo X anota"

export type Prediction = {
  matchId: string;
  probs: Probabilities;
  pick: {
    market: string; // ej. "1X2", "Ambos anotan", "Más de 2.5"
    selection: string; // ej. "Real Madrid gana"
    confidence: Confidence;
    probability: number; // % del pick
    code?: PickCode;
  };
  factors: PredictionFactor[];
  summary: string; // explicación en lenguaje natural
  generatedAt: string;
};

/** Estadísticas en vivo de un partido */
export type LiveStats = {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  cards: { home: number; away: number };
  xg?: { home: number; away: number };
};
