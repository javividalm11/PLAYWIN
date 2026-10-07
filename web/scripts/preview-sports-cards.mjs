import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const compile = s => ts.transpileModule(s, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
writeFileSync('.screenshots/card-icons.cjs', compile(readFileSync('src/components/icons.tsx', 'utf8')));
const original = readFileSync('src/components/home-sections.tsx', 'utf8');
const component = original.slice(original.indexOf('export function KpiCard'), original.indexOf('const STEPS'));
writeFileSync('.screenshots/sports-cards.cjs', compile('import { InterfaceIcon } from "./card-icons.cjs";\n' + component));
const { KpiCard } = require('../.screenshots/sports-cards.cjs');
const props = [
 { trend: 12, accent: true, label: 'Acierto histórico', value: '88%', hint: 'sobre 1,893 liquidados' },
 { trend: 8, artwork: 'confidence', icon: 'shield', label: 'Picks de alta confianza', value: '89%', hint: 'acierto histórico de esta selección', status: 'Confianza del modelo ≥ 85%' },
 { trend: 0, artwork: 'streak', icon: 'trophy', label: 'Racha de logros', value: '1 ✗', hint: 'fallos seguidos', status: 'Últimos picks liquidados' },
 { trend: -15, artwork: 'transparency', icon: 'crown', label: 'Acumulado mensual', value: '222', hint: 'visibles, sin borrar', status: 'Transparencia, sin excepciones' }
];
let cards = props.map(p => renderToStaticMarkup(React.createElement(KpiCard, p))).join('');
for (const name of ['accuracy', 'confidence', 'streak', 'transparency']) cards = cards.replace(`/images/results/${name}.webp`, `data:image/webp;base64,${readFileSync(`public/images/results/${name}.webp`).toString('base64')}`);
const css = readFileSync('src/app/globals.css', 'utf8').split('/* Home:')[1];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
for (const width of [1440, 390]) {
 const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 470 : 850 } });
 await page.setContent(`<style>:root{--color-brand-500:#a4e100;--font-inter:Arial}*{box-sizing:border-box}body{margin:0;background:#f4f5f1;font-family:Arial}p{margin:0} .preview-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:40px;max-width:1280px;margin:auto} @media(max-width:760px){.preview-grid{grid-template-columns:1fr;padding:22px}}${css}</style><div class="pv-home-lower preview-grid">${cards}</div>`);
 await page.evaluate(() => Promise.all([...document.querySelectorAll('.pv-kpi-artwork')].map(el => new Promise(resolve => { const img = new Image(); img.onload = resolve; img.src = getComputedStyle(el).backgroundImage.slice(5,-2); }))));
 await page.screenshot({ path: `.screenshots/sports-cards-${width}.png` });
 const overflow = await page.evaluate(() => document.documentElement.scrollWidth-innerWidth);
 if (overflow > 0) throw Error('Horizontal overflow');
 console.log(JSON.stringify({ width, cards: await page.locator('.pv-kpi').count(), overflow }));
 await page.close();
}
await browser.close();

