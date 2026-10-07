/**
 * Prepara los assets de marca PickVerde a partir de /assets/logo.png:
 *  - wordmark.png : logotipo horizontal para header y footer
 *  - emblem.png   : símbolo de check/tendencia
 *  - icon.png     : favicon (app/icon.png, convención de Next)
 * Uso: node scripts/prepare-brand.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "..", "assets");
const outBrand = path.join(root, "public", "brand");
const outApp = path.join(root, "src", "app");

const logo = path.join(assets, "logo.png");

const { width: W, height: H } = await sharp(logo).metadata();
console.log(`logo: ${W}x${H}`);

// Texto PickVerde, sobre negro. mix-blend-screen integra el negro con la UI.
const wm = {
  left: Math.round(W * 0.16),
  top: Math.round(H * 0.64),
  width: Math.round(W * 0.68),
  height: Math.round(H * 0.19),
};
await sharp(logo)
  .extract(wm)
  .resize({ height: 112 })
  .png()
  .toFile(path.join(outBrand, "wordmark.png"));

// Símbolo superior del logotipo.
const em = {
  left: Math.round(W * 0.20),
  top: Math.round(H * 0.17),
  width: Math.round(W * 0.60),
  height: Math.round(H * 0.48),
};
await sharp(logo)
  .extract(em)
  .resize({ width: 640 })
  .png()
  .toFile(path.join(outBrand, "emblem.png"));

// Favicon desde logo.png (recorte central para acercar el emblema)
await sharp(logo)
  .extract(em)
  .resize(64, 64)
  .png()
  .toFile(path.join(outApp, "icon.png"));

console.log("OK: wordmark.png, emblem.png, icon.png generados");
