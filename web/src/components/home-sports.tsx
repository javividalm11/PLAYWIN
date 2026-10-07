import Link from "next/link";
import type { Match, Prediction } from "@/lib/types";
import { formatKickoffFull, formatKickoff, confidenceStyles } from "@/lib/format";
import { isSafePick } from "@/lib/prediction/config";
import { TeamBadge } from "./team-badge";
import { SportIcon, InterfaceIcon } from "./icons";
import { Arrow } from "./home-sections";

function BarsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden><path d="M3 14h4v8H3zM10 8h4v14h-4zM17 2h4v20h-4z" fill="currentColor" /></svg>;
}

export function HomeLiveCard({ match, prediction }: { match: Match; prediction?: Prediction }) {
  const probs = prediction?.probs;
  const values = probs ? [probs.home, probs.draw, probs.away] : [];
  const sum = values.reduce((a, b) => a + b, 0);
  const strongest = values.indexOf(Math.max(...values));
  return <Link href={`/partido/${match.id}`} className="pv-sports-live-card">
    <div className="pv-sports-match-head"><div className="pv-sports-competition"><SportIcon sport="football" /><div><strong>Fútbol</strong><span>{match.league}</span></div></div><span className="pv-sports-live-badge"><i />{match.status === "halftime" ? "Descanso" : "En vivo"}{match.minute != null && ` · ${match.minute}′`}</span></div>
    <div className="pv-sports-teams">{[match.home, match.away].map((team, i) => <div key={team.id}><TeamBadge team={team} size={52} /><strong>{team.name}</strong><b>{match.score ? (i ? match.score.away : match.score.home) : "—"}</b></div>)}</div>
    {probs && sum > 0 ? <div className="pv-sports-probabilities"><div className="pv-sports-prob-track" aria-hidden>{values.map((value, i) => <span key={i} className={i === strongest ? "is-favored" : ""} style={{ width: `${value / sum * 100}%` }} />)}</div><div className="pv-sports-prob-labels" aria-label="Probabilidades del resultado">{[match.home.shortName ?? "1", "X", match.away.shortName ?? "2"].map((label, i) => <span key={i}>{label}<b className={i === strongest ? "is-favored" : ""}>{values[i]}%</b></span>)}</div></div> : <p className="pv-sports-analysis-pending">Consulta el marcador y el análisis del partido <Arrow /></p>}
  </Link>;
}

export function HomeFeaturedPick({ match, prediction }: { match: Match; prediction: Prediction }) {
  const safe = isSafePick(prediction.pick.probability);
  return <Link href={`/partido/${match.id}`} className="pv-sports-pick-card">
    <div className="pv-sports-pick-tags">{safe && <span className="pv-sports-safe"><InterfaceIcon name="shield" />Pick seguro</span>}<span className={`pv-sports-confidence pv-sports-confidence-${prediction.pick.confidence}`}>{confidenceStyles[prediction.pick.confidence].label}</span><span className="pv-sports-market">{prediction.pick.market}</span></div>
    <h3>{prediction.pick.selection}</h3>
    <div className="pv-sports-pick-body"><div><p>{match.home.name} vs {match.away.name}</p><time dateTime={match.kickoff}>{formatKickoffFull(match.kickoff)}</time></div><div className="pv-sports-pick-prob"><strong>{prediction.pick.probability}%</strong>{prediction.pick.fairOdds != null && <span>Momio <b>{prediction.pick.fairOdds.toFixed(2)}</b></span>}</div></div>
    <span className="pv-sports-stat-link"><BarsIcon />Estadísticas <Arrow /></span>
  </Link>;
}

