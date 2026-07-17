import "server-only";
import { headers, cookies } from "next/headers";
import { getAdminSupabase, getCurrentUser } from "@/lib/supabase/server";
import { ACCESS_RULES, type AccessResult } from "./config";

const DAY_MS = 86_400_000;

export type RequestIdentity = {
  ip: string;
  fingerprint: string | null;
  userId: string | null;
  userEmail: string | null;
  userAgent: string | null;
};

/** Identidad del request actual: IP (x-forwarded-for), cookie pw_fp y sesión. */
export async function getRequestIdentity(): Promise<RequestIdentity> {
  const h = await headers();
  const c = await cookies();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "127.0.0.1";
  const user = await getCurrentUser();
  return {
    ip,
    fingerprint: c.get("pw_fp")?.value ?? null,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userAgent: h.get("user-agent"),
  };
}

/**
 * Regla de acceso PLAYWIN:
 *  1. Suscripción activa → acceso pleno.
 *  2. Registrado → hasta max(inicio anónimo + 3d, registro) + 2d.
 *  3. Anónimo → 3 días desde el PRIMER uso de servicio visto para su IP
 *     o su fingerprint (el reloj más antiguo manda: cambiar de red o
 *     borrar cookies no reinicia el trial).
 *  Sin Supabase configurado → todo abierto (modo dev).
 */
export async function checkAccess(identity: RequestIdentity): Promise<AccessResult> {
  const db = getAdminSupabase();
  if (!db) {
    return { allowed: true, tier: "dev-open", daysLeft: null, nextStep: "none" };
  }

  const now = Date.now();
  const keys = [
    `ip:${identity.ip}`,
    ...(identity.fingerprint ? [`fp:${identity.fingerprint}`] : []),
  ];

  // ── Registrar/leer primer uso de IP y fingerprint (upsert) ──
  const { data: existing } = await db
    .from("access_keys")
    .select("key, first_seen_at")
    .in("key", keys);

  const missing = keys.filter((k) => !existing?.some((e) => e.key === k));
  if (missing.length) {
    await db
      .from("access_keys")
      .upsert(missing.map((key) => ({ key })), { onConflict: "key", ignoreDuplicates: true });
  }
  // last_seen (best effort; los conteos reales salen de service_events)
  await db
    .from("access_keys")
    .update({ last_seen_at: new Date(now).toISOString() })
    .in("key", keys);

  const firstSeen = Math.min(
    now,
    ...(existing ?? []).map((e) => new Date(e.first_seen_at).getTime()),
  );
  const anonExpiry = firstSeen + ACCESS_RULES.anonTrialDays * DAY_MS;

  // ── ¿Pagado? ──
  if (identity.userId) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", identity.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (
      sub &&
      (!sub.current_period_end || new Date(sub.current_period_end).getTime() > now)
    ) {
      const daysLeft = sub.current_period_end
        ? Math.ceil((new Date(sub.current_period_end).getTime() - now) / DAY_MS)
        : null;
      return { allowed: true, tier: "paid", daysLeft, nextStep: "none" };
    }

    // ── Registrado: +2 días desde max(fin trial anónimo, registro) ──
    const { data: profile } = await db
      .from("profiles")
      .select("created_at")
      .eq("id", identity.userId)
      .maybeSingle();
    const regAt = profile ? new Date(profile.created_at).getTime() : now;
    const regExpiry =
      Math.max(anonExpiry, regAt) + ACCESS_RULES.registeredExtraDays * DAY_MS;
    if (now < regExpiry) {
      return {
        allowed: true,
        tier: "registered-trial",
        daysLeft: Math.max(1, Math.ceil((regExpiry - now) / DAY_MS)),
        nextStep: "none",
      };
    }
    return { allowed: false, tier: "denied", daysLeft: 0, nextStep: "subscribe" };
  }

  // ── Anónimo ──
  if (now < anonExpiry) {
    return {
      allowed: true,
      tier: "anon-trial",
      daysLeft: Math.max(1, Math.ceil((anonExpiry - now) / DAY_MS)),
      nextStep: "none",
    };
  }
  return { allowed: false, tier: "denied", daysLeft: 0, nextStep: "register" };
}

/** Registra el evento de servicio (alimenta el dashboard admin y el historial). */
export async function logServiceEvent(
  identity: RequestIdentity,
  action: "predict" | "live",
  matchId: string,
  result: AccessResult,
  matchLabel?: string,
): Promise<void> {
  const db = getAdminSupabase();
  if (!db) {
    console.log(
      `[service:${action}] ip=${identity.ip} fp=${identity.fingerprint ?? "-"} user=${identity.userEmail ?? "anon"} match=${matchId} tier=${result.tier} allowed=${result.allowed}`,
    );
    return;
  }
  const row: Record<string, unknown> = {
    action,
    match_id: matchId,
    ip: identity.ip,
    fingerprint: identity.fingerprint,
    user_id: identity.userId,
    allowed: result.allowed,
    tier: result.tier,
    user_agent: identity.userAgent?.slice(0, 300) ?? null,
  };
  const { error } = await db
    .from("service_events")
    .insert(matchLabel ? { ...row, match_label: matchLabel } : row);
  // Fallback: si la columna match_label aún no existe (migración 001 pendiente)
  if (error && matchLabel && error.message.includes("match_label")) {
    await db.from("service_events").insert(row);
  }
}

/** Comprueba acceso sin registrar (el registro se hace con logServiceEvent,
 *  idealmente después de obtener el análisis para incluir el nombre del partido). */
export async function gateServiceAction(
  _action: "predict" | "live",
  _matchId: string,
): Promise<{ identity: RequestIdentity; result: AccessResult }> {
  const identity = await getRequestIdentity();
  const result = await checkAccess(identity);
  return { identity, result };
}
