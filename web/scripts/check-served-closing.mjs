import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1672, 1440, 1280, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    const cta = page.locator('.pv-final');
    const footer = page.locator('.pv-home-footer');
    await cta.scrollIntoViewIfNeeded();
    await cta.screenshot({ path: `.screenshots/served-closing-cta-${width}.png`, animations: 'disabled' });
    await footer.screenshot({ path: `.screenshots/served-closing-footer-${width}.png`, animations: 'disabled' });
    if (await cta.locator('a[href="/registro"]').count() !== 1 || await cta.locator('a[href="/resultados"]').count() !== 1) throw Error('CTA links failed');
    if (await footer.locator('nav').count() !== 3 || await footer.locator('nav a').count() !== 11) throw Error('Footer navigation failed');
    const service = footer.locator('#informacion-servicio');
    await service.locator('summary').focus();
    await page.keyboard.press('Space');
    if (await service.getAttribute('open') === null) throw Error('Service keyboard toggle failed');
    await page.keyboard.press('Space');
    if (await service.getAttribute('open') !== null) throw Error('Service collapse failed');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const clipping = await cta.locator('h2').evaluate(el => el.scrollWidth > el.clientWidth + 1);
    if (overflow > 1 || clipping || errors.length) throw Error(JSON.stringify({ width, overflow, clipping, errors }));
    console.log(JSON.stringify({ width, overflow, clipping, links: 'pass', keyboard: 'pass', errors }));
    await page.close();
  }
} finally { await browser.close(); }
