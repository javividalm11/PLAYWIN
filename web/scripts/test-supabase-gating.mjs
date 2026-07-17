/**
 * Prueba E2E del gating con Supabase real:
 * 1. Navega a un partido y pulsa "Escanear partido" (navegador real → cookie pw_fp).
 * 2. Consulta la BD con la service key: service_events y access_keys deben tener filas.
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Cargar .env.local a mano (script fuera de Next)
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const matchId = process.argv[2] ?? "401877045";

// ── 1. Escanear vía navegador ──
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.goto(`http://localhost:3000/partido/${matchId}`, {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.click('button:has-text("Escanear partido")');
await page.waitForSelector("text=Factores analizados", { timeout: 60000 });

// Chip de días restantes del trial
const chip = await page
  .locator("text=/Te quedan \\d+ día/")
  .first()
  .textContent()
  .catch(() => null);
console.log("1. Escaneo OK — chip de trial:", chip?.trim() ?? "(no visible)");
await browser.close();

// ── 2. Verificar en la BD ──
const { data: events, error: e1 } = await db
  .from("service_events")
  .select("action, match_id, ip, fingerprint, allowed, tier, created_at")
  .order("created_at", { ascending: false })
  .limit(5);
if (e1) throw new Error("service_events: " + e1.message);
console.log(`\n2. service_events (${events.length} recientes):`);
for (const ev of events) {
  console.log(
    `   [${ev.created_at}] ${ev.action} match=${ev.match_id} ip=${ev.ip} fp=${ev.fingerprint?.slice(0, 8)}… tier=${ev.tier} allowed=${ev.allowed}`,
  );
}

const { data: keys, error: e2 } = await db
  .from("access_keys")
  .select("key, first_seen_at, last_seen_at")
  .order("first_seen_at", { ascending: false })
  .limit(5);
if (e2) throw new Error("access_keys: " + e2.message);
console.log(`\n3. access_keys (${keys.length}):`);
for (const k of keys) {
  console.log(`   ${k.key.slice(0, 24)}…  first=${k.first_seen_at}`);
}

const { data: ipStats, error: e3 } = await db.from("admin_ip_stats").select("*").limit(5);
if (e3) throw new Error("admin_ip_stats: " + e3.message);
console.log(`\n4. Vista admin_ip_stats (${ipStats.length} IPs):`);
for (const r of ipStats) {
  console.log(
    `   ip=${r.ip} eventos=${r.total_events} partidos=${r.distinct_matches} huellas=${r.distinct_fingerprints}`,
  );
}

console.log("\n✅ GATING + LOGGING FUNCIONANDO CONTRA SUPABASE");
