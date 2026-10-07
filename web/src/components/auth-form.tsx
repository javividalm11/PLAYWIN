"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Formulario de login/registro conectado a Supabase Auth. */
export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError(
        "La autenticación aún no está configurada (faltan las llaves de Supabase en .env.local).",
      );
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(
            error.message === "Invalid login credentials"
              ? "Correo o contraseña incorrectos."
              : error.message,
          );
          return;
        }
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) {
          setError(
            error.message.includes("already registered")
              ? "Ese correo ya tiene cuenta. Inicia sesión."
              : error.message,
          );
          return;
        }
        if (data.session) {
          // Confirmación de correo desactivada → sesión inmediata
          router.push("/");
          router.refresh();
        } else {
          setNotice(
            "¡Cuenta creada! Revisa tu correo y haz clic en el enlace de confirmación para activar tus 2 días extra.",
          );
        }
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-start min-[721px]:w-[min(70vw,520px)] min-[1101px]:w-[min(34vw,620px)] min-[1101px]:min-w-[380px]">
      <span className="auth-mono bg-white/[0.09] px-[clamp(14px,1.1vw,20px)] py-[clamp(9px,0.8vw,14px)] text-[clamp(11px,0.72vw,14px)] font-normal uppercase leading-none tracking-[0.2em] text-white">
        [ {isLogin ? "Acceso" : "Prueba gratis"} ]
      </span>

      <h1 className="auth-display mt-[clamp(28px,3vw,52px)] text-[clamp(44px,6.2vw,104px)] font-[200] leading-[0.95] tracking-[0.03em] text-white">
        PICKVERDE
      </h1>

      <p className="auth-mono mt-[clamp(14px,1.4vw,24px)] text-[clamp(11px,0.94vw,17px)] font-[300] uppercase leading-[1.4] tracking-[0.14em] text-white/60">
        {isLogin ? "Vuelve a tus análisis." : "3 días de acceso completo. Sin tarjeta."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-[clamp(38px,4.6vw,82px)] flex w-full flex-col gap-[clamp(14px,1.3vw,22px)]">
        <label className="w-full">
          <span className="sr-only">Correo electrónico</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Correo"
            className="auth-input auth-display w-full px-[2px] pb-[clamp(12px,1.1vw,18px)] text-[clamp(16px,0.95vw,18px)] font-[300] text-white"
          />
        </label>

        <label className="w-full">
          <span className="sr-only">Contraseña</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={isLogin ? "Contraseña" : "Contraseña (mínimo 8 caracteres)"}
            className="auth-input auth-display w-full px-[2px] pb-[clamp(12px,1.1vw,18px)] text-[clamp(16px,0.95vw,18px)] font-[300] text-white"
          />
        </label>

        {error && (
          <p role="alert" className="auth-mono border-l-2 border-risk-500 bg-risk-500/10 px-4 py-3 text-[12px] leading-[1.5] text-white">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="auth-mono border-l-2 border-brand-500 bg-brand-500/10 px-4 py-3 text-[12px] leading-[1.5] text-white">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="auth-mono w-full bg-white/[0.10] px-5 py-[clamp(17px,1.6vw,27px)] text-[clamp(11px,0.78vw,14px)] font-normal uppercase tracking-[0.22em] text-white transition-colors duration-[250ms] hover:bg-white/[0.17] disabled:opacity-50"
        >
          {pending ? "Un momento…" : isLogin ? "Acceder" : "Crear cuenta"}
        </button>

        <Link
          href={isLogin ? "/registro" : "/login"}
          className="auth-mono w-full bg-white/[0.05] px-5 py-[clamp(17px,1.6vw,27px)] text-center text-[clamp(11px,0.78vw,14px)] font-normal uppercase tracking-[0.22em] text-white/40 transition-colors duration-[250ms] hover:bg-white/[0.09] hover:text-white"
        >
          {isLogin ? "Crear una cuenta" : "Ya tengo cuenta"}
        </Link>
      </form>

      <Link
        href="/precios"
        className="auth-mono mt-[clamp(26px,2.6vw,46px)] self-center text-[clamp(11px,0.74vw,14px)] font-normal uppercase tracking-[0.18em] text-white transition-colors hover:text-white/60 hover:underline hover:underline-offset-4"
      >
        Ver qué incluye el plan
      </Link>
    </div>
  );
}
