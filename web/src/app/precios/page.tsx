import type { Metadata } from "next";
import Link from "next/link";
import { PaddleCheckout } from "@/components/paddle-checkout";

export const metadata: Metadata = { title: "Precios" };

const STEPS = [
  {
    badge: "Paso 1",
    title: "Visitante",
    price: "Gratis",
    period: "3 días",
    highlight: false,
    features: [
      "Acceso completo sin registrarte",
      "Predicciones pre-match y en vivo",
      "Picks del día con explicación",
      "Sin tarjeta de crédito",
    ],
    cta: { label: "Explorar ahora", href: "/partidos" },
  },
  {
    badge: "Paso 2",
    title: "Registrado",
    price: "Gratis",
    period: "+2 días extra",
    highlight: false,
    features: [
      "Todo lo del plan visitante",
      "2 días adicionales de acceso",
      "Guarda tus equipos favoritos",
      "Historial de tus consultas",
    ],
    cta: { label: "Crear cuenta", href: "/registro" },
  },
  {
    badge: "Recomendado",
    title: "PLAYWIN Pro",
    price: "$9",
    period: "USD / mes",
    highlight: true,
    features: [
      "Acceso ilimitado a todas las predicciones",
      "Análisis en vivo minuto a minuto",
      "Explicación profunda de cada pick",
      "Todas las ligas disponibles",
      "Soporte prioritario",
    ],
    cta: { label: "Suscribirme", href: "/registro?plan=pro" },
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-silver-100 md:text-4xl">
          Precios <span className="text-gradient-brand">simples</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-silver-400">
          Prueba todo gratis durante 5 días en total. Si te ayuda a ganar, cuesta menos
          que una apuesta perdida.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((plan) => (
          <div
            key={plan.title}
            className={`card-surface relative flex flex-col p-6 ${
              plan.highlight ? "border-brand-500/60 glow-brand" : ""
            }`}
          >
            <span
              className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                plan.highlight
                  ? "bg-brand-500 text-pitch-950"
                  : "bg-pitch-600 text-silver-300"
              }`}
            >
              {plan.badge}
            </span>

            <h2 className="mt-3 text-lg font-bold text-silver-100">{plan.title}</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold text-silver-100">{plan.price}</span>
              <span className="text-sm text-silver-500">{plan.period}</span>
            </div>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm text-silver-300">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.highlight ? (
              <div className="mt-8">
                <PaddleCheckout label={plan.cta.label} />
              </div>
            ) : (
              <Link
                href={plan.cta.href}
                className="mt-8 rounded-xl border border-pitch-500 px-5 py-3 text-center text-sm font-bold text-silver-300 transition-all hover:border-silver-500 hover:text-white"
              >
                {plan.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-silver-600">
        Pagos procesados de forma segura. Cancela cuando quieras. Aceptamos tarjetas
        internacionales y PayPal.
      </p>
    </div>
  );
}
