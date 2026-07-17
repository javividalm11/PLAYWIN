/** Config compartida de Supabase. Todo el código debe funcionar sin llaves
 *  (modo dev): las features de auth/trial se degradan con avisos claros. */

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
}

export function supabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined;
}

export function supabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseServiceKey());
}
