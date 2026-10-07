import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { InterfaceIcon, SportIcon, type InterfaceIconName, type SportName } from "./icons";
import { HomeClosingCta, HomeClosingFooter } from "./home-closing";
import { FeatureVisual, FeatureBarsIcon } from "./feature-visuals";
import { HomePlans } from "./home-plans";
import { HomeFaq } from "./home-faq";

export const pillPrimary = "pv-button pv-button-lime";
export const pillGhost = "pv-button pv-button-outline";
export function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function Band({ children, tone = "dark", className = "" }: { children: ReactNode; tone?: "dark" | "alt" | "light" | "lime"; className?: string }) {
  return <section className={`pv-band pv-band-${tone} ${className}`}><div className="pv-container">{children}</div></section>;
}
export function SectionHead({ kicker, title, lead, action, light = false }: { kicker: string; title: string; lead?: string; action?: ReactNode; light?: boolean }) {
  return <Reveal className={`pv-section-head ${light ? "pv-ink" : ""}`}><div><p className="pv-eyebrow">{kicker}</p><h2 className="pv-heading">{title}</h2>{lead && <p className="pv-lead">{lead}</p>}</div>{action}</Reveal>;
}
export function KpiCard({ label, value, hint, accent = false, icon = "target", status = "Historial público", artwork = "accuracy", trend = null, comparison = "Sin comparativa disponible" }: { label: string; value: string; hint: string; accent?: boolean; icon?: InterfaceIconName; status?: string; artwork?: "accuracy" | "confidence" | "streak" | "transparency"; trend?: number | null; comparison?: string }) {
  const percentage = value.endsWith("%") ? Number.parseFloat(value) : null;
  return <article className={`pv-kpi pv-kpi-refined pv-kpi-sports pv-kpi-${artwork} ${accent ? "pv-kpi-accent" : ""}`}>
    <div className="pv-kpi-artwork" style={{ backgroundImage: `url(/images/results/${artwork}.webp)` }} aria-hidden />
    <div className="pv-kpi-top"><span className="pv-kpi-icon"><InterfaceIcon name={icon} className="h-5 w-5" /></span><span className={`pv-kpi-badge pv-kpi-trend ${trend != null && trend < 0 ? "pv-kpi-trend-down" : ""}`} title={trend == null ? "Sin datos suficientes para comparar" : comparison} aria-label={trend == null ? "Sin comparativa disponible" : `${trend > 0 ? "+" : ""}${trend}%: ${comparison}`}><svg viewBox="0 0 20 20" fill="none" aria-hidden><path d={trend != null && trend < 0 ? "M10 3v14m-5-5 5 5 5-5" : "M10 17V3m-5 5 5-5 5 5"} stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>{trend == null ? <small>Sin comparativa</small> : `${trend > 0 ? "+" : ""}${trend}%`}</span></div>
    <p className="pv-eyebrow">{label}</p><p className="pv-kpi-value tabular">{value}</p><p className="pv-kpi-hint">{hint}</p>
    <div className="pv-kpi-bottom">{percentage !== null && Number.isFinite(percentage) ? <div className="pv-kpi-meter" aria-label={`${label}: ${value}`}><span style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} /></div> : <div className="pv-kpi-rule" />}<span className="pv-kpi-status"><span aria-hidden />{status}</span></div>
  </article>;
}
const STEPS = [
  { n: "01", icon: "calendar", t: "Encuentra tu partido", d: "Consulta la agenda, sigue el directo o busca tu equipo y su próxima competición." },
  { n: "02", icon: "search", t: "Mira más allá de la cuota", d: "Revisa probabilidades, forma reciente y la explicación de cada pronóstico." },
  { n: "03", icon: "target", t: "Decide con criterio", d: "Compara la cuota justa con el mercado. Define tu presupuesto antes de apostar." },
  { n: "04", icon: "chart", t: "Lleva tus propios números", d: "Registra tus apuestas y consulta tu balance, ROI y porcentaje de acierto." },
] as const;
export function HowItWorks() {
  return <Band tone="light" className="pv-how" ><SectionHead light kicker="Tu siguiente jugada, con contexto" title="Menos corazonadas. Más información." lead="Del primer análisis al seguimiento de tus resultados. Así se usa PickVerde." /><div className="pv-steps">{STEPS.map((s, i) => <Reveal key={s.n} delay={i * 70}><div className="pv-step"><div className="pv-step-top"><InterfaceIcon name={s.icon} className="h-7 w-7" /><span>{s.n}</span></div><h3>{s.t}</h3><p>{s.d}</p></div></Reveal>)}</div><Link href="/partidos" className="pv-text-link">Explorar los partidos de hoy <Arrow /></Link></Band>;
}
const FEATURES: Array<{ icon: InterfaceIconName; t: string; d: string; href: string; cta: string }> = [
  { icon: "target", t: "Un pick. Toda la explicación.", d: "Probabilidades y contexto para entender cada selección, antes de tomar una decisión.", href: "/picks", cta: "Descubrir pronósticos" },
  { icon: "pulse", t: "El partido cambia. El análisis también.", d: "Sigue el marcador y las probabilidades que se ajustan al desarrollo del encuentro.", href: "/en-vivo", cta: "Seguir en vivo" },
  { icon: "chart", t: "Tu estrategia, en números.", d: "Importe, cuota y resultado en un panel personal. Entiende cómo evoluciona tu balance.", href: "/dashboard", cta: "Abrir mi panel" },
];
export function Features() {
  return <Band className="pv-tools"><Reveal className="pv-tools-head"><p className="pv-eyebrow">Tu ventaja es entender</p><h2>Todo para analizar.<br />Todo para decidir<span>.</span></h2><p className="pv-lead">Herramientas que convierten los datos del partido en información útil.</p></Reveal><div className="pv-feature-grid">{FEATURES.map((f, i) => <Reveal key={f.t} delay={i * 80}><article className={`pv-feature pv-feature-${i}`}><FeatureVisual kind={i} /><div className="pv-feature-copy"><span className="pv-feature-accent" aria-hidden /><h3>{f.t}</h3><p>{f.d}</p><Link href={f.href} className="pv-feature-cta">{f.cta}<Arrow /></Link></div></article></Reveal>)}</div><p className="pv-caption">Visualizaciones ilustrativas de las herramientas. Consulta los datos actuales dentro de cada apartado.</p></Band>;
}
const MARKETS = ["Resultado 1X2", "Doble oportunidad", "Más / menos goles", "Ambos anotan", "Gol de equipo", "Combinadas"];
const SPORTS: Array<{ name: string; sport: SportName }> = [{ name: "Básquetbol", sport: "basketball" }, { name: "Tenis", sport: "tennis" }, { name: "Béisbol", sport: "baseball" }, { name: "Fútbol americano", sport: "american-football" }, { name: "Hockey", sport: "hockey" }, { name: "E-sports", sport: "esports" }];
export function Markets() {
  return <Band tone="light" className="pv-markets"><div className="pv-market-layout"><Reveal className="pv-market-copy"><p className="pv-eyebrow">El juego que te apasiona</p><h2 className="pv-heading">Muchas formas<br />de leer un partido<span>.</span></h2><p className="pv-lead">Fútbol, desde el primer silbatazo. Explora los mercados disponibles y encuentra el análisis que necesitas.</p><div className="pv-market-actions"><Link href="/partidos" className="pv-button pv-button-dark">Explorar fútbol <span><Arrow /></span></Link><div className="pv-market-benefits"><span><FeatureBarsIcon />Análisis<br />en tiempo real</span><span><svg viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="m10 8 6 4-6 4V8Z" fill="currentColor" /></svg>Pre-partido<br />y en vivo</span><span><svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>Los mejores<br />mercados</span></div></div></Reveal><Reveal><div className="pv-football"><div className="pv-football-top"><span className="pv-football-icon"><SportIcon sport="football" /></span><span className="pv-availability"><i />Disponible</span></div><h3>El fútbol, en detalle.</h3><p>Pre-partido y en vivo</p><div className="pv-football-art" aria-hidden><div className="pv-football-odds"><strong>Resultado 1X2</strong><div><b>1 <em>2.10</em></b><span>X <em>3.25</em></span><span>2 <em>3.80</em></span><span>2 <em>3.80</em></span></div></div><div className="pv-football-goals"><strong>Más / menos goles</strong><div>{[3,4,6,9,12,14,18,23,28,33].map((height,i)=><i key={i} style={{height}} />)}</div></div><div className="pv-football-btts"><strong>Ambos anotan</strong><div><span>Sí <b>1.72</b></span><span>No <b>2.05</b></span></div></div></div><div className="pv-market-chips">{MARKETS.map((m,i) => <span key={m}>{i === 0 || i === 2 ? <FeatureBarsIcon /> : i === 1 ? <InterfaceIcon name="shield" /> : i === 3 ? <SportIcon sport="football" /> : i === 4 ? <InterfaceIcon name="target" /> : <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5m-18 5 9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>}{m}</span>)}</div></div></Reveal></div><div className="pv-sports-header"><p>Estamos preparando más deportes.</p><span>Próximamente</span></div><div className="pv-sports">{SPORTS.map(s => <div key={s.name} className={`pv-coming-${s.sport}`}><span className="pv-coming-icon"><SportIcon sport={s.sport} /></span><span>{s.name}</span></div>)}</div></Band>;
}
export function PlansTeaser() {
  return <HomePlans />;
}
export function Faq() { return <HomeFaq />; }
export function FinalCta() { return <HomeClosingCta />; }
export function HomeFooter() { return <HomeClosingFooter />; }
