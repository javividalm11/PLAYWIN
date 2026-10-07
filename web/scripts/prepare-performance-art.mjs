import sharp from 'sharp';
const root = 'C:/Users/Javi0/.codex/generated_images/01a10d15-9e57-7741-a7d4-9d383106630a/';
await sharp(root + 'exec-8e1338ac-3ada-4098-9096-12bd00f6277e.png').resize(1800, 1013, { fit: 'cover' }).webp({ quality: 87 }).toFile('public/images/performance/stadium.webp');
await sharp(root + 'exec-e140464f-ed6f-4d89-ad14-c7e1725d06d7.png').trim().resize({ height: 800 }).webp({ quality: 90 }).toFile('public/images/performance/player.webp');
console.log('Performance artwork saved.');
