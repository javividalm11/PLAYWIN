/**
 * Cliente de la API pública (no documentada) de ESPN Soccer.
 * Toda petición pasa por espnFetch() con caché de Next (revalidate) para
 * minimizar tráfico y sobrevivir a caídas de la fuente.
 *
 * Endpoints validados el 2026-07-16 con scripts/probe-espn*.mjs
 */
import type { Match, MatchStatus, Team, LiveStats } from "@/lib/types";
import { leagueName } from "./league-names";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const SEARCH = "https://site.web.api.espn.com/apis/search/v2";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PLAYWIN/1.0",
  Accept: "application/json",
};

async function espnFetch<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ────────────────────────── Mapeo de estado ────────────────────────── */

function mapStatus(state?: string, description?: string): MatchStatus {
  if (state === "in") {
    const d = description?.toLowerCase() ?? "";
    // "Halftime"/"HT" = descanso; ojo: "First/Second Half" también contiene "half"
    return d === "halftime" || d === "ht" || d.includes("half-time") ? "halftime" : "live";
  }
  if (state === "post") {
    return description?.toLowerCase().includes("postponed") ? "postponed" : "finished";
  }
  return "scheduled";
}

function parseMinute(displayClock?: string, clockSeconds?: number): number | undefined {
  if (displayClock) {
    const m = parseInt(displayClock, 10);
    if (!Number.isNaN(m)) return m;
  }
  if (typeof clockSeconds === "number" && clockSeconds > 0) {
    return Math.floor(clockSeconds / 60);
  }
  return undefined;
}

