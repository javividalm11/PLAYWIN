import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSupabase, getCurrentUser } from "@/lib/supabase/server";
import { getRequestIdentity, checkAccess } from "@/lib/access/gate";
import { ACCESS_RULES } from "@/lib/access/config";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { AccountForm } from "@/components/profile/account-form";
import { PasswordForm } from "@/components/profile/password-form";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

function fmt(dt: string | null | undefined): string {
  if (!dt) return "–";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dt));
}

type HistoryRow = {
  id: number;
  created_at: string;
  action: string;
  match_id: string;
  match_label?: string | null;
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getAdminSupabase();

  // Perfil (tolerante a migración 001 pendiente)
  let displayName = "";
  let avatarUrl: string | null = null;
  let favoriteTeam = "";
  let memberSince: string | null = null;
  let migrationPending = false;

  if (db) {
    const full = await db
      .from("profiles")
      .select("created_at, display_name, avatar_url, preferences")
      .eq("id", user.id)
      .maybeSingle();
    if (full.error) {
      migrationPending = true;
      const basic = await db
        .from("profiles")
        .select("created_at")
        .eq("id", user.id)
        .maybeSingle();
      memberSince = basic.data?.created_at ?? null;
    } else {
      memberSince = full.data?.created_at ?? null;
      displayName = full.data?.display_name ?? "";
      avatarUrl = full.data?.avatar_url ?? null;
      favoriteTeam =
        (full.data?.preferences as { favoriteTeam?: string } | null)?.favoriteTeam ?? "";
    }
  }

  // Estado de acceso (trial / pro)
  const identity = await getRequestIdentity();
  const access = await checkAccess(identity);
  const accessLabel =
    access.tier === "paid"
      ? `⭐ PLAYWIN Pro${access.daysLeft ? ` · ${access.daysLeft} días restantes` : ""}`
      : access.tier === "registered-trial"
        ? `🎁 Prueba de registro · ${access.daysLeft} día${access.daysLeft === 1 ? "" : "s"} restante${access.daysLeft === 1 ? "" : "s"}`
        : access.tier === "anon-trial"
          ? `🎁 Prueba gratuita · ${access.daysLeft} días restantes`
          : access.tier === "dev-open"
            ? "Modo desarrollo"
            : "Acceso expirado";

  // Historial de análisis
  let history: HistoryRow[] = [];
  if (db) {
    const h = await db
      .from("service_events")
      .select("id, created_at, action, match_id, match_label")
      .eq("user_id", user.id)
      .eq("action", "predict")
      .order("created_at", { ascending: false })
      .limit(15);
    if (h.error) {
      const h2 = await db
        .from("service_events")
        .select("id, created_at, action, match_id")
        .eq("user_id", user.id)
        .eq("action", "predict")
        .order("created_at", { ascending: false })
        .limit(15);
      history = (h2.data ?? []) as HistoryRow[];
    } else {
      history = (h.data ?? []) as HistoryRow[];
    }
  }

  const initial = (displayName || user.email || "?").charAt(0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-silver-100">Mi perfil</h1>
      <p className="mt-1 text-sm text-silver-500">
        Ajustes de tu cuenta, seguridad e historial de análisis.
      </p>

      {migrationPending && (
        <div className="mt-6 rounded-xl border border-warn-500/40 bg-warn-500/10 p-4 text-sm text-warn-400">
          ⚠️ Falta ejecutar <code className="rounded bg-pitch-700 px-1.5 py-0.5">supabase/migrations/001-perfil.sql</code>{" "}
          en el SQL Editor de Supabase para activar foto, nombre y ajustes.
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* ── Cuenta ── */}
        <div className="card-surface p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-silver-400">
            Cuenta
          </h2>
          <AvatarUploader initialUrl={avatarUrl} fallbackInitial={initial} />
          <dl className="mt-6 flex flex-col gap-2.5 border-t border-pitch-700 pt-5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-silver-500">Correo</dt>
              <dd className="truncate text-silver-200">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-silver-500">Miembro desde</dt>
              <dd className="text-silver-200">{fmt(memberSince)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-silver-500">Plan</dt>
              <dd className="font-semibold text-brand-400">{accessLabel}</dd>
            </div>
          </dl>
          {access.tier !== "paid" && access.tier !== "dev-open" && (
            <Link
              href="/precios"
              className="mt-5 block rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-center text-sm font-bold text-brand-400 transition-colors hover:bg-brand-500/20"
            >
              Hazte Pro — $9 USD/mes
            </Link>
          )}
        </div>

        {/* ── Ajustes ── */}
        <div className="card-surface p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-silver-400">
            Ajustes
          </h2>
          <AccountForm initialDisplayName={displayName} initialFavoriteTeam={favoriteTeam} />
        </div>

        {/* ── Seguridad ── */}
        <div className="card-surface p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-silver-400">
            Seguridad
          </h2>
          <PasswordForm />
        </div>

        {/* ── Sesión ── */}
        <div className="card-surface p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-silver-400">
            Sesión
          </h2>
          <p className="text-sm text-silver-500">
            Cierra tu sesión en este dispositivo. Tus días de acceso se conservan.
          </p>
          <form action="/auth/signout" method="post" className="mt-4">
            <button
              type="submit"
              className="rounded-xl border border-risk-500/40 px-6 py-2.5 text-sm font-semibold text-risk-500 transition-colors hover:bg-risk-500/10"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {/* ── Historial ── */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-silver-200">📜 Mis análisis recientes</h2>
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-120 text-left text-sm">
            <thead>
              <tr className="border-b border-pitch-600 text-xs uppercase tracking-wider text-silver-500">
                <th className="px-4 py-3">Partido</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-silver-600">
                    Aún no has escaneado ningún partido con esta cuenta.{" "}
                    <Link href="/partidos" className="font-semibold text-brand-500 hover:text-brand-400">
                      Explora los de hoy →
                    </Link>
                  </td>
                </tr>
              )}
              {history.map((h) => (
                <tr key={h.id} className="border-b border-pitch-700/60 text-silver-300">
                  <td className="px-4 py-2.5 text-silver-100">
                    {h.match_label ?? `Partido #${h.match_id}`}
                  </td>
                  <td className="px-4 py-2.5 text-silver-400">{fmt(h.created_at)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/partido/${h.match_id}`}
                      className="text-xs font-semibold text-brand-500 hover:text-brand-400"
                    >
                      Ver análisis →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
