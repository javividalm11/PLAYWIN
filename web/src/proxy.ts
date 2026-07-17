import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const FP_COOKIE = "pw_fp";

/**
 * Proxy (antes middleware):
 *  1. Siembra la cookie de fingerprint `pw_fp` (uuid) en la primera visita —
 *     combinada con la IP alimenta el trial gating.
 *  2. Refresca el token de sesión de Supabase para que los Server
 *     Components siempre vean una sesión válida.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ── 1. Fingerprint cookie ──
  if (!request.cookies.get(FP_COOKIE)?.value) {
    const fp = crypto.randomUUID();
    // También en la request entrante para que este mismo render la vea
    request.cookies.set(FP_COOKIE, fp);
    response = NextResponse.next({ request });
    response.cookies.set(FP_COOKIE, fp, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 400, // ~13 meses (máximo práctico)
      path: "/",
    });
  }

  // ── 2. Refresh de sesión Supabase ──
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });
    // Importante: getUser() valida el JWT y dispara el refresh si expiró
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|icon.png|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