export function crestUrl(teamId: string): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png`;
}

/* ────────────────────────── Scoreboard ────────────────────────── */

type EspnCompetitor = {
  homeAway: "home" | "away";
  winner?: boolean;
  score?: string | { value?: number; displayValue?: string };
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
  };
};

type EspnEvent = {
  id: string;
  uid?: string; // "s:600~l:770~e:761659" → contiene el id de liga
  date: string;
  name?: string;
  shortName?: string;
  competitions?: Array<{
    competitors?: EspnCompetitor[];
    venue?: { fullName?: string };
    status?: EspnStatus;
  }>;
  status?: EspnStatus;
  venue?: { displayName?: string };
};

type EspnStatus = {
  clock?: number;
  displayClock?: string;
  type?: { state?: string; description?: string; completed?: boolean };
};

type EspnScoreboard = {
  leagues?: Array<{ id?: string; uid?: string; name?: string; slug?: string }>;
  events?: EspnEvent[];
};

function scoreOf(c?: EspnCompetitor): number | undefined {
  if (!c?.score) return undefined;
  if (typeof c.score === "string") {
    const n = parseInt(c.score, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return c.score.value ?? (c.score.displayValue ? parseInt(c.score.displayValue, 10) : undefined);
}

function mapTeam(c?: EspnCompetitor): Team {
  const t = c?.team ?? {};
  return {
    id: t.id ?? "?",
    name: t.displayName ?? "Desconocido",
    shortName: t.abbreviation ?? t.shortDisplayName,
    crest: t.id ? crestUrl(t.id) : undefined,
  };
}

function leagueIdFromUid(uid?: string): string | undefined {
  return uid?.match(/l:(\d+)/)?.[1];
}

export function mapEvent(e: EspnEvent): Match {
  const comp = e.competitions?.[0];
  const status = comp?.status ?? e.status;
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");
  const st = mapStatus(status?.type?.state, status?.type?.description);
  const hs = scoreOf(home);
  const as = scoreOf(away);

  return {
    id: e.id,
    league: leagueName(leagueIdFromUid(e.uid)),
    leagueId: leagueIdFromUid(e.uid),
    kickoff: e.date,
    status: st,
    minute: st === "live" || st === "halftime" ? parseMinute(status?.displayClock, status?.clock) : undefined,
    home: mapTeam(home),
    away: mapTeam(away),
    score:
      typeof hs === "number" && typeof as === "number" ? { home: hs, away: as } : undefined,
    venue: comp?.venue?.fullName ?? e.venue?.displayName,
  };
}

/** Partidos del día (todas las ligas que cubre ESPN). */
export async function getScoreboard(dateYYYYMMDD?: string): Promise<Match[]> {
  // Fecha LOCAL del servidor (no UTC): a las 20:00 de México aún es "hoy"
  const d = dateYYYYMMDD ?? new Date().toLocaleDateString("en-CA").replace(/-/g, "");
  const data = await espnFetch<EspnScoreboard>(
    `${SITE}/all/scoreboard?dates=${d}&limit=400`,
    60,
  );
  if (!data?.events) return [];
  return data.events.map((e) => mapEvent(e));
}

export async function getLiveMatches(): Promise<Match[]> {
  const all = await getScoreboard();
  return all.filter((m) => m.status === "live" || m.status === "halftime");
}

/* ────────────────────────── Detalle de partido ────────────────────────── */

export type FormGame = {
  result: "W" | "D" | "L";
  goalsFor: number;
  goalsAgainst: number;
  opponent?: string;
  date?: string;
};

export type MatchOdds = {
  provider?: string;
  homeML?: number; // moneyline americano
  drawML?: number;
  awayML?: number;
  overUnderLine?: number;
  favorite?: "home" | "away";
  details?: string;
};

export type MatchDetail = {
  match: Match;
  formHome: FormGame[];
  formAway: FormGame[];
  h2h: Array<{ date?: string; homeTeam?: string; awayTeam?: string; score?: string }>;
  odds?: MatchOdds;
  liveStats?: LiveStats;
  venueCity?: string;
  venueCountry?: string;
  lineupsAvailable: boolean;
};

type EspnSummary = {
  header?: {
    competitions?: Array<{
      id?: string;
      uid?: string;
      date?: string;
      competitors?: Array<
        EspnCompetitor & { id?: string; homeAway: "home" | "away" }
      >;
      status?: EspnStatus;
      venue?: { fullName?: string };
    }>;
    league?: { name?: string };
    id?: string;
  };
  boxscore?: {
    teams?: Array<{
      team?: { id?: string };
      statistics?: Array<{ name?: string; displayValue?: string }>;
    }>;
  };
  lastFiveGames?: Array<{
    team?: { id?: string; displayName?: string };
    events?: Array<{
      gameResult?: string;
      homeTeamId?: string;
      awayTeamId?: string;
      homeTeamScore?: string;
      awayTeamScore?: string;
      gameDate?: string;
      opponent?: { displayName?: string };
    }>;
  }>;
  headToHeadGames?: Array<{
    team?: { id?: string };
    events?: Array<{
      gameDate?: string;
      homeTeamId?: string;
      awayTeamId?: string;
      homeTeamScore?: string;
      awayTeamScore?: string;
      opponent?: { displayName?: string };
    }>;
  }>;
  pickcenter?: Array<{
    provider?: { name?: string; priority?: number };
    details?: string;
    overUnder?: number;
    homeTeamOdds?: { favorite?: boolean; moneyLine?: number };
    awayTeamOdds?: { favorite?: boolean; moneyLine?: number };
    drawOdds?: { moneyLine?: number };
  }>;
  rosters?: Array<{ roster?: unknown[] }>;
  gameInfo?: {
    venue?: { fullName?: string; address?: { city?: string; country?: string } };
  };
};

function statNum(
  stats: Array<{ name?: string; displayValue?: string }> | undefined,
  name: string,
): number {
  const v = stats?.find((s) => s.name === name)?.displayValue;
  const n = v ? parseFloat(v) : NaN;
  return Number.isNaN(n) ? 0 : n;
}

type FormEntry = NonNullable<EspnSummary["lastFiveGames"]>[number];

function mapForm(entry: FormEntry | undefined): FormGame[] {
  const teamId = entry?.team?.id;
  return (entry?.events ?? []).flatMap((ev) => {
    const isHome = ev.homeTeamId === teamId;
    const gf = parseInt((isHome ? ev.homeTeamScore : ev.awayTeamScore) ?? "", 10);
    const ga = parseInt((isHome ? ev.awayTeamScore : ev.homeTeamScore) ?? "", 10);
    const r = ev.gameResult;
    if (Number.isNaN(gf) || Number.isNaN(ga) || !r || !["W", "D", "L"].includes(r)) return [];
    return [
      {
        result: r as FormGame["result"],
        goalsFor: gf,
        goalsAgainst: ga,
        opponent: ev.opponent?.displayName,
        date: ev.gameDate,
      },
    ];
  });
}

export async function getMatchDetail(eventId: string): Promise<MatchDetail | null> {
  const sum = await espnFetch<EspnSummary>(`${SITE}/all/summary?event=${eventId}`, 30);
  const comp = sum?.header?.competitions?.[0];
  if (!sum || !comp) return null;

  const espnLeagueName = sum.header?.league?.name;
  const match = mapEvent({
    id: eventId,
    uid: comp.uid,
    date: comp.date ?? new Date().toISOString(),
    competitions: [comp],
    status: comp.status,
  });
  // Si el id de liga no está en nuestro mapa, usamos el nombre que da ESPN
  if (match.league === "Fútbol Internacional" && espnLeagueName) {
    match.league = espnLeagueName;
  }
  match.venue = sum.gameInfo?.venue?.fullName ?? match.venue;

  const homeId = match.home.id;
  const formHome = mapForm(
    (sum.lastFiveGames ?? []).find((f) => f.team?.id === homeId) ?? sum.lastFiveGames?.[0],
  );
  const formAway = mapForm(
    (sum.lastFiveGames ?? []).find((f) => f.team?.id !== homeId) ?? sum.lastFiveGames?.[1],
  );

  // H2H: eventos desde la perspectiva de un equipo
  const h2h = (sum.headToHeadGames?.[0]?.events ?? []).slice(0, 6).map((ev) => ({
    date: ev.gameDate,
    homeTeam: ev.homeTeamId === homeId ? match.home.name : match.away.name,
    awayTeam: ev.homeTeamId === homeId ? match.away.name : match.home.name,
    score:
      ev.homeTeamScore != null && ev.awayTeamScore != null
        ? `${ev.homeTeamScore}-${ev.awayTeamScore}`
        : undefined,
  }));

  // Cuotas: proveedor de mayor prioridad
  let odds: MatchOdds | undefined;
  const pc = (sum.pickcenter ?? []).sort(
    (a, b) => (a.provider?.priority ?? 99) - (b.provider?.priority ?? 99),
  )[0];
  if (pc) {
    odds = {
      provider: pc.provider?.name,
      homeML: pc.homeTeamOdds?.moneyLine,
      awayML: pc.awayTeamOdds?.moneyLine,
      drawML: pc.drawOdds?.moneyLine,
      overUnderLine: pc.overUnder,
      favorite: pc.homeTeamOdds?.favorite ? "home" : pc.awayTeamOdds?.favorite ? "away" : undefined,
      details: pc.details,
    };
  }

  // Estadísticas en vivo desde el boxscore (solo live/finished)
  let liveStats: LiveStats | undefined;
  const teams = sum.boxscore?.teams;
  if (teams?.length === 2 && (match.status === "live" || match.status === "halftime" || match.status === "finished")) {
    const hi = teams.findIndex((t) => t.team?.id === homeId);
    const h = teams[hi === -1 ? 0 : hi]?.statistics;
    const a = teams[hi === -1 ? 1 : 1 - hi]?.statistics;
    const anyStat = statNum(h, "totalShots") + statNum(a, "totalShots") + statNum(h, "possessionPct");
    if (anyStat > 0) {
      liveStats = {
        possession: { home: statNum(h, "possessionPct"), away: statNum(a, "possessionPct") },
        shots: { home: statNum(h, "totalShots"), away: statNum(a, "totalShots") },
        shotsOnTarget: { home: statNum(h, "shotsOnTarget"), away: statNum(a, "shotsOnTarget") },
        corners: { home: statNum(h, "wonCorners"), away: statNum(a, "wonCorners") },
        cards: {
          home: statNum(h, "yellowCards") + statNum(h, "redCards"),
          away: statNum(a, "yellowCards") + statNum(a, "redCards"),
        },
      };
    }
  }

  return {
    match,
    formHome,
    formAway,
    h2h,
    odds,
    liveStats,
    venueCity: sum.gameInfo?.venue?.address?.city,
    venueCountry: sum.gameInfo?.venue?.address?.country,
    lineupsAvailable: (sum.rosters ?? []).some((r) => (r.roster?.length ?? 0) > 0),
  };
}

/* ────────────────────────── Búsqueda y equipos ────────────────────────── */

export type TeamSearchResult = {
  id: string;
  name: string;
  leagueSlug?: string;
  leagueName?: string;
  logo?: string;
};

export async function searchTeams(query: string): Promise<TeamSearchResult[]> {
  const data = await espnFetch<{
    results?: Array<{
      type?: string;
      contents?: Array<{
        uid?: string;
        displayName?: string;
        subtitle?: string;
        defaultLeagueSlug?: string;
        sport?: string;
        image?: { default?: string };
      }>;
    }>;
  }>(`${SEARCH}?query=${encodeURIComponent(query)}&limit=10`, 3600);

  const teams = (data?.results ?? []).find((g) => g.type === "team")?.contents ?? [];
  return teams
    .filter((t) => t.sport === "soccer")
    .flatMap((t) => {
      const id = t.uid?.match(/t:(\d+)/)?.[1];
      if (!id) return [];
      return [
        {
          id,
          name: t.displayName ?? "Equipo",
          leagueSlug: t.defaultLeagueSlug,
          leagueName: t.subtitle,
          logo: t.image?.default ?? crestUrl(id),
        },
      ];
    });
}

type EspnSchedule = {
  team?: { id?: string; displayName?: string; logo?: string };
  events?: EspnEvent[];
};

/** Próximos partidos y jugados de un equipo. Si la temporada actual tiene
 *  pocos jugados (inicio de temporada), completa con la anterior. */
export async function getTeamSchedule(teamId: string): Promise<{
  teamName?: string;
  upcoming: Match[];
  played: Match[];
}> {
  const [fix, res] = await Promise.all([
    espnFetch<EspnSchedule>(`${SITE}/all/teams/${teamId}/schedule?fixture=true`, 1800),
    espnFetch<EspnSchedule>(`${SITE}/all/teams/${teamId}/schedule?fixture=false`, 1800),
  ]);

  let playedEvents = res?.events ?? [];
  if (playedEvents.length < 3) {
    const prevSeason = new Date().getFullYear() - 1;
    const prev = await espnFetch<EspnSchedule>(
      `${SITE}/all/teams/${teamId}/schedule?season=${prevSeason}&fixture=false`,
      86400,
    );
    playedEvents = [...(prev?.events ?? []), ...playedEvents];
  }

  return {
    teamName: fix?.team?.displayName ?? res?.team?.displayName,
    upcoming: (fix?.events ?? []).map((e) => mapEvent(e)).slice(0, 15),
    played: playedEvents
      .map((e) => mapEvent(e))
      .reverse()
      .slice(0, 15),
  };
}
