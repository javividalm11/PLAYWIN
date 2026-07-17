import "server-only";
import { getAdminSupabase, getCurrentUser } from "@/lib/supabase/server";

/** ¿El usuario actual es admin? (rol en profiles o correo en ADMIN_EMAILS). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (user.email && allowlist.includes(user.email.toLowerCase())) return true;

  const db = getAdminSupabase();
  if (!db) return false;
  const { data } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return data?.role === "admin";
}
