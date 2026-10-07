import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/images/markets', { recursive: true });
await sharp('C:/Users/Javi0/.codex/generated_images/01a10d15-9e57-7741-a7d4-9d383106630a/exec-5c705472-e878-4e66-a8bf-a26799940feb.png').resize({width:1200,withoutEnlargement:true}).webp({quality:90}).toFile('public/images/markets/football-pitch.webp');
