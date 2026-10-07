import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('.screenshots', { recursive: true });
const rows = Array.from({ length: 30 }, (_, i) => {
 const date = new Date(Date.UTC(2026, 8, 6 + i));
 return { day: date.toISOString().slice(0, 10), label: String(date.getUTCDate()).padStart(2, '0'), won: i < 25 ? (i % 5 ? 0 : 2) : [110, 195, 292, 202, 3][i-25], lost: i < 25 ? (i % 5 ? 0 : 1) : [10, 25, 46, 25, 1][i-25] };
});
const compiled = await build({ stdin: { contents: `import React from 'react';import { createRoot } from 'react-dom/client';import { ResultsChart3D } from './src/components/results-chart-3d';createRoot(document.getElementById('root')).render(React.createElement(ResultsChart3D,{byDay:${JSON.stringify(rows)}}));`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } });
writeFileSync('.screenshots/performance-preview.bundle.js', compiled.outputFiles[0].text);
let css = readFileSync('src/app/globals.css', 'utf8'); css = css.slice(css.indexOf('.pv-home-lower, .pv-home-footer'));
for (const name of ['stadium-v2', 'player-profile-full']) css = css.replaceAll(`/images/performance/${name}.webp`, `data:image/webp;base64,${readFileSync(`public/images/performance/${name}.webp`).toString('base64')}`);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
for (const width of [1672, 1440, 390]) {
 const page = await browser.newPage({ viewport: { width, height: width === 390 ? 1000 : 960 }, reducedMotion: 'reduce' });
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 await page.setContent(`<style>:root{--font-inter:Arial;--color-brand-500:#a4e100}*{box-sizing:border-box}body{margin:0;background:#f4f5f1;font-family:Arial}p,h3{margin:0}button{font-family:inherit;background:none;border:0}svg{display:block}#root{max-width:${width === 1672 ? 1672 : 1240}px;margin:auto} ${css}</style><div id="root"></div>`);
 await page.addScriptTag({ content: compiled.outputFiles[0].text });
 const chart = page.locator('.pv-chart3d'); await chart.waitFor();
 const tooltip = chart.locator('.pv-performance-tooltip');
 const opacity = () => tooltip.evaluate(el => getComputedStyle(el).opacity);
 if (await opacity() !== '0') throw Error('Tooltip must start hidden');
 if (width !== 390) {
  const target = chart.locator('.pv-bar-hit-area .pv-column-won rect').last();
  await target.hover();
  if (await opacity() !== '1') throw Error('Tooltip must appear over a bar');
  const svg = chart.locator('.pv-chart-svg');
  await svg.hover({ position: { x: 45, y: 30 } });
  if (await opacity() !== '0') throw Error('Tooltip must hide over empty chart space');
  await target.hover();
  await chart.locator('.pv-chart3d-head h3').hover();
  if (await opacity() !== '0') throw Error('Tooltip must hide outside the chart');
 }
 await page.evaluate(() => Promise.all([...document.querySelectorAll('.pv-performance-scene,.pv-performance-player')].map(el => new Promise(resolve => { const img = new Image(); img.onload = resolve; img.src = getComputedStyle(el).backgroundImage.slice(5,-2); }))));
 await page.screenshot({ path: `.screenshots/performance-glass-${width}.png`, fullPage: true });
 await chart.getByRole('button', { name: '30 días' }).click();
 if (await chart.locator('.pv-day-column').count() !== 30) throw Error('30-day range failed');
 await chart.getByRole('button', { name: '14 días' }).click();
 const losses = chart.locator('.pv-performance-counts').getByRole('button', { name: /Fallados/ });
 await losses.click(); if (await chart.locator('.pv-column-lost').count()) throw Error('Loss filter failed'); await losses.click();
 const bar = chart.locator('.pv-day-column').last(); await bar.focus(); await page.keyboard.press('Enter');
 if (await opacity() !== '1') throw Error('Tooltip must appear on keyboard focus');
 if (!(await chart.locator('.pv-performance-date').innerText()).includes('5 oct')) throw Error('Keyboard selection failed');
 if (!(await chart.locator('.pv-chart-detail').innerText()).includes('4')) throw Error('Selected total failed');
 const view = chart.getByRole('button', { name: /VISTA 3D/ }); await view.click();
 if (await opacity() !== '0') throw Error('Tooltip must hide when focus leaves the bar');
 if (!(await chart.getByRole('button', { name: /VISTA 2D/ }).count())) throw Error('2D switch failed');
 const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
 if (overflow > 1 || errors.length) throw Error(JSON.stringify({ overflow, errors }));
 console.log(JSON.stringify({ width, overflow, errors, tooltip: 'pass', period: 'pass', filter: 'pass', keyboard: 'pass', view2D: 'pass' }));
 await page.close();
}
await browser.close();




