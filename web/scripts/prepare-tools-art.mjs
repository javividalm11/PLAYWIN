import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/images/tools', { recursive: true });
await sharp('C:/Users/Javi0/.codex/generated_images/01a10d15-9e57-7741-a7d4-9d383106630a/exec-8cb847d1-1d42-4933-9612-617f41a66b1e.png').resize({width:1800,withoutEnlargement:true}).webp({quality:88}).toFile('public/images/tools/stadium-emerald.webp');
