/**
 * GET  /api/profile — preferencias del usuario actual.
 * POST /api/profile — guarda preferencias (validadas server-side).
 * El rol y demás campos NUNCA se tocan desde aquí.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, getCurrentUser } from "@/lib/supabase/server";
import { LEAGUE_NAMES } from "@/lib/data/league-names";

export type UserPreferences = {
  favoriteLeagues?: string[]; // ids de liga ESPN
  favoriteTeam?: string;
};

function sanitize(input: unknown): UserPreferences {
  const raw = (input ?? {}) as Record<string, unknown>;
  const prefs: UserPreferences = {};
  if (Array.isArray(raw.favoriteLeagues)) {
    prefs.favoriteLeagues = raw.favoriteLeagues
      .filter((id): id is string => typeof id === "string" && id in LEAGUE_NAMES)
      .slice(0, 12);
  }
  if (typeof raw.favoriteTeam === "string") {
    prefs.favoriteTeam = raw.favoriteTeam.trim().slice(0, 60);
  }
  return prefs;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });
  const db = getAdminSupabase();
  if (!db) return NextResponse.json({ error: "no_configurado" }, { status: 503 });

  const { data } = await db
    .from("profiles")
    .select("preferences, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json({
    email: user.email,
    preferences: data?.preferences ?? {},
    displayName: data?.display_name ?? null,
    avatarUrl: data?.avatar_url ?? null,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });
  const db = getAdminSupabase();
  if (!db) return NextResponse.json({ error: "no_configurado" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }
  const raw = body as { preferences?: unknown; displayName?: unknown };
  const preferences = sanitize(raw.preferences);
  const displayName =
    typeof raw.displayName === "string" ? raw.displayName.trim().slice(0, 40) || null : undefined;

  const update: Record<string, unknown> = { preferences };
  if (displayName !== undefined) update.display_name = displayName;

  const { error } = await db.from("profiles").update(update).eq("id", user.id);
  if (error) {
    // Columna inexistente → falta la migración 001
    const hint = /preferences|display_name/.test(error.message)
      ? "Falta ejecutar supabase/migrations/001-perfil.sql"
      : error.message;
    return NextResponse.json({ error: hint }, { status: 500 });
  }
  return NextResponse.json({ ok: true, preferences, displayName });
}
