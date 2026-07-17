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
    <div className="card-surface mx-auto w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-silver-100">
        {isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta"}
      </h1>
      <p className="mt-1.5 text-sm text-silver-500">
        {isLogin
          ? "Entra para continuar con tus análisis."
          : "Regístrate gratis y obtén 2 días extra de acceso completo."}
      </p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-silver-400">
            Correo electrónico
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            className="rounded-xl border border-pitch-600 bg-pitch-800 px-4 py-3 text-sm text-silver-100 outline-none transition-colors placeholder:text-silver-600 focus:border-brand-500/60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-silver-400">
            Contraseña
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="Mínimo 8 caracteres"
            className="rounded-xl border border-pitch-600 bg-pitch-800 px-4 py-3 text-sm text-silver-100 outline-none transition-colors placeholder:text-silver-600 focus:border-brand-500/60"
          />
        </label>

        {error && (
          <p className="rounded-lg border border-risk-500/40 bg-risk-500/10 px-3 py-2 text-sm text-risk-500">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-pitch-950 transition-all hover:bg-brand-400 disabled:opacity-60"
        >
          {pending ? "Un momento…" : isLogin ? "Iniciar sesión" : "Crear cuenta gratis"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-silver-500">
        {isLogin ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold text-brand-500 hover:text-brand-400">
              Regístrate gratis
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-400">
              Inicia sesión
            </Link>
          </>
        )}
      </p>

      {!isLogin && (
        <p className="mt-4 text-center text-[11px] leading-relaxed text-silver-600">
          Al registrarte aceptas nuestros{" "}
          <Link href="/terminos" className="underline hover:text-silver-400">términos</Link> y{" "}
          <Link href="/privacidad" className="underline hover:text-silver-400">privacidad</Link>.
          Servicio para mayores de 18 años.
        </p>
      )}
    </div>
  );
}
