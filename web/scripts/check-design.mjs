/**
 * Captura las páginas clave y reporta errores de consola.
 * Requiere el dev server en marcha: npm run dev
 *   node scripts/check-design.mjs            -> todas las rutas, escritorio + móvil
 *   node scripts/check-design.mjs /precios   -> solo esa ruta
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = ".screenshots";
const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/partidos", "/en-vivo", "/picks", "/resultados", "/precios", "/dashboard", "/buscar", "/login"];

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
let failures = 0;

for (const route of ROUTES) {
  for (const view of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: view.width, height: view.height } });
    const problems = [];
    page.on("pageerror", e => problems.push(`JS: ${e.message}`));
    page.on("console", msg => { if (msg.type() === "error") problems.push(`console: ${msg.text()}`); });

    const slug = route === "/" ? "home" : route.replace(/\//g, "-").replace(/^-/, "");
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60000 });
    } catch {
      await page.waitForTimeout(1500); // networkidle no llega si hay polling en vivo
    }
    // animations:"disabled" congela las animaciones infinitas del hero,
    // que si no impiden que la captura se estabilice.
    await page.screenshot({
      path: `${OUT}/${slug}-${view.tag}.png`,
      fullPage: false, // fullPage se cuelga con el fondo fijo del body
      animations: "disabled",
      caret: "hide",
      timeout: 60000,
    });

    // El body nunca debe desbordar horizontalmente.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) problems.push(`desbordamiento horizontal: ${overflow}px`);

    if (problems.length) failures++;
    console.log(`${problems.length ? "✗" : "✓"} ${route} (${view.tag})${problems.length ? "\n    " + problems.join("\n    ") : ""}`);
    await page.close();
  }
}

// El menú móvil se abre y se cierra.
const menu = await browser.newPage({ viewport: { width: 390, height: 844 } });
await menu.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
await menu.getByRole("button", { name: "Abrir menú" }).click();
await menu.screenshot({ path: `${OUT}/menu-mobile.png` });
await menu.getByRole("button", { name: "Cerrar menú" }).click();
console.log("✓ menú móvil abre y cierra");
await menu.close();

await browser.close();
console.log(failures ? `\n${failures} vista(s) con incidencias.` : `\nTodo limpio. Capturas en ${OUT}/`);
process.exit(failures ? 1 : 0);
