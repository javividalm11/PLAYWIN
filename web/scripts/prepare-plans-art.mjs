import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/images/plans', { recursive: true });
await sharp('C:/Users/Javi0/.codex/generated_images/01a10d15-9e57-7741-a7d4-9d383106630a/exec-c5aa96bd-0101-40e6-a962-6c8e540a2415.png').resize({width:2000,withoutEnlargement:true}).webp({quality:86}).toFile('public/images/plans/stadium-white.webp');
