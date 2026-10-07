"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";
import { HomeFooter } from "./home-sections";

/** Rutas que traen su propia cabecera y pie a pantalla completa. */
const BARE = ["/login", "/registro"];

export function SiteHeader() {
  const pathname = usePathname();
  return BARE.includes(pathname) ? null : <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  return BARE.includes(pathname) ? null : pathname === "/" ? <HomeFooter /> : <Footer />;
}
