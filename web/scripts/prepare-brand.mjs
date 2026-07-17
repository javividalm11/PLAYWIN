/**
 * Prepara los assets de marca PLAYWIN a partir de /assets:
 *  - wordmark.png : franja "PLAYWIN — ANALIZADOR DE APUESTAS" (para el header)
 *  - emblem.png   : emblema PW recortado (avatares, loaders)
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

const logotext = path.join(assets, "logotext.png");
const logo = path.join(assets, "logo.png");

const { width: W, height: H } = await sharp(logotext).metadata();
console.log(`logotext: ${W}x${H}`);

// Región del wordmark (texto PLAYWIN + tagline) — fracciones sobre la imagen original
const wm = {
  left: Math.round(W * 0.1),
  top: Math.round(H * 0.672),
  width: Math.round(W * 0.8),
  height: Math.round(H * 0.225),
};
await sharp(logotext)
  .extract(wm)
  .resize({ height: 120 }) // 2x retina para header de ~56px
  .png()
  .toFile(path.join(outBrand, "wordmark.png"));

// Emblema PW (círculo superior)
const em = {
  left: Math.round(W * 0.17),
  top: Math.round(H * 0.09),
  width: Math.round(W * 0.66),
  height: Math.round(H * 0.57),
};
await sharp(logotext)
  .extract(em)
  .resize({ width: 512 })
  .png()
  .toFile(path.join(outBrand, "emblem.png"));

// Favicon desde logo.png (recorte central para acercar el emblema)
const meta = await sharp(logo).metadata();
const s = Math.round(Math.min(meta.width, meta.height) * 0.72);
await sharp(logo)
  .extract({
    left: Math.round((meta.width - s) / 2),
    top: Math.round((meta.height - s) / 2),
    width: s,
    height: s,
  })
  .resize(64, 64)
  .png()
  .toFile(path.join(outApp, "icon.png"));

console.log("OK: wordmark.png, emblem.png, icon.png generados");