export function HomeSports({ live, liveCount, predictions, picks, noData }: { live: Match[]; liveCount: number; predictions: Map<string, Prediction>; picks: { match: Match; prediction: Prediction }[]; noData: boolean }) {
  return <div className="pv-sports-showcase">
    {noData && <section className="pv-sports-section"><p className="pv-sports-empty">No pudimos cargar los partidos en este momento. Actualiza la página en unos segundos.</p></section>}
    {live.length > 0 && <section className="pv-sports-section pv-sports-live" aria-labelledby="home-live-title"><div className="pv-sports-heading"><div><h2 id="home-live-title">Partidos en vivo</h2><p className="pv-sports-lead">Marcadores y probabilidades en tiempo real</p></div><Link href="/en-vivo" className="pv-sports-all">Ver todos ({liveCount}) <Arrow /></Link></div><div className="pv-sports-live-grid">{live.map(match => <HomeLiveCard key={match.id} match={match} prediction={predictions.get(match.id)} />)}</div></section>}
    {picks.length > 0 && <section className="pv-sports-section pv-sports-featured" aria-labelledby="home-picks-title"><div className="pv-sports-heading"><div><h2 id="home-picks-title">Pronósticos destacados</h2><p className="pv-sports-lead">Nuestros modelos encuentran las mejores oportunidades.</p></div><Link href="/picks" className="pv-sports-all">Todos los picks <Arrow /></Link></div><div className="pv-sports-pick-grid">{picks.map(pick => <HomeFeaturedPick key={pick.match.id} {...pick} />)}</div></section>}
  </div>;
}

const DAY_FMT = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", ...o }).format(d);

function AgendaRow({ match }: { match: Match }) {
  const [place, ...rest] = (match.venue ?? "").split(",");
  return <Link href={`/partido/${match.id}`} className="pv-agenda-row">
    <div className="pv-agenda-league"><SportIcon sport="football" /><span>{match.league}</span></div>
    <div className="pv-agenda-fixture">
      <time dateTime={match.kickoff}>{formatKickoff(match.kickoff)}</time>
      <div className="pv-agenda-side"><TeamBadge team={match.home} size={44} /><strong>{match.home.name}</strong></div>
      <b className="pv-agenda-vs" aria-label="contra">VS</b>
      <div className="pv-agenda-side"><TeamBadge team={match.away} size={44} /><strong>{match.away.name}</strong></div>
    </div>
    <div className="pv-agenda-venue">{place ? <><svg viewBox="0 0 24 24" aria-hidden><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="currentColor" /></svg><div><strong>{place}</strong>{rest.length > 0 && <span>{rest.join(",").trim()}</span>}</div></> : <span>Sede por confirmar</span>}</div>
    <span className="pv-agenda-go"><Arrow /></span>
  </Link>;
}

export function HomeAgenda({ matches }: { matches: Match[] }) {
  if (!matches.length) return null;
  const today = new Date();
  const days = Array.from({ length: 8 }, (_, i) => new Date(today.getTime() + i * 86_400_000));
  return <section className="pv-agenda" aria-labelledby="home-agenda-title"><div className="pv-agenda-inner">
    <div className="pv-sports-heading"><div><p className="pv-agenda-kicker">Agenda</p><h2 id="home-agenda-title">Próximos <em>partidos</em></h2><p className="pv-sports-lead">Consulta la programación de los próximos encuentros.</p></div><Link href="/partidos" className="pv-sports-all">Ver calendario completo <Arrow /></Link></div>
    <div className="pv-agenda-days" role="tablist" aria-label="Días">{days.map((d, i) => <span key={i} role="tab" aria-selected={i === 0} aria-disabled={i !== 0} className={i === 0 ? "is-active" : ""}><small>{i === 0 ? "Hoy" : DAY_FMT(d, { weekday: "short" }).replace(".", "")}</small><b>{DAY_FMT(d, { day: "2-digit" })} {DAY_FMT(d, { month: "short" }).replace(".", "").toUpperCase()}</b></span>)}</div>
    <div className="pv-agenda-list">{matches.map(m => <AgendaRow key={m.id} match={m} />)}</div>
  </div></section>;
}
