import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let failures = 0;
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const response = await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.locator('.pv-results').waitFor();
  await page.locator('.pv-results').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.screenshots/redesign-results-${width}.png`, animations: 'disabled' });
  await page.locator('.pv-feature-grid').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.screenshots/redesign-tools-${width}.png`, animations: 'disabled' });
  const firstQuestion = page.locator('.pv-faq-list summary').first();
  await firstQuestion.click();
  if (!(await page.locator('.pv-faq-list details').first().getAttribute('open') === '')) errors.push('FAQ did not open');
  await page.locator('.pv-faq-list summary').nth(1).click();
  if (await page.locator('.pv-faq-list details').first().getAttribute('open') !== null) errors.push('FAQ accordion did not close previous item');
  await page.locator('.pv-home-footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.screenshots/redesign-footer-${width}.png`, animations: 'disabled' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 1) errors.push(`Horizontal overflow: ${overflow}px`);
  const hrefs = await page.locator('.pv-home-lower a, .pv-home-footer a').evaluateAll(nodes => [...new Set(nodes.map(n => n.getAttribute('href')))]);
  console.log(JSON.stringify({ width, status: response.status(), overflow, errors, hrefs }));
  if (errors.length) failures++;
  await page.close();
}
await browser.close();
process.exitCode = failures ? 1 : 0;

