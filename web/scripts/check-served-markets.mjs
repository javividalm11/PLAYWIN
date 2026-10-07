import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const section = page.locator('.pv-markets');
    await section.locator('.pv-market-copy').waitFor();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const styles = await section.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, illustration: getComputedStyle(el.querySelector('.pv-football-art')).backgroundImage, chips: getComputedStyle(el.querySelector('.pv-market-chips')).display }));
    const asset = await page.request.get('http://127.0.0.1:3000/images/markets/football-pitch.webp');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (response.status() !== 200 || asset.status() !== 200 || !styles.illustration.includes('football-pitch.webp') || styles.chips !== 'grid' || overflow > 1 || errors.length) throw Error(JSON.stringify({width, pageStatus: response.status(), assetStatus: asset.status(), styles, overflow, errors}));
    await section.screenshot({ path: `.screenshots/served-markets-${width}.png`, animations: 'disabled' });
    console.log(JSON.stringify({ width, pageStatus: response.status(), assetStatus: asset.status(), styles, overflow, errors }));
    await page.close();
  }
} finally { await browser.close(); }
