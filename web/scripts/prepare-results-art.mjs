import sharp from 'sharp';
const root = 'C:/Users/Javi0/.codex/generated_images/01a10d15-9e57-7741-a7d4-9d383106630a/';
const assets = { accuracy: 'exec-89a0f26f-69f2-48c2-b2d6-c6422007208c.png', confidence: 'exec-281d4c5c-f2c6-4b05-9346-6b18622a5471.png', streak: 'exec-d2a94d52-ca54-4ea3-ae90-866caa11529e.png', transparency: 'exec-4b6c1df9-ee75-4226-bc24-50409f80dcea.png' };
for (const [name, file] of Object.entries(assets)) {
 const output = `public/images/results/${name}.webp`;
 await sharp(root + file).resize(960, 960, { fit: 'cover' }).webp({ quality: 86 }).toFile(output);
 console.log(output);
}
