import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";


export const metadata: Metadata = {
  title: {
    default: "PickVerde: Pronósticos deportivos con datos",
    template: "%s · PickVerde",
  },
  description:
    "Análisis y pronósticos deportivos basados en datos. Estadísticas, probabilidades, picks y seguimiento de fútbol en vivo.",
  applicationName: "PickVerde",
};

export const viewport: Viewport = {
  themeColor: "#0d0f0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="grain flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
