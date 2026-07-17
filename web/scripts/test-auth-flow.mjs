/**
 * Prueba del flujo de auth:
 * 1. Crea un usuario de prueba vía admin API (sin gastar correos de confirmación).
 * 2. Verifica que el trigger creó su fila en profiles.
 * 3. Hace login vía UI real y comprueba la sesión en el header.
 * 4. Escanea un partido logueado → el evento debe llevar user_id.
 * 5. Limpia el usuario de prueba.
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EMAIL = "prueba.playwin@example.com";
const PASS = "PruebaPlaywin2026!";

// Limpieza previa si quedó de una corrida anterior
const { data: prev } = await db.from("profiles").select("id").eq("email", EMAIL).maybeSingle();
if (prev) await db.auth.admin.deleteUser(prev.id);

// ── 1. Crear usuario (email confirmado, sin enviar correo) ──
const { data: created, error } = await db.auth.admin.createUser({
  email: EMAIL,
  password: PASS,
  email_confirm: true,
});
if (error) throw new Error("createUser: " + error.message);
console.log("1. Usuario creado:", created.user.email);

// ── 2. Trigger de perfil ──
const { data: profile } = await db
  .from("profiles")
  .select("id, email, role, created_at")
  .eq("id", created.user.id)
  .maybeSingle();
if (!profile) throw new Error("El trigger NO creó el perfil");
console.log("2. Perfil creado por trigger:", profile.email, "| rol:", profile.role);

// ── 3. Login vía UI ──
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 60000 });
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', PASS);
await page.click('button:has-text("Iniciar sesión")');
await page.waitForSelector(`text=${EMAIL}`, { timeout: 30000 });
console.log("3. Login OK — el header muestra la sesión");

// ── 4. Escanear logueado → evento con user_id ──
await page.goto("http://localhost:3000/partido/401877045", {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.click('button:has-text("Escanear partido")');
await page.waitForSelector("text=Factores analizados", { timeout: 60000 });
await browser.close();

const { data: ev } = await db
  .from("service_events")
  .select("user_id, tier, allowed")
  .eq("user_id", created.user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
if (!ev) throw new Error("El evento logueado no registró user_id");
console.log("4. Evento con usuario:", ev.tier, "| allowed:", ev.allowed);

// Vista admin de usuarios
const { data: us } = await db.from("admin_user_stats").select("*").eq("id", created.user.id).maybeSingle();
console.log("5. Vista admin_user_stats:", us?.email, "| eventos:", us?.total_events, "| pagado:", us?.is_paid);

// ── Limpieza ──
await db.auth.admin.deleteUser(created.user.id);
console.log("6. Usuario de prueba eliminado");

console.log("\n✅ AUTH + TRIGGER + SESIÓN + EVENTOS CON USUARIO: TODO OK");
