"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: {
        open: (opts: {
          items: Array<{ priceId: string; quantity: number }>;
          customData?: Record<string, string>;
          customer?: { email?: string };
        }) => void;
      };
    };
  }
}

let paddleLoaded = false;

async function loadPaddle(): Promise<boolean> {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) return false;
  if (paddleLoaded && window.Paddle) return true;

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar Paddle"));
    document.head.appendChild(s);
  });

  const env = process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox";
  if (env === "sandbox") window.Paddle?.Environment.set("sandbox");
  window.Paddle?.Initialize({ token });
  paddleLoaded = true;
  return true;
}

/** Botón "Suscribirme": abre el checkout de Paddle con el user_id en customData. */
export function PaddleCheckout({ label = "Suscribirme" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
  );

  async function onClick() {
    setMsg(null);
    setBusy(true);
    try {
      // Debe haber sesión: la suscripción se liga al user_id
      const supabase = getBrowserSupabase();
      const user = supabase ? (await supabase.auth.getUser()).data.user : null;
      if (!user) {
        router.push("/registro?plan=pro");
        return;
      }
      if (!(await loadPaddle())) {
        setMsg("Los pagos están en configuración. Vuelve pronto.");
        return;
      }
      window.Paddle!.Checkout.open({
        items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!, quantity: 1 }],
        customData: { user_id: user.id },
        customer: user.email ? { email: user.email } : undefined,
      });
    } catch {
      setMsg("No se pudo abrir el checkout. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={() => void onClick()}
        disabled={busy}
        className="rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-bold text-pitch-950 transition-all hover:bg-brand-400 disabled:opacity-60"
      >
        {busy ? "Abriendo checkout…" : label}
      </button>
      {!configured && (
        <p className="mt-2 text-center text-[11px] text-silver-600">
          (Checkout pendiente de configurar: NEXT_PUBLIC_PADDLE_*)
        </p>
      )}
      {msg && <p className="mt-2 text-center text-xs text-warn-400">{msg}</p>}
    </div>
  );
}
