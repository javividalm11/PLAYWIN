import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/access/admin";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { ACCESS_RULES } from "@/lib/access/config";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

function fmt(dt: string | null | undefined): string {
  if (!dt) return "–";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dt));
}

type IpRow = {
  ip: string;
  first_use: string;
  last_use: string;
  total_events: number;
  allowed_events: number;
  distinct_matches: number;
  distinct_fingerprints: number;
  linked_users: number;
};

type UserRow = {
  id: string;
  email: string;
  role: string;
  registered_at: string;
  total_events: number;
  active_days: number;
  last_activity: string | null;
  is_paid: boolean;
};

function trialState(firstUse: string, linkedUsers: number): { label: string; cls: string } {
  const days = (Date.now() - new Date(firstUse).getTime()) / DAY_MS;
  if (linkedUsers > 0) return { label: "Registrado", cls: "bg-brand-500/15 text-brand-400" };
  if (days < ACCESS_RULES.anonTrialDays) {
    return {
      label: `Trial · día ${Math.floor(days) + 1}/${ACCESS_RULES.anonTrialDays}`,
      cls: "bg-warn-500/15 text-warn-400",
    };
  }
  return { label: "Trial expirado", cls: "bg-risk-500/15 text-risk-500" };
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-silver-500">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-silver-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-silver-600">{hint}</p>}
    </div>
  );
}

export default async function AdminPage() {
  if (!(await isCurrentUserAdmin())) {
    // Configuración incompleta: mostramos guía solo en desarrollo local
    if (!isSupabaseConfigured() && process.env.NODE_ENV === "development") {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="card-surface p-8">
            <h1 className="text-xl font-bold text-silver-100">⚙️ Dashboard admin — pendiente de configurar</h1>
            <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-silver-400">
              <li>Crea el proyecto en supabase.com y ejecuta <code className="rounded bg-pitch-700 px-1.5 py-0.5 text-brand-400">supabase/schema.sql</code> en el SQL Editor.</li>
              <li>Copia <code className="rounded bg-pitch-700 px-1.5 py-0.5 text-brand-400">.env.example</code> a <code className="rounded bg-pitch-700 px-1.5 py-0.5 text-brand-400">.env.local</code> y pega URL + llaves.</li>
              <li>Regístrate en la app con un correo listado en <code className="rounded bg-pitch-700 px-1.5 py-0.5 text-brand-400">ADMIN_EMAILS</code>.</li>
              <li>Vuelve a <code className="rounded bg-pitch-700 px-1.5 py-0.5 text-brand-400">/admin</code>.</li>
            </ol>
          </div>
        </div>
      );
    }
    notFound();
  }

  const db = getAdminSupabase();
  if (!db || !isServiceRoleConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="card-surface p-8 text-sm text-silver-400">
          Falta <code className="rounded bg-pitch-700 px-1.5 py-0.5 text-brand-400">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          en .env.local para leer las métricas.
        </div>
      </div>
    );
  }

  const since24h = new Date(Date.now() - DAY_MS).toISOString();
  const [ipStats, userStats, eventsToday, subsActive] = await Promise.all([
    db.from("admin_ip_stats").select("*").order("last_use", { ascending: false }).limit(100),
    db.from("admin_user_stats").select("*").order("registered_at", { ascending: false }).limit(100),
    db.from("service_events").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    db.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const ips = (ipStats.data ?? []) as IpRow[];
  const users = (userStats.data ?? []) as UserRow[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-silver-100">📊 Dashboard PLAYWIN</h1>
      <p className="mt-1 text-sm text-silver-500">
        Uso real del servicio: solo cuentan los clics en escanear / pronóstico, no las visitas.
      </p>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Análisis últimas 24h" value={eventsToday.count ?? 0} />
        <Kpi label="IPs que usan el servicio" value={ips.length} hint="históricas (top 100)" />
        <Kpi label="Usuarios registrados" value={users.length} />
        <Kpi
          label="Suscriptores activos"
          value={subsActive.count ?? 0}
          hint={`≈ $${(subsActive.count ?? 0) * ACCESS_RULES.monthlyPriceUsd} USD/mes`}
        />
      </div>

      {/* IPs */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-silver-200">🌐 IPs que consumen el servicio</h2>
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-175 text-left text-sm">
            <thead>
              <tr className="border-b border-pitch-600 text-xs uppercase tracking-wider text-silver-500">
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Primer uso</th>
                <th className="px-4 py-3">Último uso</th>
                <th className="px-4 py-3 text-right">Análisis</th>
                <th className="px-4 py-3 text-right">Partidos</th>
                <th className="px-4 py-3 text-right">Huellas</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ips.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-silver-600">
                    Aún no hay uso del servicio registrado.
                  </td>
                </tr>
              )}
              {ips.map((r) => {
                const st = trialState(r.first_use, r.linked_users);
                return (
                  <tr key={r.ip} className="border-b border-pitch-700/60 text-silver-300">
                    <td className="px-4 py-2.5 font-mono text-silver-100">{r.ip}</td>
                    <td className="px-4 py-2.5 text-silver-400">{fmt(r.first_use)}</td>
                    <td className="px-4 py-2.5 text-silver-400">{fmt(r.last_use)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.total_events}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.distinct_matches}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.distinct_fingerprints}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Usuarios */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-silver-200">👤 Usuarios registrados</h2>
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-175 text-left text-sm">
            <thead>
              <tr className="border-b border-pitch-600 text-xs uppercase tracking-wider text-silver-500">
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Registrado</th>
                <th className="px-4 py-3 text-right">Días activos</th>
                <th className="px-4 py-3 text-right">Análisis</th>
                <th className="px-4 py-3">Última actividad</th>
                <th className="px-4 py-3">Pago</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-silver-600">
                    Aún no hay usuarios registrados.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-pitch-700/60 text-silver-300">
                  <td className="px-4 py-2.5 text-silver-100">
                    {u.email}
                    {u.role === "admin" && (
                      <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold text-brand-400">
                        ADMIN
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-silver-400">{fmt(u.registered_at)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{u.active_days}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{u.total_events}</td>
                  <td className="px-4 py-2.5 text-silver-400">{fmt(u.last_activity)}</td>
                  <td className="px-4 py-2.5">
                    {u.is_paid ? (
                      <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-400">
                        ✓ Pagado
                      </span>
                    ) : (
                      <span className="rounded-full bg-pitch-700 px-2.5 py-0.5 text-[11px] font-semibold text-silver-500">
                        Sin pago
                      </span>
                    )}
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
