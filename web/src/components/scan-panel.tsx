"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Prediction } from "@/lib/types";
import { confidenceStyles } from "@/lib/format";
import { ProbBar } from "./prob-bar";

type ScanState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "paywall"; nextStep: "register" | "subscribe" }
  | {
      phase: "ready";
      prediction: Prediction;
      access?: { tier: string; daysLeft: number | null };
    };

/**
 * Panel "Escanear partido": la acción de servicio de PLAYWIN.
 * POST /api/predict → análisis completo, o paywall (402) si el trial expiró.
 * En partidos en vivo, tras el primer escaneo se refresca solo cada 45s.
 */
export function ScanPanel({
  matchId,
  isLive,
  isFinished,
  homeLabel,
  awayLabel,
  homeShort,
  awayShort,
}: {
  matchId: string;
  isLive: boolean;
  isFinished: boolean;
  homeLabel: string;
  awayLabel: string;
  homeShort: string;
  awayShort: string;
}) {
  const [state, setState] = useState<ScanState>({ phase: "idle" });
  const scanned = useRef(false);

  const scan = useCallback(async () => {
    setState((s) => (s.phase === "ready" ? s : { phase: "loading" }));
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (res.status === 402) {
        const body = (await res.json()) as { nextStep?: "register" | "subscribe" };
        setState({ phase: "paywall", nextStep: body.nextStep ?? "register" });
        return;
      }
      if (!res.ok) {
        setState({ phase: "error", message: "No pudimos generar el análisis. Intenta de nuevo." });
        return;
      }
      const body = (await res.json()) as {
        prediction: Prediction;
        access?: { tier: string; daysLeft: number | null };
      };
      scanned.current = true;
      setState({ phase: "ready", prediction: body.prediction, access: body.access });
    } catch {
      setState({ phase: "error", message: "Error de conexión. Revisa tu red e intenta de nuevo." });
    }
  }, [matchId]);

  // Refresco automático en vivo tras el primer escaneo
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      if (scanned.current && document.visibilityState === "visible") void scan();
    }, 45_000);
    return () => clearInterval(id);
  }, [isLive, scan]);

  /* ─────────── Estados previos al análisis ─────────── */

  if (state.phase === "idle" || state.phase === "loading" || state.phase === "error") {
    return (
      <div className="card-surface relative overflow-hidden p-6 text-center md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_90%_at_50%_-20%,rgba(164,225,0,0.1),transparent)]"
        />
        <div className="relative">
          <h2 className="text-lg font-bold text-silver-100">
            {isFinished ? "Lectura del partido" : "Análisis PLAYWIN"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-silver-500">
            El modelo leerá forma reciente, historial directo, cuotas del mercado, clima
            {isLive ? ", marcador y dominio en vivo" : ""} para calcular probabilidades y
            recomendarte el mejor pick.
          </p>
          {state.phase === "error" && (
            <p className="mt-3 text-sm font-medium text-risk-500">{state.message}</p>
          )}
          <button
            onClick={() => void scan()}
            disabled={state.phase === "loading"}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-bold text-pitch-950 transition-all hover:bg-brand-400 hover:glow-brand disabled:opacity-60"
          >
            {state.phase === "loading" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-pitch-950/30 border-t-pitch-950" />
                Analizando datos…
              </>
            ) : (
              <>🔍 Escanear partido</>
            )}
          </button>
          <p className="mt-3 text-[11px] text-silver-600">
            Análisis estadístico, no garantía de resultado · 18+
          </p>
        </div>
      </div>
    );
  }

  /* ─────────── Paywall ─────────── */

  if (state.phase === "paywall") {
    const isRegister = state.nextStep === "register";
    return (
      <div className="card-surface relative overflow-hidden border-brand-500/40 p-6 text-center md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_90%_at_50%_-20%,rgba(164,225,0,0.12),transparent)]"
        />
        <div className="relative">
          <p className="text-3xl">{isRegister ? "🎁" : "⭐"}</p>
          <h2 className="mt-2 text-xl font-bold text-silver-100">
            {isRegister ? "Tu prueba gratuita terminó" : "Tus días extra terminaron"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-silver-400">
            {isRegister ? (
              <>
                Usaste tus 3 días de prueba. Crea tu cuenta gratis y obtén{" "}
                <strong className="text-brand-400">2 días adicionales</strong> de acceso
                completo.
              </>
            ) : (
              <>
                Sigue con acceso ilimitado a todos los análisis por solo{" "}
                <strong className="text-brand-400">$9 USD al mes</strong>. Cancela cuando
                quieras.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={isRegister ? "/registro" : "/precios"}
              className="rounded-xl bg-brand-500 px-7 py-3 text-sm font-bold text-pitch-950 transition-all hover:bg-brand-400 hover:glow-brand"
            >
              {isRegister ? "Crear cuenta gratis" : "Suscribirme por $9/mes"}
            </Link>
            {isRegister && (
              <Link
                href="/login"
                className="rounded-xl border border-pitch-500 px-7 py-3 text-sm font-semibold text-silver-300 transition-colors hover:border-silver-500 hover:text-white"
              >
                Ya tengo cuenta
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── Análisis listo ─────────── */

  const { prediction, access } = state;
  const conf = confidenceStyles[prediction.pick.confidence];

  return (
    <div className="flex flex-col gap-6">
      <div className="card-surface p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-silver-400">
            {isLive ? "Probabilidades en vivo" : isFinished ? "Lectura del partido" : "Predicción del modelo"}
          </h2>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${conf.className}`}>
            {conf.label}
          </span>
        </div>

        <div className="mt-5">
          <ProbBar probs={prediction.probs} homeLabel={homeShort} awayLabel={awayShort} />
        </div>

        {!isFinished && (
          <div className="mt-6 rounded-xl border border-brand-500/25 bg-brand-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
              {prediction.pick.probability >= 85 ? "🔒 Pick seguro" : "Pick recomendado"} ·{" "}
              {prediction.pick.market}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <p className="text-lg font-bold text-silver-100">{prediction.pick.selection}</p>
              <span className="shrink-0 font-mono text-2xl font-bold text-brand-400">
                {prediction.pick.probability}%
              </span>
            </div>
            {prediction.pick.fairOdds && (
              <p className="mt-2 text-[11px] text-silver-500">
                Momio justo ≈ <span className="font-mono font-semibold text-silver-300">{prediction.pick.fairOdds.toFixed(2)}</span>{" "}
                — tómalo solo si la casa paga eso o más.
              </p>
            )}
          </div>
        )}

        {/* Pick de valor: para buscadores de momio. NO cuenta en el tier seguro. */}
        {!isFinished && !isLive && prediction.valuePick && (
          <div className="mt-3 rounded-xl border border-warn-500/25 bg-warn-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-warn-400">
              ⚡ Pick de valor · {prediction.valuePick.market}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <p className="text-sm font-bold text-silver-200">{prediction.valuePick.selection}</p>
              <span className="shrink-0 font-mono text-lg font-bold text-warn-400">
                {prediction.valuePick.probability}%
              </span>
            </div>
            <p className="mt-2 text-[11px] text-silver-500">
              Momio justo ≈{" "}
              <span className="font-mono font-semibold text-silver-300">
                {prediction.valuePick.fairOdds.toFixed(2)}
              </span>{" "}
              — mayor pago, mayor riesgo. No forma parte del tier seguro.
            </p>
          </div>
        )}

        <p className="mt-5 text-sm leading-relaxed text-silver-300">{prediction.summary}</p>

        {access?.daysLeft != null && access.tier !== "paid" && (
          <p className="mt-4 rounded-lg bg-pitch-800 px-3 py-2 text-center text-[11px] text-silver-500">
            {access.tier === "dev-open"
              ? "Modo desarrollo: acceso abierto (Supabase sin configurar)"
              : `Te quedan ${access.daysLeft} día${access.daysLeft === 1 ? "" : "s"} de acceso — `}
            {access.tier !== "dev-open" && (
              <Link href="/precios" className="font-semibold text-brand-500 hover:text-brand-400">
                hazte Pro por $9/mes
              </Link>
            )}
          </p>
        )}
      </div>

      {/* Factores */}
      <div className="card-surface p-5 md:p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-silver-400">
          Factores analizados
        </h2>
        <ul className="flex flex-col gap-4">
          {prediction.factors.map((f) => {
            const favorsHome = f.impact > 0;
            const neutral = Math.abs(f.impact) < 0.15;
            const width = Math.min(Math.abs(f.impact) / 3, 1) * 100;
            return (
              <li key={f.key}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-silver-200">{f.label}</span>
                  <span
                    className={`shrink-0 text-[11px] font-semibold ${
                      neutral ? "text-silver-500" : favorsHome ? "text-brand-400" : "text-warn-400"
                    }`}
                  >
                    {neutral ? "Neutral" : `Favorece a ${favorsHome ? homeLabel : awayLabel}`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-pitch-700">
                  <div
                    className={`h-full rounded-full ${neutral ? "bg-pitch-500" : favorsHome ? "bg-brand-500" : "bg-warn-500"}`}
                    style={{ width: `${neutral ? 8 : width}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-silver-500">{f.detail}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
