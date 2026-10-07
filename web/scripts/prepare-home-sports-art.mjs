import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/images/home-sports', { recursive: true });
await sharp('C:/Users/Javi0/.codex/generated_images/01a10d15-9e57-7741-a7d4-9d383106630a/exec-fe5debc7-67a2-4c34-ad2f-e91489e7f006.png')
  .resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 88 }).toFile('public/images/home-sports/stadium-night.webp');
