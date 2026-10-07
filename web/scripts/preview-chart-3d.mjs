import ts from 'typescript';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const source = readFileSync('src/components/results-chart-3d.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
writeFileSync('.screenshots/chart-preview.cjs', compiled);
const { ResultsChart3D } = require('../.screenshots/chart-preview.cjs');
const byDay = Array.from({ length: 30 }, (_, i) => ({ day: `2026-09-${String(i + 1).padStart(2, '0')}`, label: String(i + 1).padStart(2, '0'), won: [0, 2, 0, 9, 0, 0, 4, 0, 35, 56, 105, 45, 2, 12][i % 14], lost: [0, 0, 0, 1, 0, 0, 0, 0, 4, 6, 12, 5, 0, 2][i % 14] }));
for (const rows of [byDay, [], byDay.map(d => ({ ...d, won: 0, lost: 0 }))]) {
 const markup = renderToStaticMarkup(React.createElement(ResultsChart3D, { byDay: rows }));
 if (/NaN|Infinity/.test(markup)) throw Error('Invalid chart coordinate');
 if (rows.length && (markup.match(/class="pv-day-column"/g) ?? []).length !== 14) throw Error('Incorrect chart window');
}
const css = readFileSync('src/app/globals.css', 'utf8').split('/* Verified results:')[1];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 700 } });
await page.setContent(`<style>*{box-sizing:border-box}body{background:#f4f5f1;font-family:Arial;padding:40px}p,h3{margin:0}button{font-family:inherit;background:none;border:0} .pv-eyebrow{letter-spacing:.13em;font-weight:700} ${css}</style>${renderToStaticMarkup(React.createElement(ResultsChart3D, { byDay }))}`);
await page.screenshot({ path: '.screenshots/chart-3d-fixture.png' });
await browser.close();
console.log('Static rendering passed: 14-day window, empty data, zero values, finite coordinates. Visual fixture saved.');
