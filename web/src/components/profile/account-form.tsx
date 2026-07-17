"use client";

import { useState } from "react";

/** Ajustes de cuenta: nombre para mostrar y equipo favorito. */
export function AccountForm({
  initialDisplayName,
  initialFavoriteTeam,
}: {
  initialDisplayName: string;
  initialFavoriteTeam: string;
}) {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: String(form.get("displayName") ?? ""),
          preferences: { favoriteTeam: String(form.get("favoriteTeam") ?? "") },
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: body.error ?? "No se pudo guardar" });
        return;
      }
      setMsg({ ok: true, text: "Ajustes guardados ✓" });
    } catch {
      setMsg({ ok: false, text: "Error de conexión" });
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "rounded-xl border border-pitch-600 bg-pitch-800 px-4 py-3 text-sm text-silver-100 outline-none transition-colors placeholder:text-silver-600 focus:border-brand-500/60";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-silver-400">
          Nombre para mostrar
        </span>
        <input
          type="text"
          name="displayName"
          defaultValue={initialDisplayName}
          maxLength={40}
          placeholder="Tu nombre o apodo"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-silver-400">
          Equipo favorito
        </span>
        <input
          type="text"
          name="favoriteTeam"
          defaultValue={initialFavoriteTeam}
          maxLength={60}
          placeholder="Ej. Real Madrid, América, Boca Juniors…"
          className={inputCls}
        />
      </label>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-brand-400" : "text-risk-500"}`}>{msg.text}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-pitch-950 transition-all hover:bg-brand-400 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar ajustes"}
      </button>
    </form>
  );
}
