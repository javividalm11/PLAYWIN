"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type SessionInfo =
  | { email: string; displayName: string | null; avatarUrl: string | null }
  | null
  | "loading";

/**
 * Estado de sesión en el header (client-side para no volver dinámicas
 * las páginas estáticas). Con sesión: avatar + nombre → /perfil.
 */
export function HeaderAuth() {
  const [session, setSession] = useState<SessionInfo>("loading");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      // Sin llaves de Supabase no hay sesión posible; se resuelve fuera del
      // cuerpo del efecto para no encadenar renders.
      queueMicrotask(() => setSession(null));
      return;
    }

    async function load() {
      const sb = supabase!;
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user?.email) {
        setSession(null);
        return;
      }
      // RLS "own profile" permite leer el propio perfil con la anon key
      const { data } = await sb
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setSession({
        email: user.email,
        displayName: (data?.display_name as string | null) ?? null,
        avatarUrl: (data?.avatar_url as string | null) ?? null,
      });
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s?.user) setSession(null);
      else void load();
    });

    // El uploader del perfil avisa cuando cambia la foto
    const onAvatar = (e: Event) => {
      const url = (e as CustomEvent<string>).detail;
      setSession((prev) =>
        prev && prev !== "loading" ? { ...prev, avatarUrl: url } : prev,
      );
    };
    window.addEventListener("pw:avatar-updated", onAvatar);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pw:avatar-updated", onAvatar);
    };
  }, []);

  if (session === "loading") {
    return <div className="pv-navbar-auth-loading" aria-hidden><span /><span /></div>;
  }

  if (session) {
    const label = session.displayName || session.email;
    const initial = label.charAt(0).toUpperCase();
    return (
      <div className="pv-navbar-session flex items-center gap-2">
        <Link
          href="/perfil"
          className="flex items-center gap-2.5 rounded-full bg-pitch-700 py-1.5 pl-1.5 pr-4 transition-colors hover:bg-pitch-600"
          title="Mi perfil"
        >
          {session.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL con cache-busting dinámico
            <img
              src={session.avatarUrl}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-pitch-950">
              {initial}
            </span>
          )}
          <span className="hidden max-w-36 truncate text-xs font-medium text-silver-200 sm:block">
            {label}
          </span>
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-silver-400 transition-colors hover:bg-pitch-700 hover:text-white"
          >
            Salir
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pv-navbar-auth-buttons">
      <Link
        href="/login"
        className="pv-navbar-login"
      >
        Acceder
      </Link>
      <Link
        href="/registro"
        className="pv-navbar-trial"
      >
        Probar gratis<svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>
    </div>
  );
}
