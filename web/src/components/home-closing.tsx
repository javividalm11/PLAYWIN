import Link from "next/link";
import { InterfaceIcon } from "./icons";

function ClosingArrow() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function TacticalPitch() {
  return <svg className="pv-closing-pitch" viewBox="0 0 680 444" fill="none" aria-hidden>
    <defs><pattern id="closing-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#eaff8f" opacity=".4" /></pattern><radialGradient id="closing-glow"><stop stopColor="#d5ff64" stopOpacity=".26" /><stop offset="1" stopColor="#d5ff64" stopOpacity="0" /></radialGradient></defs>
    <path fill="url(#closing-dots)" d="M0 0h680v444H0z" />
    <circle cx="465" cy="226" r="338" fill="url(#closing-glow)" />
    <g stroke="#e6ff81" strokeWidth="1.5"><circle cx="465" cy="226" r="77" /><circle cx="465" cy="226" r="152" opacity=".35" /><circle cx="465" cy="226" r="216" opacity=".25" /><circle cx="465" cy="226" r="290" opacity=".3" /><path d="M465 0v444M25 64h135v262H25M25 226h363" opacity=".65" /><path d="M128 0a338 338 0 0 0 0 444" opacity=".22" /><path d="M198 153c45 196 205 291 403 231" strokeDasharray="4 6" /></g>
    <g fill="#efffa0"><circle cx="465" cy="226" r="6" /><circle cx="330" cy="88" r="5" /><circle cx="303" cy="330" r="7" /><circle cx="601" cy="384" r="5" /></g>
    <g stroke="#efffa0" strokeWidth="2.5" strokeLinecap="round"><circle cx="190" cy="154" r="7" /><path d="m560 68 17 18m0-18-17 18M206 288l15 17m0-17-15 17" /></g>
  </svg>;
}

export function HomeClosingCta() {
  return <section className="pv-band pv-band-lime pv-final" aria-labelledby="closing-title">
    <TacticalPitch />
    <div className="pv-container"><div className="pv-final-copy">
      <p className="pv-eyebrow">Tu próxima decisión empieza aquí<span aria-hidden /></p>
      <h2 id="closing-title">Que tu siguiente pick<br />tenga más contexto.</h2>
      <div className="pv-final-actions">
        <Link href="/registro" className="pv-button pv-button-dark">Empezar gratis<ClosingArrow /></Link>
        <Link href="/resultados" className="pv-button pv-button-ink-outline">Ver los resultados</Link>
      </div>
      <p className="pv-caption">3 días de acceso completo · Sin tarjeta · Solo mayores de 18 años</p>
    </div></div>
  </section>;
}

const FOOTER_GROUPS = [
  { title: "Explora", label: "Explorar PickVerde", links: [["Partidos de hoy", "/partidos"], ["En vivo", "/en-vivo"], ["Pronósticos", "/picks"], ["Resultados verificables", "/resultados"]] },
  { title: "Tu PickVerde", label: "Tu cuenta", links: [["Mi panel de apuestas", "/dashboard"], ["Planes y precios", "/precios"], ["Iniciar sesión", "/login"], ["Crear cuenta gratis", "/registro"]] },
  { title: "Antes de empezar", label: "Información", links: [["Juego responsable", "#juego-responsable"], ["Sobre el servicio", "#informacion-servicio"], ["Información de suscripción", "/precios"]] },
];

export function HomeClosingFooter() {
  return <footer className="pv-home-footer"><div className="pv-container">
    <div className="pv-footer-top">
      <div className="pv-footer-brand">
        <Link href="/" className="pv-footer-lockup" aria-label="PickVerde, inicio"><svg viewBox="0 0 60 50" fill="currentColor" aria-hidden><path d="M4 46 23 10h13L17 46ZM24 40 45 0h13L37 40ZM43 31 54 10h6L49 31Z" /></svg><span>Pick<b>Verde</b></span></Link>
        <p>El deporte pone la emoción.<br />Nosotros ponemos los datos.</p>
        <span className="pv-footer-tag"><InterfaceIcon name="shield" />Análisis transparente. Decisiones propias.</span>
      </div>
      {FOOTER_GROUPS.map(group => <nav key={group.title} aria-label={group.label}><h3>{group.title}</h3>{group.links.map(([label, href]) => <Link key={label} href={href}>{label}<svg viewBox="0 0 12 16" fill="none" aria-hidden><path d="m4 3 4 5-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>)}</nav>)}
    </div>
    <div id="juego-responsable" className="pv-footer-responsible"><span className="pv-age">18+</span><div><h3>El juego tiene límites. Pon los tuyos.</h3><p>Define un presupuesto, toma pausas y no persigas pérdidas. Si el juego afecta tu bienestar o tus finanzas, deja de apostar y busca ayuda profesional. Servicio exclusivo para mayores de edad.</p></div></div>
    <details id="informacion-servicio" className="pv-footer-info"><summary>Información sobre el servicio<span aria-hidden>+</span></summary><p>PickVerde ofrece análisis estadístico y un registro personal de apuestas. No es una casa de apuestas y no procesa depósitos, apuestas ni retiros. Las predicciones son estimaciones y no garantizan resultados. El registro personal requiere iniciar sesión. Consulta las condiciones del plan y de facturación antes de suscribirte.</p></details>
    <div className="pv-footer-bottom"><p>© {new Date().getFullYear()} PickVerde. Todos los derechos reservados.</p><span>Datos primero. Tú decides.</span></div>
  </div></footer>;
}
