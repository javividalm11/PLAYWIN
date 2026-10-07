"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeaderAuth } from "./header-auth";

const NAV = [
  { href: "/partidos", label: "Partidos", icon: "home" },
  { href: "/en-vivo", label: "En vivo", icon: "live" },
  { href: "/picks", label: "Pronósticos", icon: "chart" },
  { href: "/resultados", label: "Resultados", icon: "trophy" },
  { href: "/dashboard", label: "Mi panel", icon: "user" },
  { href: "/precios", label: "Precios", icon: "coins" },
] as const;

function NavIcon({ name }: { name: typeof NAV[number]["icon"] }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {name === "home" && <path d="m3 10 9-7 9 7h-2v10h-5v-7h-4v7H5V10H3Z" fill="currentColor" strokeWidth="1" />}
    {name === "live" && <><circle cx="12" cy="12" r="2" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4m8.4-8.4a6 6 0 0 1 0 8.4M4.5 4.5a10.6 10.6 0 0 0 0 15m15-15a10.6 10.6 0 0 1 0 15" /></>}
    {name === "chart" && <><rect x="3" y="12" width="4" height="9" rx=".6" /><rect x="10" y="3" width="4" height="18" rx=".6" /><rect x="17" y="7" width="4" height="14" rx=".6" /></>}
    {name === "trophy" && <><path d="M7 3h10v5a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4m-4 1v5m-4 3h8m-6-3h4" /></>}
    {name === "user" && <><circle cx="12" cy="7" r="4" /><path d="M3 21v-2a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2" /></>}
    {name === "coins" && <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 10c0 1.7 3.6 3 8 3s8-1.3 8-3M4 15c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>}
  </svg>;
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const onHome = pathname === "/";
  const active = (href: string) => pathname.startsWith(href) || (onHome && href === "/partidos");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const links = menuPanel.current?.querySelectorAll<HTMLElement>('a, button');
    links?.[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (event.key === "Tab" && links?.length) {
        const first = links[0];
        const last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); menuButton.current?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); menuButton.current?.focus(); }
        else if (document.activeElement === menuButton.current) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      }
    }
    const desktop = window.matchMedia("(min-width: 1151px)");
    const onResize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return <>
    <header className={`pv-navbar ${onHome ? "pv-navbar-home" : ""}`}>
      <span className="pv-navbar-art" aria-hidden />
      <span className="pv-navbar-slashes pv-navbar-slashes-left" aria-hidden />
      <span className="pv-navbar-slashes pv-navbar-slashes-right" aria-hidden />
      <Link href="/" className="pv-navbar-brand" aria-label="PickVerde, inicio">
        <svg viewBox="0 0 60 50" fill="currentColor" aria-hidden><path d="M4 46 23 10h13L17 46ZM24 40 45 0h13L37 40ZM43 31 54 10h6L49 31Z" /></svg>
        <span>Pick<b>Verde</b></span>
      </Link>
      <nav className="pv-navbar-links" aria-label="Principal">{NAV.map(item => <Link key={item.href} href={item.href} className={active(item.href) ? "is-active" : ""} aria-current={pathname.startsWith(item.href) ? "page" : undefined}><NavIcon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
      <div className="pv-navbar-auth"><HeaderAuth /></div>
      <div className="pv-navbar-mobile-actions">
        <Link href="/registro" className="pv-navbar-mobile-trial">Probar gratis</Link>
        <button ref={menuButton} type="button" onClick={() => setOpen(!open)} className="pv-navbar-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} aria-controls="pv-mobile-navigation"><svg viewBox="0 0 24 24" fill="none" aria-hidden><path d={open ? "m6 6 12 12M18 6 6 18" : "M4 6h16M4 12h16M4 18h16"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button>
      </div>
    </header>
    <div className={`pv-navbar-overlay ${open ? "is-open" : ""}`}>
      <button type="button" className="pv-navbar-backdrop" aria-label="Cerrar menú" tabIndex={-1} onClick={() => { setOpen(false); menuButton.current?.focus(); }} />
      <div ref={menuPanel} className="pv-navbar-mobile-panel" id="pv-mobile-navigation" aria-label="Menú de navegación">
        <nav aria-label="Principal móvil">{NAV.map(item => <Link key={item.href} href={item.href} className={active(item.href) ? "is-active" : ""} aria-current={pathname.startsWith(item.href) ? "page" : undefined} onClick={() => setOpen(false)}><NavIcon name={item.icon} /><span>{item.label}</span><span aria-hidden>›</span></Link>)}</nav>
        <div className="pv-navbar-mobile-auth" onClick={event => { if ((event.target as HTMLElement).closest('a')) setOpen(false); }}><HeaderAuth /><p>18+ · Análisis deportivo responsable</p></div>
      </div>
    </div>
  </>;
}
