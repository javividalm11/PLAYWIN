"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

let browserClient: SupabaseClient | null = null;

/** Cliente de navegador (auth). Devuelve null si Supabase no está configurado. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  browserClient ??= createBrowserClient(supabaseUrl()!, supabaseAnonKey()!);
  return browserClient;
}
