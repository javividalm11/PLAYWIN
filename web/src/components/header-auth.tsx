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
      setSession(null);
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
    return <div className="h-9 w-40 animate-pulse rounded-lg bg-pitch-700/60" aria-hidden />;
  }

  if (session) {
    const label = session.displayName || session.email;
    const initial = label.charAt(0).toUpperCase();
    return (
      <div className="flex items-center gap-2">
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
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
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
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium text-silver-300 transition-colors hover:bg-pitch-700 hover:text-white"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/registro"
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-pitch-950 transition-all hover:bg-brand-400 hover:glow-brand"
      >
        Probar gratis
      </Link>
    </div>
  );
}
