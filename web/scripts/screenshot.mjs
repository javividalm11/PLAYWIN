import { chromium } from "playwright";

const OUT = "C:/Users/Javi0/AppData/Local/Temp/claude/c--JAVI-PROYECTOS-PLAYWIN/cb29c057-5c62-4c1b-9006-b1ecf9265e10/scratchpad";
const routes = process.argv.slice(2).length
  ? process.argv.slice(2).map((r) => [r.replace(/[\/?=&]/g, "_").replace(/^_/, "") || "home", `http://localhost:3000${r}`])
  : [
      ["home", "http://localhost:3000/"],
      ["partido-real", "http://localhost:3000/partido/401877045"],
      ["buscar", "http://localhost:3000/buscar?q=america"],
    ];

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
page.on("pageerror", (err) => errors.push(String(err)));

for (const [name, url] of routes) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`OK ${name}`);
}

console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join("\n")}` : "NO CONSOLE ERRORS");
await browser.close();
