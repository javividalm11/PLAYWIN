"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Cambio de contraseña (requiere sesión activa). */
export function PasswordForm() {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 8) {
      setMsg({ ok: false, text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (password !== confirm) {
      setMsg({ ok: false, text: "Las contraseñas no coinciden." });
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setMsg({ ok: false, text: "Autenticación no configurada." });
      return;
    }

    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMsg({
          ok: false,
          text: error.message.includes("different from the old")
            ? "La nueva contraseña debe ser distinta a la actual."
            : error.message,
        });
        return;
      }
      setMsg({ ok: true, text: "Contraseña actualizada ✓" });
      (e.target as HTMLFormElement).reset();
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
          Nueva contraseña
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-silver-400">
          Confirmar contraseña
        </span>
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repite la contraseña"
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
        {pending ? "Actualizando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
