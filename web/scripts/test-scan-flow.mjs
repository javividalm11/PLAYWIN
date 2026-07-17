/** Prueba E2E del flujo Escanear: página de partido → clic → análisis. */
import { chromium } from "playwright";

const OUT = "C:/Users/Javi0/AppData/Local/Temp/claude/c--JAVI-PROYECTOS-PLAYWIN/cb29c057-5c62-4c1b-9006-b1ecf9265e10/scratchpad";
const matchId = process.argv[2] ?? "401877045";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(`http://localhost:3000/partido/${matchId}`, {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.screenshot({ path: `${OUT}/scan-1-idle.png`, fullPage: false });
console.log("OK estado inicial");

await page.click('button:has-text("Escanear partido")');
await page.waitForSelector("text=Factores analizados", { timeout: 60000 });
await page.screenshot({ path: `${OUT}/scan-2-ready.png`, fullPage: true });
console.log("OK análisis generado");

// Admin en modo dev (sin Supabase) → guía de configuración
await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle", timeout: 60000 });
await page.screenshot({ path: `${OUT}/scan-3-admin.png`, fullPage: false });
console.log("OK admin dev-mode");

console.log(errors.length ? `PAGE ERRORS:\n${errors.join("\n")}` : "NO PAGE ERRORS");
await browser.close();
