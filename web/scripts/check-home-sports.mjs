import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
mkdirSync('.screenshots', { recursive: true });
const teams = ['Sweden U21', 'North Macedonia U21', 'UAI Urquiza', 'Ituzaingó', 'Northern Ireland', 'Georgia', 'France', 'Belgium'].map((name, i) => ({ id: String(i), name, shortName: ['SWE', 'MKD', 'UAI', 'ITU', 'NIR', 'GEO', 'FRA', 'BEL'][i] }));
const matches = Array.from({ length: 4 }, (_, i) => ({ id: String(i), home: teams[i * 2], away: teams[i * 2 + 1], league: i ? 'Argentina · Primera B' : 'Europa U21', kickoff: '2026-10-05T16:30:00Z', status: 'live', minute: i ? 8 : 81, score: { home: i ? 0 : 2, away: 0 } }));
const predictions = matches.map((match, i) => ({ matchId: match.id, probs: i ? { home: 50, draw: 29, away: 21 } : { home: 99, draw: 1, away: 0 }, pick: { market: i === 0 ? '1X2' : `Menos de ${i === 3 ? '5.5' : '4.5'}`, selection: i === 0 ? 'Sweden U21 o empate (1X)' : `Menos de ${i === 3 ? '5.5' : '4.5'} goles en el partido`, confidence: 'alta', probability: i === 3 ? 92 : 96, fairOdds: i === 3 ? 1.09 : 1.04 }, factors: [], summary: '', generatedAt: '2026-10-05' }));
const compiled = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {HomeSports} from './src/components/home-sports';const matches=${JSON.stringify(matches)},predictions=${JSON.stringify(predictions)};createRoot(document.getElementById('root')).render(<HomeSports live={matches.slice(0,2)} liveCount={2} predictions={new Map(predictions.map(p=>[p.matchId,p]))} picks={[0,2,3].map(i=>({match:matches[i],prediction:predictions[i]}))} noData={false}/>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'preview-next', setup(build) {
  build.onResolve({ filter: /^next\/(link|image)$/ }, args => ({ path: args.path, namespace: 'preview' }));
  build.onResolve({ filter: /^\.\/home-sections$/ }, () => ({ path: 'arrow', namespace: 'preview' }));
  build.onLoad({ filter: /.*/, namespace: 'preview' }, args => ({ contents: args.path === 'next/link' ? `import React from 'react';export default function Link(props){return <a {...props}/>}` : args.path === 'next/image' ? `import React from 'react';export default function Image(props){return <img {...props}/>}` : `import React from 'react';export function Arrow(){return <svg viewBox="0 0 20 20" fill="none" aria-hidden><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}`, loader: 'jsx', resolveDir: process.cwd() }));
} }] });
let css = readFileSync('src/app/globals.css', 'utf8');
const fontImport = css.match(/@import url\([^)]*\);/)[0];
css = css.slice(css.indexOf('/* Homepage live board'));
css = css.replaceAll('/images/home-sports/stadium-night.webp', `data:image/webp;base64,${readFileSync('public/images/home-sports/stadium-night.webp').toString('base64')}`);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
 for (const width of [1672, 1280, 768, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setContent(`<style>${fontImport}*{box-sizing:border-box}body{margin:0;background:#00111b;font-family:Inter,Arial}a{color:inherit;text-decoration:none}h2,h3,p{margin:0}svg{display:block} .pv-sports-teams>div>span{display:flex;align-items:center;justify-content:center;background:#162c3c;border-radius:50%;color:#b5cde0} ${css}</style><div id="root"></div>`);
  await page.addScriptTag({ content: compiled.outputFiles[0].text });
  await page.locator('.pv-sports-live-card').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.screenshots/home-sports-${width}.png`, fullPage: true });
  if (await page.locator('.pv-sports-live-card').count() !== 2 || await page.locator('.pv-sports-pick-card').count() !== 3) throw Error('Card counts failed');
  if (await page.getByRole('link', { name: 'Ver todos (2)' }).getAttribute('href') !== '/en-vivo') throw Error('Live destination failed');
  if (await page.getByRole('link', { name: 'Todos los picks' }).getAttribute('href') !== '/picks') throw Error('Picks destination failed');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const cardOverflow = await page.locator('.pv-sports-live-card, .pv-sports-pick-card').evaluateAll(cards => cards.some(card => card.scrollWidth > card.clientWidth + 1));
  if (overflow > 1 || cardOverflow || errors.length) throw Error(JSON.stringify({ width, overflow, cardOverflow, errors }));
  console.log(JSON.stringify({ width, overflow, cardOverflow, errors, links: 'pass', cards: 'pass' }));
  await page.close();
 }
} finally { await browser.close(); }
