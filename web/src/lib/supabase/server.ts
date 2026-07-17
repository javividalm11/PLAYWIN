import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isServiceRoleConfigured,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseServiceKey,
  supabaseUrl,
} from "./config";

/** Cliente ligado a la sesión del visitante (lee/escribe cookies).
 *  null si Supabase no está configurado. */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl()!, supabaseAnonKey()!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components no pueden escribir cookies: el refresh
          // ocurre en proxy.ts / route handlers.
        }
      },
    },
  });
}

/** Usuario autenticado actual (o null). */
export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Cliente admin (service role): salta RLS. Solo backend. */
export function getAdminSupabase(): SupabaseClient | null {
  if (!isServiceRoleConfigured()) return null;
  return createClient(supabaseUrl()!, supabaseServiceKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
