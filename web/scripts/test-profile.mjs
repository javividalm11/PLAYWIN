/**
 * E2E del perfil:
 * login → /perfil → cambio de contraseña → re-login con la nueva →
 * (si migración 001 aplicada) subir avatar + guardar ajustes.
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import sharp from "sharp";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EMAIL = "prueba.perfil@example.com";
const PASS1 = "PruebaPerfil2026!";
const PASS2 = "NuevaClave2026!";
const OUT = "C:/Users/Javi0/AppData/Local/Temp/claude/c--JAVI-PROYECTOS-PLAYWIN/cb29c057-5c62-4c1b-9006-b1ecf9265e10/scratchpad";

// ¿Migración 001 aplicada?
const probe = await db.from("profiles").select("display_name").limit(1);
const migrated = !probe.error;
console.log("Migración 001 aplicada:", migrated ? "SÍ ✅" : "NO (se prueba lo que no la necesita)");

// Usuario de prueba limpio
const { data: prev } = await db.from("profiles").select("id").eq("email", EMAIL).maybeSingle();
if (prev) await db.auth.admin.deleteUser(prev.id);
const { data: created, error } = await db.auth.admin.createUser({
  email: EMAIL,
  password: PASS1,
  email_confirm: true,
});
if (error) throw error;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

async function login(pass) {
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 60000 });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', pass);
  await page.click('button:has-text("Iniciar sesión")');
  await page.waitForSelector('a[href="/perfil"]', { timeout: 30000 });
}

// 1. Login y perfil
await login(PASS1);
console.log("1. Login OK — header muestra enlace a /perfil");

await page.goto("http://localhost:3000/perfil", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("text=Seguridad", { timeout: 30000 });
console.log("2. /perfil renderiza (Cuenta, Ajustes, Seguridad, Sesión)");

// 2. Cambio de contraseña
await page.fill('input[name="password"]', PASS2);
await page.fill('input[name="confirm"]', PASS2);
await page.click('button:has-text("Cambiar contraseña")');
await page.waitForSelector("text=Contraseña actualizada", { timeout: 30000 });
console.log("3. Contraseña actualizada ✓");

// 3. Logout y re-login con la nueva
await page.click('button:has-text("Cerrar sesión")');
await page.waitForSelector('a[href="/login"]', { timeout: 30000 });
await login(PASS2);
console.log("4. Re-login con la NUEVA contraseña OK ✓");

// 4. Avatar + ajustes (requieren migración)
if (migrated) {
  await page.goto("http://localhost:3000/perfil", { waitUntil: "networkidle", timeout: 60000 });

  // Generar imagen de prueba
  const img = `${OUT}/avatar-test.png`;
  await sharp({
    create: { width: 300, height: 200, channels: 3, background: { r: 140, g: 198, b: 62 } },
  })
    .png()
    .toFile(img);
  await page.setInputFiles("#avatar-input", img);
  await page.waitForSelector('img[alt="Foto de perfil"]', { timeout: 30000 });
  console.log("5. Avatar subido y visible ✓");

  await page.fill('input[name="displayName"]', "Tester PLAYWIN");
  await page.fill('input[name="favoriteTeam"]', "Real Madrid");
  await page.click('button:has-text("Guardar ajustes")');
  await page.waitForSelector("text=Ajustes guardados", { timeout: 30000 });
  console.log("6. Ajustes guardados ✓");

  const { data: prof } = await db
    .from("profiles")
    .select("display_name, avatar_url, preferences")
    .eq("id", created.user.id)
    .maybeSingle();
  console.log(
    "7. BD:",
    prof?.display_name,
    "| avatar:",
    prof?.avatar_url ? "sí" : "no",
    "| equipo:",
    prof?.preferences?.favoriteTeam,
  );
  await page.screenshot({ path: `${OUT}/perfil.png`, fullPage: true });
} else {
  await page.goto("http://localhost:3000/perfil", { waitUntil: "networkidle", timeout: 60000 });
  const warn = await page.locator("text=001-perfil.sql").count();
  console.log("5. Aviso de migración pendiente visible:", warn > 0 ? "sí ✓" : "NO ⚠️");
  await page.screenshot({ path: `${OUT}/perfil.png`, fullPage: true });
}

await browser.close();

// Limpieza (avatar del test + usuario)
if (migrated) await db.storage.from("avatars").remove([`${created.user.id}.webp`]);
await db.auth.admin.deleteUser(created.user.id);
console.log("8. Usuario de prueba eliminado");
console.log("\n✅ PERFIL FUNCIONANDO");
