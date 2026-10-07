import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of process.argv.length > 2 ? process.argv.slice(2).map(Number) : [1755, 1440, 1280, 1152, 1024, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const header = page.locator('.pv-navbar');
    await page.evaluate(() => document.fonts.ready);
    if (width > 1150) {
      await header.locator('.pv-navbar-login').waitFor({ timeout: 30000 });
      const boxes = await Promise.all(['.pv-navbar-brand', '.pv-navbar-links', '.pv-navbar-auth'].map(s => header.locator(s).boundingBox()));
      if (boxes.some((box, i) => i > 0 && boxes[i-1].x + boxes[i-1].width > box.x + 1)) throw Error(`Header overlap at ${width}`);
      if (await header.locator('.pv-navbar-links a').count() !== 6 || await header.locator('.pv-navbar-links .is-active').count() !== 1) throw Error('Desktop navigation failed');
    } else {
      const toggle = header.locator('.pv-navbar-menu');
      await toggle.click();
      const panel = page.locator('.pv-navbar-mobile-panel');
      await panel.waitFor({ state: 'visible' });
      if (await panel.locator('nav a').count() !== 6 || await page.evaluate(() => document.body.style.overflow) !== 'hidden') throw Error('Mobile navigation failed');
      await panel.locator('.pv-navbar-login').waitFor({ timeout: 30000 });
      await page.screenshot({ path: `.screenshots/served-navbar-menu-${width}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
      if (await toggle.getAttribute('aria-expanded') !== 'false' || await page.evaluate(() => document.body.style.overflow) === 'hidden') throw Error('Escape/scroll restoration failed');
      await toggle.click();
      await panel.locator('a[href="/precios"]').click();
      await page.waitForURL('**/precios');
      await page.waitForTimeout(250);
      if (await toggle.getAttribute('aria-expanded') !== 'false') throw Error('Menu did not close on navigation');
      await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    }
    await header.screenshot({ path: `.screenshots/served-navbar-${width}.png`, animations: 'disabled' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const headerBounds = await header.boundingBox();
    const navbarOverflow = headerBounds.x < 0 || headerBounds.x + headerBounds.width > width + 1;
    // At 320px the existing model-performance summary extends 6px; verify
    // this navbar's bounds independently of that unrelated section.
    if (navbarOverflow || (width >= 390 && overflow > 1) || errors.length) throw Error(JSON.stringify({ width, overflow, navbarOverflow, errors }));
    console.log(JSON.stringify({ width, pageOverflow: overflow, navbarOverflow, errors, navigation: 'pass', mobile: width <= 1150 ? 'pass' : 'desktop' }));
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://127.0.0.1:3000/precios', { waitUntil: 'domcontentloaded' });
  if (await page.locator('.pv-navbar-links a[aria-current="page"]').getAttribute('href') !== '/precios') throw Error('Route active state failed');
  console.log('Pricing route active state: pass');
  await page.close();
} finally { await browser.close(); }
