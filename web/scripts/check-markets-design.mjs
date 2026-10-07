import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
mkdirSync('.screenshots', { recursive: true });
const compiled = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {Markets} from './src/components/home-sections';createRoot(document.getElementById('root')).render(<Markets/>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'preview-next', setup(build) {
  build.onResolve({ filter: /^next\/(link|image)$/ }, args => ({ path: args.path, namespace: 'preview' }));
  build.onLoad({ filter: /.*/, namespace: 'preview' }, args => ({ contents: args.path === 'next/link' ? `import React from 'react';export default function Link(props){return <a {...props}/>}` : `import React from 'react';export default function Image(props){return <img {...props}/>}`, loader: 'jsx', resolveDir: process.cwd() }));
} }] });
let css = readFileSync('src/app/globals.css', 'utf8');
const fontImport = css.match(/@import url\([^)]*\);/)[0];
css = css.slice(css.indexOf('.pv-home-lower, .pv-home-footer'));
css = css.replaceAll('/images/markets/football-pitch.webp', `data:image/webp;base64,${readFileSync('public/images/markets/football-pitch.webp').toString('base64')}`);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
 for (const width of [1170, 1440, 900, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 850 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setContent(`<style>${fontImport}:root{--font-inter:Inter;--color-brand-400:#a4e100}*{box-sizing:border-box}body{margin:0;background:#fff;font-family:Inter,Arial}a{color:inherit;text-decoration:none}h2,h3,p{margin:0}svg{display:block}.reveal{opacity:1!important;transform:none!important} ${css}</style><div class="pv-home-lower" id="root"></div>`);
  await page.addScriptTag({ content: compiled.outputFiles[0].text });
  await page.locator('.pv-football').waitFor(); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.screenshots/markets-${width}.png`, fullPage: true });
  if (await page.locator('.pv-market-chips > span').count() !== 6 || await page.locator('.pv-sports > div').count() !== 6) throw Error('Market/sport counts failed');
  if (await page.getByRole('link', { name: 'Explorar fútbol' }).getAttribute('href') !== '/partidos') throw Error('Football link failed');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const clipped = await page.locator('.pv-coming-american-football').evaluate(el => el.scrollWidth > el.clientWidth + 1);
  const collision = await page.evaluate(() => { const title=document.querySelector('.pv-market-copy h2').getBoundingClientRect(),card=document.querySelector('.pv-football').getBoundingClientRect();return title.top < card.bottom && title.bottom > card.top && title.right > card.left; });
  if (overflow > 1 || clipped || collision || errors.length) throw Error(JSON.stringify({ width, overflow, clipped, collision, errors }));
  console.log(JSON.stringify({ width, overflow, clipped, collision, errors, links: 'pass' })); await page.close();
 }
} finally { await browser.close(); }
