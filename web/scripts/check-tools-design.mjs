import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
mkdirSync('.screenshots', { recursive: true });
const compiled = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {Features} from './src/components/home-sections';createRoot(document.getElementById('root')).render(<Features/>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'preview-next', setup(build) {
  build.onResolve({ filter: /^next\/(link|image)$/ }, args => ({ path: args.path, namespace: 'preview' }));
  build.onLoad({ filter: /.*/, namespace: 'preview' }, args => ({ contents: args.path === 'next/link' ? `import React from 'react';export default function Link(props){return <a {...props}/>}` : `import React from 'react';export default function Image(props){return <img {...props}/>}`, loader: 'jsx', resolveDir: process.cwd() }));
} }] });
let css = readFileSync('src/app/globals.css', 'utf8');
const fontImport = css.match(/@import url\([^)]*\);/)[0];
css = css.slice(css.indexOf('.pv-home-lower, .pv-home-footer'));
css = css.replaceAll('/images/tools/stadium-emerald.webp', `data:image/webp;base64,${readFileSync('public/images/tools/stadium-emerald.webp').toString('base64')}`);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
 for (const width of [1142, 1440, 768, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setContent(`<style>${fontImport}:root{--font-inter:Inter;--color-brand-400:#baff00}*{box-sizing:border-box}body{margin:0;background:#00110e;font-family:Inter,Arial}a{color:inherit;text-decoration:none}h2,h3,p{margin:0}svg{display:block}.reveal{opacity:1!important;transform:none!important} ${css}</style><div class="pv-home-lower" id="root"></div>`);
  await page.addScriptTag({ content: compiled.outputFiles[0].text });
  await page.locator('.pv-feature').first().waitFor();
  if (await page.locator('.pv-feature-grid').evaluate(el => getComputedStyle(el).display) !== 'grid') throw Error('Preview styles were not applied');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.screenshots/tools-${width}.png`, fullPage: true });
  if (await page.locator('.pv-feature').count() !== 3) throw Error('Feature count failed');
  for (const [label, href] of [['Descubrir pronósticos','/picks'],['Seguir en vivo','/en-vivo'],['Abrir mi panel','/dashboard']]) if (await page.getByRole('link', { name: label }).getAttribute('href') !== href) throw Error('Feature link failed');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const cardOverflow = await page.locator('.pv-feature').evaluateAll(cards => cards.some(card => card.scrollWidth > card.clientWidth + 1));
  if (overflow > 1 || cardOverflow || errors.length) throw Error(JSON.stringify({ width, overflow, cardOverflow, errors }));
  console.log(JSON.stringify({ width, overflow, cardOverflow, errors, links: 'pass' }));
  await page.close();
 }
} finally { await browser.close(); }
