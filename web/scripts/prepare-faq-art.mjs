import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/images/faq', { recursive: true });
await sharp('C:/Users/Javi0/.codex/generated_images/01a10d15-9e57-7741-a7d4-9d383106630a/exec-f68b06ae-ed36-441d-8233-4fcb09561717.png').resize({width:1400,withoutEnlargement:true}).webp({quality:90}).toFile('public/images/faq/player-celebration.webp');
